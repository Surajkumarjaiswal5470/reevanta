"""
Admin Vouchers & Discounts Operations Router
Provides CRUD for vouchers, discount rules, BXGY, flash sales, category/brand rules, and coupon analytics.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.voucher import VoucherCreate, VoucherUpdate

router = APIRouter(prefix="/vouchers", tags=["Admin - Vouchers"])


# Default Pre-seeded Coupons
DEFAULT_COUPONS = [
    {
        "code": "ROYAL20",
        "discountType": "percentage",
        "discountValue": 20.0,
        "minOrderValue": 2999.0,
        "maxDiscount": 1500.0,
        "maxUses": 500,
        "currentUses": 42,
        "totalRevenueGenerated": 125000.0,
        "totalDiscountGranted": 25000.0,
        "autoApply": False,
        "isActive": True,
        "description": "20% OFF on orders over ₹2,999",
        "expiryDate": "2026-12-31"
    },
    {
        "code": "BUY2GET1",
        "discountType": "buy_x_get_y",
        "discountValue": 1000.0,
        "minOrderValue": 4000.0,
        "buyQty": 2,
        "getQty": 1,
        "maxUses": 200,
        "currentUses": 18,
        "totalRevenueGenerated": 72000.0,
        "totalDiscountGranted": 18000.0,
        "autoApply": False,
        "isActive": True,
        "description": "Buy 2 Sarees & Get 1 Free/Discounted",
        "expiryDate": "2026-12-31"
    },
    {
        "code": "FREESHIP",
        "discountType": "free_shipping",
        "freeShipping": True,
        "minOrderValue": 1499.0,
        "maxUses": 1000,
        "currentUses": 115,
        "totalRevenueGenerated": 172500.0,
        "totalDiscountGranted": 17250.0,
        "autoApply": True,
        "isActive": True,
        "description": "Free Shipping on orders above ₹1,499",
        "expiryDate": "2026-12-31"
    }
]


@router.get("")
async def list_vouchers_admin(admin: dict = Depends(get_current_admin)):
    """Fetch all admin vouchers & discount rules."""
    vouchers = await db.vouchers.find({}).sort("created_at", -1).to_list(200)
    if not vouchers:
        seeded = []
        try:
            for v in DEFAULT_COUPONS:
                v_copy = dict(v)
                v_copy["created_at"] = datetime.now(timezone.utc).isoformat()
                res = await db.vouchers.insert_one(v_copy)
                v_copy["id"] = str(res.inserted_id)
                v_copy.pop("_id", None)
                seeded.append(v_copy)
            return seeded
        except Exception:
            return DEFAULT_COUPONS
    return [serialize_doc(v) for v in vouchers]


@router.get("/analytics")
async def get_voucher_analytics(admin: dict = Depends(get_current_admin)):
    """Fetch aggregate usage, total revenue generated via coupons, and total savings granted."""
    vouchers = await db.vouchers.find({}).to_list(1000)

    total_vouchers = len(vouchers)
    active_vouchers = sum(1 for v in vouchers if v.get("isActive"))
    total_uses = sum(int(v.get("currentUses", 0)) for v in vouchers)
    total_revenue_generated = round(sum(float(v.get("totalRevenueGenerated", 0)) for v in vouchers), 2)
    total_discount_granted = round(sum(float(v.get("totalDiscountGranted", 0)) for v in vouchers), 2)

    return {
        "total_vouchers": total_vouchers,
        "active_vouchers": active_vouchers,
        "total_uses": total_uses,
        "total_revenue_generated": total_revenue_generated,
        "total_discount_granted": total_discount_granted
    }


@router.post("")
async def create_voucher_admin(inp: VoucherCreate, admin: dict = Depends(get_current_admin)):
    """Create a new coupon code or automatic discount rule."""
    code_clean = inp.code.strip().upper()
    existing = await db.vouchers.find_one({"code": code_clean})
    if existing:
        raise HTTPException(status_code=400, detail=f"Voucher code '{code_clean}' already exists")

    doc = inp.model_dump()
    doc["code"] = code_clean
    doc["currentUses"] = 0
    doc["totalRevenueGenerated"] = 0.0
    doc["totalDiscountGranted"] = 0.0
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.vouchers.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.patch("/{voucher_id}")
async def update_voucher_admin(voucher_id: str, updates: VoucherUpdate, admin: dict = Depends(get_current_admin)):
    """Update voucher properties."""
    update_dict = updates.model_dump(exclude_unset=True, exclude_none=True)
    if "code" in update_dict:
        update_dict["code"] = update_dict["code"].strip().upper()
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.vouchers.update_one({"_id": to_object_id(voucher_id)}, {"$set": update_dict})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")

    updated = await db.vouchers.find_one({"_id": to_object_id(voucher_id)})
    return serialize_doc(updated)


@router.delete("/{voucher_id}")
async def delete_voucher_admin(voucher_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a voucher rule."""
    res = await db.vouchers.delete_one({"_id": to_object_id(voucher_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    return {"message": "Voucher deleted successfully"}
