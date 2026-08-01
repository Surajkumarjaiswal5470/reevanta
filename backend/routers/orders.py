from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_user, get_current_admin
from models.order import OrderCreate, StatusUpdate, ReturnItemRequest, ReturnStatusUpdate

router = APIRouter(prefix="/orders", tags=["Orders"])

ORDER_STATUSES = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"]
RETURN_STATUSES = ["Return Requested", "Pickup Scheduled", "Item Inspected", "Refund Processed", "Return Rejected"]

def build_timeline(status: str, placed_at_iso: str = None):
    """Build order tracking timeline based on current status."""
    now = datetime.now(timezone.utc)
    steps = []
    idx = ORDER_STATUSES.index(status) if status in ORDER_STATUSES else 0
    for i, s in enumerate(ORDER_STATUSES[:5]):
        if i < idx:
            eta = (now - timedelta(hours=(idx - i) * 12)).isoformat()
            steps.append({"status": s, "completed": True, "timestamp": eta})
        elif i == idx:
            steps.append({"status": s, "completed": True, "timestamp": now.isoformat(), "current": True})
        else:
            eta = (now + timedelta(days=(i - idx))).isoformat()
            steps.append({"status": s, "completed": False, "eta": eta})
    return steps

def build_return_timeline(return_status: str, return_date_iso: str = None):
    """Build return & refund timeline for Amazon/Meesho style return tracking."""
    now = datetime.now(timezone.utc)
    steps = []
    idx = RETURN_STATUSES.index(return_status) if return_status in RETURN_STATUSES else 0
    
    status_labels = [
        ("Return Requested", "Return request submitted & confirmed"),
        ("Pickup Scheduled", "Doorstep pickup assigned via Kathmandu courier"),
        ("Item Inspected", "Quality check verified at Kathmandu hub"),
        ("Refund Processed", "Refund credited to Bank Account / eSewa")
    ]

    for i, (s, label) in enumerate(status_labels):
        if i < idx:
            eta = (now - timedelta(hours=(idx - i) * 18)).isoformat()
            steps.append({"status": s, "label": label, "completed": True, "timestamp": eta})
        elif i == idx:
            steps.append({"status": s, "label": label, "completed": True, "timestamp": now.isoformat(), "current": True})
        else:
            eta = (now + timedelta(days=(i - idx) + 1)).isoformat()
            steps.append({"status": s, "label": label, "completed": False, "eta": eta})
    return steps


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except Exception:
        return None

from core.rate_limiter import rate_limiter

@router.post("")
async def create_order(inp: OrderCreate, request: Request, user: dict = Depends(get_current_user)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    # Fraud Protection: Velocity check (max 5 order submissions per 10 mins per IP)
    if rate_limiter.is_checkout_velocity_exceeded(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Order submission velocity limit exceeded. Please wait a few minutes before trying again."
        )

    # Fraud Protection: Cart Sanity Checks
    if not inp.items or len(inp.items) == 0:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart.")
    if inp.total <= 0 or inp.total > 150000:
        raise HTTPException(status_code=400, detail="Invalid order total amount detected.")

    # At this point ``user`` is guaranteed to be authenticated (or a 401 is raised).
    doc = inp.model_dump()
    doc["user_id"] = user["id"]
    doc["userName"] = user.get("name") or inp.address.fullName
    doc["userEmail"] = user.get("email") or "guest@reevanta.com"

    doc["status"] = "Order Placed"
    now_iso = datetime.now(timezone.utc).isoformat()
    doc["placed_at"] = now_iso
    order_seq = await db.orders.count_documents({}) + 1001
    doc["order_number"] = f"RV-{order_seq}"

    res = await db.orders.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    doc["timeline"] = build_timeline("Order Placed", now_iso)
    
    # Mark user cart as converted so abandoned cart reminder is not triggered
    if user:
        await db.carts.update_one({"user_id": user["id"]}, {"$set": {"is_converted": True, "items": []}})
        
    return doc


@router.get("/mine")
async def get_my_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}).sort("placed_at", -1).to_list(100)
    out = []
    for o in orders:
        s = serialize_doc(o)
        s["timeline"] = build_timeline(s.get("status", "Order Placed"))
        if s.get("return_info"):
            ret_status = s["return_info"].get("return_status", "Return Requested")
            s["return_timeline"] = build_return_timeline(ret_status)
        out.append(s)
    return out


