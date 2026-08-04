"""
Admin Reviews Moderation Router
Provides review approval workflows, bulk actions, seller replies,
abuse reports, user banning, analytics, and export.
"""

import csv
import io
import math
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import StreamingResponse
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from core.cache import cache_invalidate_pattern
from models.review import (
    AdminReviewModeration,
    AdminBulkAction,
    AdminUserBan,
    SellerReviewReply,
)

logger = logging.getLogger("reevanta.admin.reviews")

router = APIRouter(prefix="/reviews", tags=["Admin Reviews Moderation"])


# ──────────────────── Helpers ────────────────────

async def _recalc_product_rating(product_id: str):
    """Recalculate product rating after moderation action."""
    all_reviews = await db.reviews.find({
        "product_id": product_id,
        "status": {"$in": ["approved", None]},
    }).to_list(5000)

    total = len(all_reviews)
    avg = round(sum(r.get("rating", 5) for r in all_reviews) / total, 1) if total > 0 else 0.0

    await db.products.update_one(
        {"_id": to_object_id(product_id)},
        {"$set": {"rating": avg, "reviewsCount": total}},
    )
    await cache_invalidate_pattern("api_products:*")
    await cache_invalidate_pattern(f"api_product:{product_id}")


# ──────────────────── GET All Reviews (Admin) ────────────────────

@router.get("")
async def admin_list_reviews(
    status: Optional[str] = Query(None),
    rating: Optional[int] = Query(None, ge=1, le=5),
    product_id: Optional[str] = None,
    search: Optional[str] = None,
    reported: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: dict = Depends(get_current_admin),
):
    """List all reviews with admin filters including moderation status."""
    query = {}

    if status:
        query["status"] = status
    if rating:
        query["rating"] = rating
    if product_id:
        query["product_id"] = product_id
    if reported:
        query["report_count"] = {"$gte": 1}
    if search:
        query["$or"] = [
            {"comment": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"userName": {"$regex": search, "$options": "i"}},
        ]

    total = await db.reviews.count_documents(query)
    skip = (page - 1) * limit

    reviews = await db.reviews.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total_pages = max(1, math.ceil(total / limit))

    # Enrich with product info
    enriched = []
    for r in reviews:
        doc = serialize_doc(r)
        try:
            product = await db.products.find_one({"_id": to_object_id(r.get("product_id", ""))})
            if product:
                doc["product_name"] = product.get("name", "Unknown")
                doc["product_image"] = product.get("image", "")
        except Exception:
            doc["product_name"] = "Unknown"
            doc["product_image"] = ""
        enriched.append(doc)

    return {
        "reviews": enriched,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": total_pages,
        "has_more": page < total_pages,
    }


# ──────────────────── PATCH Moderate Review ────────────────────

