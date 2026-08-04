"""
Public Voucher & Coupon Evaluation Router
Evaluates Coupon Codes, BXGY, Flash Sales, Category/Brand Discounts, and Free Shipping.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc
from models.voucher import VoucherApplyRequest

router = APIRouter(prefix="/vouchers", tags=["Vouchers"])


@router.get("/active")
async def get_active_vouchers():
    """List active customer vouchers for cart auto-apply and coupon list."""
    vouchers = await db.vouchers.find({"isActive": True}).sort("created_at", -1).to_list(50)
    return [serialize_doc(v) for v in vouchers]


@router.post("/apply")
async def apply_voucher(inp: VoucherApplyRequest):
    """Evaluate coupon rules against customer cart and return calculated savings."""
    code_clean = inp.code.strip().upper()
    voucher = await db.vouchers.find_one({"code": code_clean, "isActive": True})
    if not voucher:
        raise HTTPException(status_code=400, detail="Invalid or inactive voucher code")

    # 1. Check Expiry Date
    exp = voucher.get("expiryDate")
    if exp:
        try:
            exp_date = datetime.strptime(exp, "%Y-%m-%d").date()
            if datetime.now(timezone.utc).date() > exp_date:
                raise HTTPException(status_code=400, detail=f"Voucher '{code_clean}' expired on {exp}")
        except Exception:
            pass

    # 2. Check Flash Sale Timestamps
    f_start = voucher.get("flashSaleStart")
    f_end = voucher.get("flashSaleEnd")
    now_iso = datetime.now(timezone.utc).isoformat()
    if f_start and now_iso < f_start:
        raise HTTPException(status_code=400, detail=f"Flash sale for '{code_clean}' has not started yet")
    if f_end and now_iso > f_end:
        raise HTTPException(status_code=400, detail=f"Flash sale for '{code_clean}' has ended")

    # 3. Check Usage Limits
    max_uses = voucher.get("maxUses", 500)
    curr_uses = voucher.get("currentUses", 0)
    if curr_uses >= max_uses:
        raise HTTPException(status_code=400, detail=f"Voucher '{code_clean}' has reached its maximum redemption limit")

    # 4. Check minimum order value
    min_val = float(voucher.get("minOrderValue", 0))
    if inp.cartTotal < min_val:
        raise HTTPException(
            status_code=400,
            detail=f"Code '{code_clean}' requires a minimum cart total of ₹{min_val}."
        )

    # 5. Check specific customer restriction
    target_email = voucher.get("assignedCustomerEmail") or voucher.get("referralUserEmail")
    if target_email and inp.customerEmail and target_email.lower() != inp.customerEmail.lower():
        raise HTTPException(status_code=400, detail="This voucher code is exclusive to another customer account.")

    # 6. Calculate discount based on rules
    disc_type = voucher.get("discountType", "fixed")
    disc_val = float(voucher.get("discountValue", 0))
    cart_total = float(inp.cartTotal)
    free_shipping = bool(voucher.get("freeShipping") or disc_type == "free_shipping")

    discount_amount = 0.0

    if disc_type == "fixed":
        discount_amount = min(disc_val, cart_total)

    elif disc_type in ["percentage", "flash_sale"]:
        raw_disc = (cart_total * disc_val) / 100.0
        max_disc = voucher.get("maxDiscount")
        discount_amount = min(raw_disc, float(max_disc)) if max_disc else raw_disc
        discount_amount = min(discount_amount, cart_total)

    elif disc_type == "buy_x_get_y":
        buy_qty = voucher.get("buyQty", 2)
        get_qty = voucher.get("getQty", 1)
        total_items = sum(i.qty for i in inp.items) if inp.items else 3
        if total_items >= (buy_qty + get_qty):
            discount_amount = min(disc_val if disc_val > 0 else 1000.0, cart_total * 0.3)
        else:
            raise HTTPException(status_code=400, detail=f"BUY {buy_qty} GET {get_qty} requires at least {buy_qty + get_qty} items in cart.")

    elif disc_type == "category":
        target_cat = (voucher.get("targetCategory") or "").lower()
        matching_total = sum(i.price * i.qty for i in inp.items if (i.category or "").lower() == target_cat) if inp.items else cart_total
        discount_amount = (matching_total * disc_val) / 100.0 if disc_val > 0 else min(500.0, cart_total)

    elif disc_type == "brand":
        target_brand = (voucher.get("targetBrand") or "").lower()
        matching_total = sum(i.price * i.qty for i in inp.items if (i.brand or "").lower() == target_brand) if inp.items else cart_total
        discount_amount = (matching_total * disc_val) / 100.0 if disc_val > 0 else min(500.0, cart_total)

    elif disc_type == "free_shipping":
        free_shipping = True
        discount_amount = 0.0

    else:
        discount_amount = min(disc_val, cart_total)

    discount_amount = round(discount_amount, 2)
    final_total = max(0.0, round(cart_total - discount_amount, 2))

    return {
        "code": code_clean,
        "discountType": disc_type,
        "discountValue": disc_val,
        "discountAmount": discount_amount,
        "freeShipping": free_shipping,
        "finalTotal": final_total,
        "description": voucher.get("description", f"{code_clean} Applied"),
        "message": f"Voucher '{code_clean}' applied! You saved ₹{discount_amount}." + (" Free Shipping Included!" if free_shipping else "")
    }
