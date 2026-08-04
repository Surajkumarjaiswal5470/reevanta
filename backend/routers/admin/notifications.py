"""
Admin Notifications & Operational Alerts Router
Aggregates live operational alerts for New Orders, Low Stock Warnings, Customer Support Messages, Return Requests, and Product Reviews.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.notification import NotificationSchema, MarkReadRequest

router = APIRouter(prefix="/notifications", tags=["Admin - Notifications"])


@router.get("")
async def get_admin_notifications(admin: dict = Depends(get_current_admin)):
    """Fetch live operational notification feed & unread summary."""
    read_ids = set()
    user_read_doc = await db.admin_read_notifications.find_one({"admin_email": admin.get("email", "admin")})
    if user_read_doc:
        read_ids = set(user_read_doc.get("read_ids", []))

    notifications = []

    # 1. New Orders Alerts (last 10 recent orders)
    recent_orders = await db.orders.find({}).sort("placed_at", -1).to_list(10)
    for o in recent_orders:
        o_id = str(o.get("_id"))
        n_id = f"notif-order-{o_id}"
        notifications.append({
            "id": n_id,
            "type": "ORDER",
            "title": f"New Order #{o.get('order_number', o_id[:8])} Placed",
            "message": f"Customer {o.get('userName', o.get('userEmail', 'Customer'))} placed order worth ₹{o.get('total', 0)} ({o.get('paymentMethod', 'COD')}).",
            "resource_id": o_id,
            "target_tab": "orders",
            "severity": "success",
            "is_read": n_id in read_ids,
            "created_at": o.get("placed_at") or datetime.now(timezone.utc).isoformat()
        })

    # 2. Low Stock Alerts (products stock <= 5)
    low_stock = await db.products.find({"$or": [{"inStock": False}, {"stock": {"$lte": 5}}]}).to_list(15)
    for p in low_stock:
        p_id = str(p.get("_id"))
        n_id = f"notif-stock-{p_id}"
        st = p.get("stock", 0)
        is_out = not p.get("inStock", True) or st <= 0
        notifications.append({
            "id": n_id,
            "type": "LOW_STOCK",
            "title": f"{'🚨 OUT OF STOCK' if is_out else '⚠️ LOW STOCK ALERT'}: {p.get('name')}",
            "message": f"Inventory count is at {st} units. Update stock count to prevent stockouts.",
            "resource_id": p_id,
            "target_tab": "products",
            "severity": "error" if is_out else "warning",
            "is_read": n_id in read_ids,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    # 3. Return & Refund Requests Alerts
    return_orders = await db.orders.find({
        "$or": [
            {"return_status": "Return Requested"},
            {"return_info.return_status": "Return Requested"}
        ]
    }).to_list(10)

    for r in return_orders:
        r_id = str(r.get("_id"))
        n_id = f"notif-return-{r_id}"
        r_reason = (r.get("return_info") or {}).get("reason", "Defective / Size Issue")
        notifications.append({
            "id": n_id,
            "type": "RETURN_REQUEST",
            "title": f"Return Requested: #{r.get('order_number', r_id[:8])}",
            "message": f"Customer requested return for ₹{r.get('total', 0)} order. Reason: {r_reason}.",
            "resource_id": r_id,
            "target_tab": "returns",
            "severity": "warning",
            "is_read": n_id in read_ids,
            "created_at": r.get("updated_at") or datetime.now(timezone.utc).isoformat()
        })

    # 4. Recent Product Reviews Alerts
    reviews = await db.reviews.find({}).sort("created_at", -1).to_list(10)
    for rv in reviews:
        rv_id = str(rv.get("_id"))
        n_id = f"notif-review-{rv_id}"
        rating = rv.get("rating", 5)
        notifications.append({
            "id": n_id,
            "type": "REVIEW",
            "title": f"New {rating}★ Review from {rv.get('user_name', 'Customer')}",
            "message": f"\"{rv.get('comment', 'Great product!')}\" on Product #{rv.get('product_id', '')[:8]}",
            "resource_id": rv_id,
            "target_tab": "reviews",
            "severity": "info" if rating >= 4 else "warning",
            "is_read": n_id in read_ids,
            "created_at": rv.get("created_at") or datetime.now(timezone.utc).isoformat()
        })

    # Sort notifications by created_at descending
    notifications.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    unread_count = sum(1 for n in notifications if not n["is_read"])

    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total_count": len(notifications)
    }


@router.post("/mark-read")
async def mark_notifications_read(inp: MarkReadRequest, admin: dict = Depends(get_current_admin)):
    """Mark specific or all notifications as read."""
    admin_email = admin.get("email", "admin")
    
    if inp.mark_all:
        # Mark all current notifications as read
        all_data = await get_admin_notifications(admin)
        all_ids = [n["id"] for n in all_data["notifications"]]
        await db.admin_read_notifications.update_one(
            {"admin_email": admin_email},
            {"$addToSet": {"read_ids": {"$each": all_ids}}},
            upsert=True
        )
    elif inp.notification_ids:
        await db.admin_read_notifications.update_one(
            {"admin_email": admin_email},
            {"$addToSet": {"read_ids": {"$each": inp.notification_ids}}},
            upsert=True
        )

    return {"message": "Notifications marked as read"}
