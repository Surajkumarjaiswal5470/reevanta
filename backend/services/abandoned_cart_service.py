import logging
from datetime import datetime, timezone, timedelta
from core.database import db
from services.email_service import send_email_brevo

logger = logging.getLogger("reevanta.abandoned_cart")

async def process_abandoned_carts():
    """Scans for non-converted carts >2 hours old and sends reminder email with 10% bonus coupon."""
    two_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    
    # Query non-converted carts updated before two_hours_ago where reminder has not been sent
    cursor = db.carts.find({
        "is_converted": False,
        "reminder_sent": {"$ne": True},
        "items": {"$not": {"$size": 0}},
        "updated_at": {"$lte": two_hours_ago}
    })
    
    abandoned_carts = await cursor.to_list(100)
    logger.info("Found %d abandoned carts eligible for reminder emails.", len(abandoned_carts))
    
    processed_count = 0
    for cart in abandoned_carts:
        email = cart.get("user_email")
        items = cart.get("items", [])
        if not email or not items:
            continue
            
        user_name = cart.get("user_name") or "Valued Customer"
        item_names = ", ".join(it.get("name", "Product") for it in items[:3])
        cart_total = sum(it.get("price", 0) * it.get("qty", 1) for it in items)
        
        subject = f"🛒 You left items in your cart! Here is 10% Off to complete your order, {user_name}"
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF5EC; padding: 24px; border-radius: 16px; color: #2D2118;">
            <h2 style="color: #5C1E1E; margin-top: 0;">Did you forget something?</h2>
            <p>Hi {user_name},</p>
            <p>We noticed you left <strong>{len(items)} luxury item(s)</strong> ({item_names}) in your shopping cart valued at <strong>NPR {cart_total}</strong>.</p>
            <div style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #E8DFC9; margin: 20px 0;">
                <h4 style="margin: 0 0 8px 0; color: #5C1E1E;">Your Exclusive Gift Code:</h4>
                <div style="font-size: 20px; font-weight: bold; font-family: monospace; color: #5C1E1E; background: #FAF5EC; padding: 8px; border-radius: 8px; text-align: center;">ABANDON10</div>
                <p style="font-size: 12px; color: #666; margin: 8px 0 0 0; text-align: center;">Use code ABANDON10 at checkout for an extra 10% Off!</p>
            </div>
            <a href="https://reevanta.com" style="display: block; width: 100%; text-align: center; background: #5C1E1E; color: #ffffff; text-decoration: none; padding: 14px 0; font-weight: bold; border-radius: 12px; margin-top: 16px;">Complete Your Checkout Now &rarr;</a>
            <p style="font-size: 11px; color: #8B7355; margin-top: 24px; text-align: center;">RIVAANTA Luxury Wear · Durbar Marg, Kathmandu, Nepal</p>
        </div>
        """
        
        sent = send_email_brevo(email, subject, html_body)
        if sent:
            await db.carts.update_one(
                {"_id": cart["_id"]},
                {"$set": {"reminder_sent": True, "reminder_sent_at": datetime.now(timezone.utc).isoformat()}}
            )
            processed_count += 1
            
    return {"status": "success", "processed": processed_count, "total_found": len(abandoned_carts)}
