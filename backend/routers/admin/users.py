"""
Admin Users & Customer Management Router
Provides customer search, pagination, order/spend metrics, account blocking/unblocking, and deletion.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin

router = APIRouter(prefix="/users", tags=["Admin - Users"])


# ──────────────────── Pydantic Models ────────────────────

class BlockUserRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, examples=["Spam & fake review submissions"])
    duration_days: Optional[int] = Field(None, ge=1, le=3650, examples=[30])


# ──────────────────── GET List Users ────────────────────

@router.get("")
async def list_users_admin(
    search: Optional[str] = None,
    status: Optional[str] = Query(None, pattern="^(active|blocked)$"),
    role: Optional[str] = Query(None, pattern="^(user|admin|reseller)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: dict = Depends(get_current_admin),
):
    """Fetch paginated users with search, status filters, and aggregated order/spend metrics."""
    query = {}

    if status == "blocked":
        query["is_blocked"] = True
    elif status == "active":
        query["$or"] = [{"is_blocked": False}, {"is_blocked": {"$exists": False}}]

    if role:
        query["role"] = role

    if search:
        search_regex = {"$regex": search, "$options": "i"}
        search_query = [
            {"name": search_regex},
            {"email": search_regex},
            {"phone": search_regex},
        ]
        if "$or" in query:
            query["$and"] = [{"$or": query.pop("$or")}, {"$or": search_query}]
        else:
            query["$or"] = search_query

    total = await db.users.count_documents(query)
    skip = (page - 1) * limit

    users = await db.users.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total_pages = max(1, math.ceil(total / limit))

    # Enrich each user with order & spend stats
    out = []
    for u in users:
        s = serialize_doc(u)
        s.pop("password_hash", None)

        user_id = s.get("id")
        user_phone = s.get("phone")
        user_email = s.get("email")

        # Build order match query
        order_clauses = []
        if user_id:
            order_clauses.append({"user_id": user_id})
        if user_phone:
            order_clauses.extend([{"phone": user_phone}, {"customerPhone": user_phone}])
        if user_email:
            order_clauses.extend([{"email": user_email}, {"customerEmail": user_email}])

        order_count = 0
        total_spent = 0.0

        if order_clauses:
            try:
                user_orders = await db.orders.find({"$or": order_clauses}).to_list(1000)
                order_count = len(user_orders)
                total_spent = round(sum(float(o.get("total", 0)) for o in user_orders if o.get("status") != "Cancelled"), 2)
            except Exception:
                pass

        # Review count
        review_count = 0
        if user_id:
            try:
                review_count = await db.reviews.count_documents({"user_id": user_id})
            except Exception:
                pass

        s["order_count"] = order_count
        s["total_spent"] = total_spent
        s["review_count"] = review_count
        s["is_blocked"] = bool(s.get("is_blocked", False))

        out.append(s)

    return {
        "users": out,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": total_pages,
        "has_more": page < total_pages,
    }


# ──────────────────── GET User Stats Summary ────────────────────

@router.get("/stats/summary")
async def user_stats_summary(admin: dict = Depends(get_current_admin)):
    """Fetch high-level customer metrics for dashboard header."""
    total_users = await db.users.count_documents({})
    blocked_users = await db.users.count_documents({"is_blocked": True})
    active_users = total_users - blocked_users

    admin_count = await db.users.count_documents({"role": "admin"})
    customer_count = await db.users.count_documents({"role": {"$ne": "admin"}})

    # Recent signups in last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_signups = await db.users.count_documents({"created_at": {"$gte": thirty_days_ago}})

    return {
        "total_users": total_users,
        "active_users": active_users,
        "blocked_users": blocked_users,
        "customer_count": customer_count,
        "admin_count": admin_count,
        "recent_signups_30d": recent_signups,
    }


# ──────────────────── GET Single User Details ────────────────────

@router.get("/{user_id}/details")
async def get_user_details(user_id: str, admin: dict = Depends(get_current_admin)):
    """Fetch complete customer profile with order history and review activity."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    s = serialize_doc(user)
    s.pop("password_hash", None)

    user_phone = s.get("phone")
    user_email = s.get("email")

    order_clauses = [{"user_id": user_id}]
    if user_phone:
        order_clauses.extend([{"phone": user_phone}, {"customerPhone": user_phone}])
    if user_email:
        order_clauses.extend([{"email": user_email}, {"customerEmail": user_email}])

    orders = await db.orders.find({"$or": order_clauses}).sort("created_at", -1).to_list(100)
    reviews = await db.reviews.find({"user_id": user_id}).sort("created_at", -1).to_list(100)

    s["orders"] = [serialize_doc(o) for o in orders]
    s["reviews"] = [serialize_doc(r) for r in reviews]
    s["total_spent"] = round(sum(float(o.get("total", 0)) for o in orders if o.get("status") != "Cancelled"), 2)

    return s