@router.patch("/{review_id}/status")
async def moderate_review(
    review_id: str,
    moderation: AdminReviewModeration,
    admin: dict = Depends(get_current_admin),
):
    """Approve, reject, or flag a review."""
    review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    old_status = review.get("status", "pending")

    update = {
        "status": moderation.status.value,
        "moderated_at": datetime.now(timezone.utc).isoformat(),
        "moderated_by": admin.get("id", admin.get("name", "admin")),
    }
    if moderation.rejection_reason:
        update["rejection_reason"] = moderation.rejection_reason

    # Add to moderation history
    history_entry = {
        "from_status": old_status,
        "to_status": moderation.status.value,
        "reason": moderation.rejection_reason or moderation.notes,
        "moderator": admin.get("name", "admin"),
        "moderator_id": admin.get("id"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {
            "$set": update,
            "$push": {"moderation_history": history_entry},
        },
    )

    # Recalc product rating
    product_id = review.get("product_id")
    if product_id:
        await _recalc_product_rating(product_id)

    # Audit log
    await db.review_audit_log.insert_one({
        "review_id": review_id,
        "action": f"status_changed:{old_status}->{moderation.status.value}",
        "reason": moderation.rejection_reason,
        "actor": admin.get("id"),
        "actor_name": admin.get("name"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "message": f"Review status updated to '{moderation.status.value}'",
        "review_id": review_id,
        "old_status": old_status,
        "new_status": moderation.status.value,
    }


# ──────────────────── POST Bulk Action ────────────────────

@router.post("/bulk-action")
async def bulk_moderation_action(
    action: AdminBulkAction,
    admin: dict = Depends(get_current_admin),
):
    """Bulk approve, reject, soft/hard delete, or flag reviews."""
    action_map = {
        "approve": "approved",
        "reject": "rejected",
        "flag": "flagged",
        "spam": "spam",
        "soft_delete": "soft_deleted",
    }

    results = {"success": 0, "failed": 0, "errors": []}
    now = datetime.now(timezone.utc).isoformat()

    for rid in action.review_ids:
        try:
            review = await db.reviews.find_one({"_id": to_object_id(rid)})
            if not review:
                results["failed"] += 1
                results["errors"].append(f"{rid}: not found")
                continue

            if action.action == "hard_delete":
                await db.reviews.delete_one({"_id": to_object_id(rid)})
            else:
                new_status = action_map.get(action.action)
                history_entry = {
                    "from_status": review.get("status", "pending"),
                    "to_status": new_status,
                    "reason": action.reason or f"Bulk {action.action}",
                    "moderator": admin.get("name", "admin"),
                    "timestamp": now,
                }
                await db.reviews.update_one(
                    {"_id": to_object_id(rid)},
                    {
                        "$set": {
                            "status": new_status,
                            "moderated_at": now,
                            "moderated_by": admin.get("id"),
                        },
                        "$push": {"moderation_history": history_entry},
                    },
                )

            # Recalc
            product_id = review.get("product_id")
            if product_id:
                await _recalc_product_rating(product_id)

            results["success"] += 1

            # Audit
            await db.review_audit_log.insert_one({
                "review_id": rid,
                "action": f"bulk_{action.action}",
                "reason": action.reason,
                "actor": admin.get("id"),
                "timestamp": now,
            })
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"{rid}: {str(e)}")

    return results


# ──────────────────── POST Admin/Seller Reply ────────────────────

@router.post("/{review_id}/reply")
async def admin_reply_to_review(
    review_id: str,
    reply: SellerReviewReply,
    admin: dict = Depends(get_current_admin),
):
    """Post an official seller/admin reply to a customer review."""
    review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    reply_doc = {
        "responseText": reply.responseText,
        "respondedBy": admin.get("name", "RIVAANTA Support"),
        "respondedById": admin.get("id"),
        "respondedAt": datetime.now(timezone.utc).isoformat(),
        "isOfficial": True,
    }

    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {"$set": {"adminResponse": reply_doc}},
    )

    await db.review_audit_log.insert_one({
        "review_id": review_id,
        "action": "admin_replied",
        "actor": admin.get("id"),
        "actor_name": admin.get("name"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return reply_doc


# ──────────────────── GET Reports Queue ────────────────────

@router.get("/reports")
async def get_reported_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: dict = Depends(get_current_admin),
):
    """List reviews with reports for admin moderation."""
    query = {"report_count": {"$gte": 1}}

    total = await db.reviews.count_documents(query)
    skip = (page - 1) * limit

    reviews = await db.reviews.find(query).sort("report_count", -1).skip(skip).limit(limit).to_list(limit)
    total_pages = max(1, math.ceil(total / limit))

    return {
        "reviews": [serialize_doc(r) for r in reviews],
        "total": total,
        "page": page,
        "pages": total_pages,
    }


# ──────────────────── POST Ban User ────────────────────

@router.post("/users/{user_id}/ban")
async def ban_user_from_reviews(
    user_id: str,
    ban: AdminUserBan,
    admin: dict = Depends(get_current_admin),
):
    """Ban a user from posting reviews."""
    expires_at = None
    if ban.duration_days:
        expires_at = (datetime.now(timezone.utc) + timedelta(days=ban.duration_days)).isoformat()

    await db.review_bans.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "reason": ban.reason,
            "banned_by": admin.get("id"),
            "banned_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at,
            "duration_days": ban.duration_days,
        }},
        upsert=True,
    )

    # Flag all user's pending/approved reviews
    await db.reviews.update_many(
        {"user_id": user_id, "status": {"$in": ["approved", "pending", None]}},
        {"$set": {"status": "flagged"}},
    )

    await db.review_audit_log.insert_one({
        "action": "user_banned",
        "target_user_id": user_id,
        "reason": ban.reason,
        "duration_days": ban.duration_days,
        "actor": admin.get("id"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "message": f"User {user_id} banned from reviews",
        "duration": f"{ban.duration_days} days" if ban.duration_days else "permanent",
    }


# ──────────────────── DELETE Unban User ────────────────────

@router.delete("/users/{user_id}/ban")
async def unban_user(user_id: str, admin: dict = Depends(get_current_admin)):
    """Remove a review ban from a user."""
    result = await db.review_bans.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User is not banned")

    return {"message": f"User {user_id} review ban removed"}


# ──────────────────── GET Analytics ────────────────────

@router.get("/analytics")
async def review_analytics(admin: dict = Depends(get_current_admin)):
    """Comprehensive review analytics dashboard data."""

    total_reviews = await db.reviews.count_documents({})
    pending = await db.reviews.count_documents({"status": "pending"})
    approved = await db.reviews.count_documents({"status": {"$in": ["approved", None]}})
    rejected = await db.reviews.count_documents({"status": "rejected"})
    flagged = await db.reviews.count_documents({"status": "flagged"})
    spam = await db.reviews.count_documents({"status": "spam"})
    soft_deleted = await db.reviews.count_documents({"status": "soft_deleted"})
    reported = await db.reviews.count_documents({"report_count": {"$gte": 1}})
    banned_users = await db.review_bans.count_documents({})

    # Average rating across all approved
    all_approved = await db.reviews.find({"status": {"$in": ["approved", None]}}).to_list(5000)
    avg_rating = round(sum(r.get("rating", 5) for r in all_approved) / len(all_approved), 1) if all_approved else 0.0

    # Rating distribution
    breakdown = {str(s): 0 for s in range(1, 6)}
    for r in all_approved:
        star = str(r.get("rating", 5))
        if star in breakdown:
            breakdown[star] += 1

    # Reviews with media
    with_media = sum(1 for r in all_approved if (r.get("photos") and len(r["photos"]) > 0) or r.get("photoUrl") or (r.get("videos") and len(r["videos"]) > 0))

    # Verified purchase ratio
    verified = sum(1 for r in all_approved if r.get("verifiedPurchase"))
    verified_percent = round((verified / len(all_approved)) * 100) if all_approved else 0

    # Response rate (how many reviews have admin replies)
    with_reply = sum(1 for r in all_approved if r.get("adminResponse"))
    response_rate = round((with_reply / len(all_approved)) * 100) if all_approved else 0

    # Recent 30 days trend
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_reviews = await db.reviews.count_documents({"created_at": {"$gte": thirty_days_ago}})

    return {
        "total_reviews": total_reviews,
        "status_counts": {
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
            "flagged": flagged,
            "spam": spam,
            "soft_deleted": soft_deleted,
        },
        "reported_count": reported,
        "banned_users": banned_users,
        "avg_rating": avg_rating,
        "breakdown": breakdown,
        "with_media": with_media,
        "verified_percent": verified_percent,
        "response_rate": response_rate,
        "recent_30_days": recent_reviews,
    }


# ──────────────────── GET Audit Log ────────────────────

@router.get("/audit-log")
async def get_audit_log(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin: dict = Depends(get_current_admin),
):
    """View review moderation audit trail."""
    total = await db.review_audit_log.count_documents({})
    skip = (page - 1) * limit

    logs = await db.review_audit_log.find({}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)

    return {
        "logs": [serialize_doc(l) for l in logs],
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / limit)),
    }


# ──────────────────── GET Export Reviews ────────────────────

@router.get("/export")
async def export_reviews(
    product_id: Optional[str] = None,
    status: Optional[str] = None,
    format: str = Query("csv", pattern="^(csv|json)$"),
    admin: dict = Depends(get_current_admin),
):
    """Export reviews as CSV or JSON."""
    query = {}
    if product_id:
        query["product_id"] = product_id
    if status:
        query["status"] = status

    reviews = await db.reviews.find(query).sort("created_at", -1).to_list(10000)
    serialized = [serialize_doc(r) for r in reviews]

    if format == "json":
        return serialized

    # CSV export
    output = io.StringIO()
    if serialized:
        fields = ["id", "product_id", "userName", "rating", "title", "comment",
                   "verifiedPurchase", "status", "helpfulVotes", "created_at",
                   "trust_score", "report_count"]
        writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in serialized:
            writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=reviews_export.csv"},
    )
