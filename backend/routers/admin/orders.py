"""
Admin Orders, Returns & Refunds Operations Router
Handles Orders, Return Requests, Refund Approvals, Exchange Approvals, Proof Inspection, and Return Analytics.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.order import (
    StatusUpdate, ReturnStatusUpdate, OrderEditSchema,
    TrackingUpdate, ShipmentPackage, GiftOrderMeta,
    RefundApprovalRequest, ExchangeApproveRequest
)
from routers.orders import build_timeline, build_return_timeline, ORDER_STATUSES, RETURN_STATUSES

router = APIRouter(prefix="", tags=["Admin - Orders & Returns"])


# ──────────────────── ORDERS ENDPOINTS ────────────────────

@router.get("/orders")
async def list_orders_admin(admin: dict = Depends(get_current_admin)):
    """List all orders with timelines, split shipments, courier tracking, and audit logs."""
    orders = await db.orders.find({}).sort("placed_at", -1).to_list(200)
    out = []
    for o in orders:
        s = serialize_doc(o)
        s["timeline"] = build_timeline(s.get("status", "Order Placed"))
        if s.get("return_info"):
            ret_status = s["return_info"].get("return_status", "Return Requested")
            s["return_timeline"] = build_return_timeline(ret_status)
        out.append(s)
    return out


@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, admin: dict = Depends(get_current_admin)):
    """Fetch single order details."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    s = serialize_doc(order)
    s["timeline"] = build_timeline(s.get("status", "Order Placed"))
    return s


@router.put("/orders/{order_id}")
async def edit_order(order_id: str, updates: OrderEditSchema, admin: dict = Depends(get_current_admin)):
    """Edit order items, shipping address, or customer contact details."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_dict = updates.model_dump(exclude_unset=True, exclude_none=True)

    if "items" in update_dict:
        items_list = update_dict["items"]
        new_total = sum(i.get("price", 0) * i.get("qty", 1) for i in items_list)
        update_dict["total"] = new_total

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": "Order Edited",
        "notes": "Updated order items / shipping address details"
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$set": update_dict,
            "$push": {"timeline_events": event}
        }
    )

    updated = await db.orders.find_one({"_id": to_object_id(order_id)})
    return serialize_doc(updated)


@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, inp: StatusUpdate, admin: dict = Depends(get_current_admin)):
    """Update order fulfillment status with audit logging."""
    if inp.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {ORDER_STATUSES}")

    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.get("status", "Order Placed")

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": inp.actor or admin.get("email", "Admin Staff"),
        "action": f"Status changed to '{inp.status}'",
        "old_status": old_status,
        "new_status": inp.status,
        "notes": inp.notes or ""
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$set": {"status": inp.status, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"timeline_events": event}
        }
    )

    return {
        "message": f"Order status updated to '{inp.status}'",
        "status": inp.status,
        "timeline": build_timeline(inp.status)
    }


@router.patch("/orders/{order_id}/tracking")
async def update_tracking(order_id: str, inp: TrackingUpdate, admin: dict = Depends(get_current_admin)):
    """Assign courier name and primary tracking number."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": f"Assigned tracking number '{inp.trackingNumber}' via {inp.courier}",
        "notes": inp.trackingUrl or ""
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$set": {
                "courier": inp.courier,
                "tracking_number": inp.trackingNumber,
                "tracking_url": inp.trackingUrl,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"timeline_events": event}
        }
    )

    return {"message": "Tracking details saved successfully"}


@router.post("/orders/{order_id}/shipments")
async def add_split_shipment(order_id: str, pkg: ShipmentPackage, admin: dict = Depends(get_current_admin)):
    """Create a split / partial shipment package for an order."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    shipment_doc = pkg.model_dump()
    shipment_doc["shipment_id"] = f"PKG-{(order.get('shipments', []) or []).__len__() + 1:03d}"
    shipment_doc["shipped_at"] = datetime.now(timezone.utc).isoformat()

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": f"Created split shipment package {shipment_doc['shipment_id']}",
        "notes": f"Tracking: {pkg.tracking_number} via {pkg.courier}"
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$push": {
                "shipments": shipment_doc,
                "timeline_events": event
            }
        }
    )

    updated = await db.orders.find_one({"_id": to_object_id(order_id)})
    return serialize_doc(updated)


@router.patch("/orders/{order_id}/gift")
async def update_gift_options(order_id: str, gift: GiftOrderMeta, admin: dict = Depends(get_current_admin)):
    """Update gift wrapping options and personalized gift message."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {"$set": {"gift_info": gift.model_dump()}}
    )

    return {"message": "Gift order options updated"}