# ──────────────────── POST Block User ────────────────────

@router.post("/{user_id}/block")
async def block_user(
    user_id: str,
    inp: BlockUserRequest,
    admin: dict = Depends(get_current_admin),
):
    """Suspend a customer account with a reason and flag their reviews."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot block an Administrator account")

    blocked_at = datetime.now(timezone.utc).isoformat()
    expires_at = None
    if inp.duration_days:
        expires_at = (datetime.now(timezone.utc) + timedelta(days=inp.duration_days)).isoformat()

    updates = {
        "is_blocked": True,
        "block_reason": inp.reason,
        "blocked_by": admin.get("id", admin.get("name", "admin")),
        "blocked_at": blocked_at,
        "block_expires_at": expires_at,
    }

    await db.users.update_one({"_id": to_object_id(user_id)}, {"$set": updates})

    # Flag user's reviews
    await db.reviews.update_many(
        {"user_id": user_id, "status": {"$in": ["approved", "pending", None]}},
        {"$set": {"status": "flagged"}},
    )

    # Log in audit trail
    await db.review_audit_log.insert_one({
        "action": "user_account_blocked",
        "target_user_id": user_id,
        "target_user_email": user.get("email"),
        "target_user_name": user.get("name"),
        "reason": inp.reason,
        "duration_days": inp.duration_days,
        "actor": admin.get("id"),
        "timestamp": blocked_at,
    })

    return {
        "message": f"User '{user.get('name', user_id)}' has been blocked",
        "user_id": user_id,
        "reason": inp.reason,
        "expires_at": expires_at,
    }


# ──────────────────── POST Unblock User ────────────────────

@router.post("/{user_id}/unblock")
async def unblock_user(user_id: str, admin: dict = Depends(get_current_admin)):
    """Restore a suspended customer account."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = {
        "is_blocked": False,
        "block_reason": None,
        "unblocked_at": datetime.now(timezone.utc).isoformat(),
        "unblocked_by": admin.get("id"),
    }

    await db.users.update_one({"_id": to_object_id(user_id)}, {"$set": updates})

    await db.review_audit_log.insert_one({
        "action": "user_account_unblocked",
        "target_user_id": user_id,
        "target_user_email": user.get("email"),
        "actor": admin.get("id"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": f"User '{user.get('name', user_id)}' has been unblocked"}


# ──────────────────── PATCH Update User Role / Status ────────────────────

@router.patch("/{user_id}")
async def update_user_admin(user_id: str, updates: dict, admin: dict = Depends(get_current_admin)):
    """Update user role or active status."""
    updates.pop("_id", None)
    updates.pop("id", None)
    updates.pop("password_hash", None)
    res = await db.users.update_one({"_id": to_object_id(user_id)}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    updated = await db.users.find_one({"_id": to_object_id(user_id)})
    s = serialize_doc(updated)
    s.pop("password_hash", None)
    return s


# ──────────────────── DELETE User ────────────────────

@router.delete("/{user_id}")
async def delete_user_admin(user_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a user account."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete an Administrator account")

    res = await db.users.delete_one({"_id": to_object_id(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User account deleted successfully"}
