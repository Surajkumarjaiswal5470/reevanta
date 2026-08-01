from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc
from core.security import get_current_user
from models.cart import CartSyncRequest, ShippingEstimateRequest

router = APIRouter(prefix="", tags=["Cart & Shipping"])

@router.get("/cart")
async def get_user_cart(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    saved_cart = await db.carts.find_one({"user_id": user_id})
    if not saved_cart:
        return {"items": [], "updated_at": None}
    return {"items": saved_cart.get("items", []), "updated_at": saved_cart.get("updated_at")}

@router.post("/cart")
async def sync_user_cart(inp: CartSyncRequest, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = {
        "user_id": user_id,
        "user_email": user.get("email"),
        "user_name": user.get("name"),
        "items": [item.model_dump() for item in inp.items],
        "updated_at": now_iso,
        "is_converted": False
    }
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": doc},
        upsert=True
    )
    return {"message": "Cart synchronized successfully", "items_count": len(inp.items), "updated_at": now_iso}

@router.delete("/cart")
async def clear_user_cart(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "is_converted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "User cart cleared"}

@router.post("/shipping/estimate")
async def calculate_shipping_estimate(inp: ShippingEstimateRequest):
    city_clean = (inp.city or "").strip().lower()
    dist_clean = (inp.district or "").strip().lower()
    subtotal = float(inp.cartSubtotal)

    is_valley = any(v in city_clean or v in dist_clean for v in ["kathmandu", "lalitpur", "bhaktapur"])
    is_major_city = any(m in city_clean or m in dist_clean for m in ["pokhara", "biratnagar", "chitwan", "butwal", "dharan", "birgunj"])

    # Shipping Fee calculation rules
    if subtotal >= 3000 or is_valley:
        fee = 0
        method_name = "Express Free Delivery"
    elif is_major_city:
        fee = 150
        method_name = "Nepal Standard Courier"
    else:
        fee = 250
        method_name = "Nepal Regional Logistics"

    # Delivery Timeline estimate
    days_to_add = 1 if is_valley else (3 if is_major_city else 5)
    est_date = (datetime.now(timezone.utc) + timedelta(days=days_to_add)).strftime("%A, %b %d, %Y")

    return {
        "city": inp.city,
        "district": inp.district,
        "shippingFee": fee,
        "isFreeShipping": fee == 0,
        "method": method_name,
        "estimatedDeliveryDays": days_to_add,
        "estimatedDeliveryDate": est_date,
        "note": "FREE Shipping applied for orders over ₹3,000 or Kathmandu Valley!" if subtotal >= 3000 else f"Add ₹{3000 - subtotal:.0f} more for FREE Shipping!"
    }