# ──────────────────── RETURNS, REFUNDS & EXCHANGES ────────────────────

@router.get("/returns")
async def list_returns_admin(admin: dict = Depends(get_current_admin)):
    """List all orders with active return, refund, or exchange requests."""
    orders = await db.orders.find({
        "$or": [
            {"return_info": {"$ne": None}},
            {"return_status": {"$ne": None}},
            {"status": {"$in": ["Returned", "Refunded"]}}
        ]
    }).sort("updated_at", -1).to_list(200)

    out = []
    for o in orders:
        s = serialize_doc(o)
        ret_status = s.get("return_status") or (s.get("return_info") or {}).get("return_status", "Return Requested")
        s["return_timeline"] = build_return_timeline(ret_status)
        out.append(s)
    return out


@router.get("/returns/analytics")
async def get_returns_analytics(admin: dict = Depends(get_current_admin)):
    """Aggregate return volume (₹), approval rates, return reasons, and payout methods."""
    return_orders = await db.orders.find({
        "$or": [
            {"return_info": {"$ne": None}},
            {"return_status": {"$ne": None}},
            {"status": {"$in": ["Returned", "Refunded"]}}
        ]
    }).to_list(1000)

    total_returns_count = len(return_orders)
    total_refund_amount = sum(float(o.get("total", 0)) for o in return_orders if o.get("return_status") == "Refund Processed" or o.get("status") == "Refunded")
    
    approved_count = sum(1 for o in return_orders if o.get("return_status") in ["Refund Processed", "Item Inspected", "Pickup Scheduled"])
    approval_rate = round((approved_count / total_returns_count) * 100, 1) if total_returns_count > 0 else 100.0

    # Reason breakdown
    reasons = {}
    for o in return_orders:
        r_info = o.get("return_info") or {}
        reason = r_info.get("reason", "Other / Changed Mind")
        reasons[reason] = reasons.get(reason, 0) + 1

    return {
        "total_returns_count": total_returns_count,
        "total_refund_amount": round(total_refund_amount, 2),
        "approval_rate_percent": approval_rate,
        "reasons_breakdown": reasons
    }


@router.post("/returns/{order_id}/approve")
async def approve_refund(order_id: str, inp: RefundApprovalRequest, admin: dict = Depends(get_current_admin)):
    """Approve or reject a refund request, set payout status, and update order status."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_ret_status = "Refund Processed" if inp.approval_status == "APPROVED" else "Return Rejected"
    new_order_status = "Refunded" if inp.approval_status == "APPROVED" else order.get("status")

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": f"Refund Approval decision: {inp.approval_status}",
        "notes": f"Amount: ₹{inp.refund_amount} | Payout: {inp.payout_status}. {inp.notes or ''}"
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$set": {
                "return_status": new_ret_status,
                "status": new_order_status,
                "return_info.return_status": new_ret_status,
                "return_info.approval_status": inp.approval_status,
                "return_info.payout_status": inp.payout_status,
                "return_info.refund_amount": inp.refund_amount,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"timeline_events": event}
        }
    )

    updated = await db.orders.find_one({"_id": to_object_id(order_id)})
    return serialize_doc(updated)


@router.post("/returns/{order_id}/exchange")
async def approve_exchange(order_id: str, inp: ExchangeApproveRequest, admin: dict = Depends(get_current_admin)):
    """Approve a size/color replacement exchange request."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": "Exchange Approved",
        "notes": f"Replacement Size: {inp.replacement_size}, Color: {inp.replacement_color}"
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$set": {
                "return_status": "Exchange Shipped",
                "return_info.is_exchange": True,
                "return_info.replacement_size": inp.replacement_size,
                "return_info.replacement_color": inp.replacement_color,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"timeline_events": event}
        }
    )

    updated = await db.orders.find_one({"_id": to_object_id(order_id)})
    return serialize_doc(updated)