@router.get("/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(order.get("user_id")) != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    s = serialize_doc(order)
    s["timeline"] = build_timeline(s.get("status", "Order Placed"))
    if s.get("return_info"):
        ret_status = s["return_info"].get("return_status", "Return Requested")
        s["return_timeline"] = build_return_timeline(ret_status)
    return s


@router.post("/{order_id}/return")
async def create_return_request(order_id: str, inp: ReturnItemRequest, user: dict = Depends(get_current_user)):
    obj_id = to_object_id(order_id)
    order = await db.orders.find_one({"_id": obj_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(order.get("user_id")) != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    status = order.get("status")
    if status != "Delivered":
        raise HTTPException(
            status_code=400,
            detail="Return requests can only be submitted after the item has been delivered."
        )
    
    if order.get("return_info"):
        raise HTTPException(
            status_code=400,
            detail=f"A return request ({order['return_info'].get('return_id')}) has already been submitted for this order."
        )

    # Validate 7 day return window
    delivered_at_str = order.get("delivered_at") or order.get("placed_at")
    try:
        delivered_dt = datetime.fromisoformat(delivered_at_str.replace("Z", "+00:00"))
        deadline_dt = delivered_dt + timedelta(days=7)
        if datetime.now(timezone.utc) > deadline_dt:
            raise HTTPException(
                status_code=400,
                detail="The 7-day return window for this order has expired."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        pass # proceed if date parsing fails

    ret_id = f"RET-{int(datetime.now(timezone.utc).timestamp())}"
    return_doc = {
        "return_id": ret_id,
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "return_status": "Return Requested",
        "reason": inp.reason,
        "reason_details": inp.reasonDetails,
        "proof_image": inp.proofImage,
        "selected_items": inp.selectedItems or order.get("items", []),
        "refund_method": inp.refundMethod,
        "bank_details": inp.bankDetails.model_dump() if inp.bankDetails else None,
        "wallet_details": inp.walletDetails.model_dump() if inp.walletDetails else None,
        "pickup_address": inp.pickupAddress or order.get("address", {})
    }

    await db.orders.update_one(
        {"_id": obj_id},
        {"$set": {"return_info": return_doc, "return_status": "Return Requested"}}
    )

    return {
        "message": "Return request submitted successfully!",
        "return_id": ret_id,
        "return_info": return_doc,
        "return_timeline": build_return_timeline("Return Requested")
    }


@router.get("")
async def list_orders_admin(admin: dict = Depends(get_current_admin)):
    from routers.admin.orders import list_orders_admin as admin_list_orders
    return await admin_list_orders(admin)


@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, inp: StatusUpdate, admin: dict = Depends(get_current_admin)):
    from routers.admin.orders import update_order_status as admin_update_order_status
    return await admin_update_order_status(order_id, inp, admin)


@router.post("/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    obj_id = to_object_id(order_id)
    order = await db.orders.find_one({"_id": obj_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(order.get("user_id")) != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if order.get("status") in ["Shipped", "Out for Delivery", "Delivered"]:
        raise HTTPException(status_code=400, detail="Cannot cancel order that has already shipped")
    await db.orders.update_one({"_id": obj_id}, {"$set": {"status": "Cancelled"}})
    return {"message": "Order cancelled"}


from fastapi.responses import HTMLResponse

@router.get("/{order_id}/invoice", response_class=HTMLResponse)
async def get_order_invoice(order_id: str, user: dict = Depends(get_current_user)):
    """Generate enterprise printable/downloadable Tax Invoice for order."""
    obj_id = to_object_id(order_id)
    order = await db.orders.find_one({"_id": obj_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(order.get("user_id")) != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    addr = order.get("address", {})
    items = order.get("items", [])
    
    items_rows_html = "".join([
        f"""
        <tr style="border-bottom: 1px solid #E8DFC9;">
            <td style="padding: 12px; font-weight: 600;">{item.get('name', 'Product')}</td>
            <td style="padding: 12px; text-align: center;">{item.get('selectedSize', 'N/A')} / {item.get('selectedColor', 'N/A')}</td>
            <td style="padding: 12px; text-align: center;">{item.get('qty', 1)}</td>
            <td style="padding: 12px; text-align: right;">₹{item.get('price', 0)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700;">₹{item.get('price', 0) * item.get('qty', 1)}</td>
        </tr>
        """
        for item in items
    ])

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Invoice #{order.get('order_number', 'RV-1001')}</title>
        <style>
            body {{ font-family: 'Helvetica Neue', Arial, sans-serif; color: #2D2118; margin: 40px; background: #fff; }}
            .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #5C1E1E; padding-bottom: 20px; }}
            .brand {{ font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #5C1E1E; }}
            .invoice-title {{ font-size: 20px; font-weight: 700; color: #8B7355; text-transform: uppercase; }}
            .meta-grid {{ display: flex; justify-content: space-between; margin: 30px 0; font-size: 13px; line-height: 1.6; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }}
            th {{ background: #FAF5EC; color: #5C1E1E; padding: 12px; text-transform: uppercase; font-size: 11px; font-weight: 800; border-bottom: 2px solid #E8DFC9; }}
            .totals {{ margin-top: 30px; float: right; width: 300px; font-size: 13px; }}
            .totals-row {{ display: flex; justify-content: space-between; padding: 6px 0; }}
            .grand-total {{ font-size: 16px; font-weight: 900; color: #5C1E1E; border-top: 2px solid #5C1E1E; padding-top: 10px; margin-top: 6px; }}
            .footer {{ margin-top: 100px; text-align: center; font-size: 11px; color: #8B7355; border-top: 1px solid #E8DFC9; padding-top: 20px; }}
            @media print {{ body {{ margin: 0; }} }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="brand">RIVAANTA</div>
                <div style="font-size: 11px; color: #8B7355;">LUXURY ETHNIC WEAR & COSMETICS</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">PAN/VAT Reg: 609847120 | Kathmandu, Nepal</div>
            </div>
            <div style="text-align: right;">
                <div class="invoice-title">Tax Invoice</div>
                <div style="font-size: 13px; font-weight: 700;">#{order.get('order_number', 'RV-1001')}</div>
                <div style="font-size: 11px; color: #666;">Date: {order.get('placed_at', '')[:10]}</div>
            </div>
        </div>

        <div class="meta-grid">
            <div>
                <strong style="color: #5C1E1E; text-transform: uppercase;">Billed To:</strong><br>
                {addr.get('fullName', 'Customer')}<br>
                {addr.get('line1', '')}<br>
                {addr.get('city', '')}, {addr.get('pincode', '')}<br>
                Phone: {addr.get('phone', 'N/A')}
            </div>
            <div style="text-align: right;">
                <strong style="color: #5C1E1E; text-transform: uppercase;">Payment Details:</strong><br>
                Method: {order.get('paymentMethod', 'Cash on Delivery')}<br>
                Status: {order.get('status', 'Order Placed')}<br>
                Voucher Code: {order.get('voucherCode') or 'None'}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="text-align: left;">Item Description</th>
                    <th style="text-align: center;">Variant (Size/Color)</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                {items_rows_html}
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row"><span>Subtotal:</span><strong>₹{order.get('subtotal', 0)}</strong></div>
            <div class="totals-row"><span>Discount:</span><strong style="color: green;">-₹{order.get('discount', 0)}</strong></div>
            <div class="totals-row"><span>Shipping Fee:</span><strong>₹{order.get('shipping', 0)}</strong></div>
            <div class="totals-row grand-total"><span>Grand Total:</span><span>₹{order.get('total', 0)}</span></div>
        </div>

        <div style="clear: both;"></div>

        <div class="footer">
            Thank you for shopping with RIVAANTA Luxury Wear!<br>
            For support or returns, visit https://therivaanta.com or contact support@therivaanta.com
        </div>

        <script>
            // Auto trigger print dialog if requested
            if (window.location.search.includes('print=true')) {{
                window.print();
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

