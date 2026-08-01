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
    code_clean = inp.code.strip().upper()
    voucher = await db.vouchers.find_one({"code": code_clean, "isActive": True})
    if not voucher:
        raise HTTPException(status_code=400, detail="Invalid or inactive voucher code")

    # Check Expiry Date
    exp = voucher.get("expiryDate")
    if exp:
        try:
            exp_date = datetime.strptime(exp, "%Y-%m-%d").date()
            if datetime.now(timezone.utc).date() > exp_date:
                raise HTTPException(status_code=400, detail=f"Voucher '{code_clean}' expired on {exp}")
        except Exception:
            pass

    # Check Usage Limits
    max_uses = voucher.get("maxUses", 500)
    curr_uses = voucher.get("currentUses", 0)
    if curr_uses >= max_uses:
        raise HTTPException(status_code=400, detail=f"Voucher '{code_clean}' has reached its maximum redemption limit")

    # Check minimum order value
    min_val = voucher.get("minOrderValue", 0)
    if inp.cartTotal < min_val:
        raise HTTPException(
            status_code=400,
            detail=f"Code '{code_clean}' requires a minimum cart total of ₹{min_val}."
        )

    # Check specific customer restriction
    target_email = voucher.get("assignedCustomerEmail")
    if target_email and inp.customerEmail and target_email.lower() != inp.customerEmail.lower():
        raise HTTPException(status_code=400, detail="This voucher code is exclusive to another customer account.")

    # Calculate discount
    disc_type = voucher.get("discountType", "fixed")
    disc_val = float(voucher.get("discountValue", 0))
    cart_total = float(inp.cartTotal)
    
    if disc_type == "fixed":
        discount_amount = min(disc_val, cart_total)
    elif disc_type == "percentage":
        raw_disc = (cart_total * disc_val) / 100.0
        max_disc = voucher.get("maxDiscount")
        discount_amount = min(raw_disc, float(max_disc)) if max_disc else raw_disc
        discount_amount = min(discount_amount, cart_total)
    elif disc_type == "bogo": # Buy One Get One 50% Off
        discount_amount = min(cart_total * 0.5, 2000.0)
    elif disc_type == "bundle": # Bundle Deal Flat Off
        discount_amount = min(750.0, cart_total)
    else:
        discount_amount = min(disc_val, cart_total)

    discount_amount = round(discount_amount, 2)
    final_total = max(0.0, round(cart_total - discount_amount, 2))

    return {
        "code": code_clean,
        "discountType": disc_type,
        "discountValue": disc_val,
        "discountAmount": discount_amount,
        "finalTotal": final_total,
        "description": voucher.get("description", f"{code_clean} Applied"),
        "message": f"Voucher '{code_clean}' ({disc_type.upper()}) applied! You saved ₹{discount_amount}."
    }
