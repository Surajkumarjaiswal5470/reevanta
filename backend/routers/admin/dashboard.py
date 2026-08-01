from fastapi import APIRouter, Depends
from core.database import db
from core.security import get_current_admin

router = APIRouter(prefix="/stats", tags=["Admin - Dashboard"])

@router.get("")
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Calculate total revenue from delivered/placed orders
    pipeline = [
        {"$match": {"status": {"$ne": "Cancelled"}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total"}}}
    ]
    revenue_res = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_res[0]["total_revenue"] if revenue_res else 0

    pending_orders = await db.orders.count_documents({"status": {"$in": ["Order Placed", "Packed", "Shipped"]}})

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products": total_products,
        "total_users": total_users,
        "pending_orders": pending_orders
    }

from services.abandoned_cart_service import process_abandoned_carts

@router.post("/trigger-abandoned-cart-job")
async def trigger_abandoned_cart_job(admin: dict = Depends(get_current_admin)):
    """Executes scheduled abandoned cart scanner and sends email reminders."""
    result = await process_abandoned_carts()
    return result
