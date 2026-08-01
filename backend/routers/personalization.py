from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_user
from services.email_service import send_email_brevo

router = APIRouter(prefix="", tags=["Personalization & Loyalty"])

class RestockAlertRequest(BaseModel):
    email: str

class RedeemPointsRequest(BaseModel):
    pointsToRedeem: int
    cartSubtotal: float

@router.get("/loyalty/points")
async def get_loyalty_points(user: dict = Depends(get_current_user)):
    user_id = user["id"]
    profile = await db.users.find_one({"_id": to_object_id(user_id)})
    if not profile:
        return {"loyalty_points": 0, "history": []}
    
    points = profile.get("loyalty_points", 150) # default 150 bonus points for demo
    history = await db.loyalty_transactions.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return {
        "user_id": user_id,
        "loyalty_points": points,
        "points_value_npr": points, # 1 point = 1 NPR discount
        "history": [serialize_doc(h) for h in history]
    }

@router.post("/loyalty/redeem")
async def redeem_loyalty_points(inp: RedeemPointsRequest, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    profile = await db.users.find_one({"_id": to_object_id(user_id)})
    avail_points = profile.get("loyalty_points", 150) if profile else 150

    if inp.pointsToRedeem <= 0:
        raise HTTPException(status_code=400, detail="Points must be greater than 0")
    if inp.pointsToRedeem > avail_points:
        raise HTTPException(status_code=400, detail=f"Insufficient points. Available: {avail_points}")

    # Maximum 50% discount of cart subtotal using points
    max_redeemable_value = inp.cartSubtotal * 0.5
    actual_discount = min(inp.pointsToRedeem, max_redeemable_value)

    return {
        "pointsRedeemed": int(actual_discount),
        "discountAmount": round(actual_discount, 2),
        "remainingPoints": avail_points - int(actual_discount),
        "message": f"Redeemed {int(actual_discount)} Loyalty Points for NPR {round(actual_discount, 2)} discount!"
    }

@router.post("/products/{product_id}/back-in-stock-alert")
async def subscribe_back_in_stock(product_id: str, inp: RestockAlertRequest):
    email = inp.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")

    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.restock_subscriptions.update_one(
        {"product_id": product_id, "email": email},
        {"$set": {
            "product_id": product_id,
            "product_name": product.get("name"),
            "email": email,
            "subscribed_at": datetime.now(timezone.utc).isoformat(),
            "notified": False
        }},
        upsert=True
    )
    return {"message": f"Subscribed {email} to restock notifications for '{product.get('name')}'!"}

async def notify_restock_subscribers(product_id: str, product_name: str, product_price: float):
    """Trigger email alerts via Brevo API when product stock is restored."""
    subs = await db.restock_subscriptions.find({"product_id": product_id, "notified": False}).to_list(100)
    if not subs:
        return 0

    notified_count = 0
    for sub in subs:
        email = sub["email"]
        subject = f"🎉 Good news! '{product_name}' is Back in Stock at RIVAANTA Luxury"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF5EC; padding: 24px; border-radius: 16px; color: #2D2118;">
            <h2 style="color: #5C1E1E;">It's Back in Stock!</h2>
            <p>Hi there,</p>
            <p>The item you've been waiting for, <strong>{product_name}</strong> (NPR {product_price}), is officially back in stock in limited quantities!</p>
            <a href="https://reevanta.com" style="display: block; text-align: center; background: #5C1E1E; color: #ffffff; padding: 14px 0; font-weight: bold; border-radius: 12px; text-decoration: none; margin-top: 20px;">Order Now Before It Sells Out &rarr;</a>
        </div>
        """
        sent = send_email_brevo(email, subject, html_body)
        if sent:
            await db.restock_subscriptions.update_one({"_id": sub["_id"]}, {"$set": {"notified": True}})
            notified_count += 1

    return notified_count

@router.get("/homepage/personalized")
async def get_personalized_homepage_sections(category: Optional[str] = None):
    """Rule-based recommendation engine for personalized homepage showcase."""
    all_products = await db.products.find({}).to_list(100)
    
    pref_category = category if category and category != "all" else "clothes"
    
    # 1. Recommended for You (matching preferred category)
    recommended = [serialize_doc(p) for p in all_products if p.get("category") == pref_category][:4]
    if len(recommended) < 4:
        recommended = [serialize_doc(p) for p in all_products[:4]]

    # 2. Trending Luxury Essentials (highest rated)
    trending = [serialize_doc(p) for p in sorted(all_products, key=lambda x: x.get("rating", 4.5), reverse=True)[:4]]

    return {
        "preferredCategory": pref_category,
        "recommendedForYou": recommended,
        "trendingLuxury": trending
    }
