"""
Customer-Facing Reviews & Ratings API Router
Handles review CRUD, voting, reporting, and user review history.
"""

import math
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Query
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_user_or_none, get_current_user
from core.cache import cache_invalidate_pattern
from models.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewVote,
    ReviewReaction,
    ReviewReport,
    SellerReviewReply,
    ReviewSortBy,
    VoteType,
)
from services.spam_filter_service import compute_trust_score

logger = logging.getLogger("reevanta.reviews")

router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])

# ──────────────────── Config ────────────────────
REVIEW_EDIT_WINDOW_DAYS = 30
MAX_REVIEWS_PER_PAGE = 50


# ──────────────────── Helpers ────────────────────

async def _recalc_product_rating(product_id: str):
    """Recalculate and update the product's average rating and review count."""
    all_reviews = await db.reviews.find({
        "product_id": product_id,
        "status": {"$in": ["approved", None]},
    }).to_list(5000)

    total = len(all_reviews)
    if total > 0:
        avg = round(sum(r.get("rating", 5) for r in all_reviews) / total, 1)
    else:
        avg = 0.0

    await db.products.update_one(
        {"_id": to_object_id(product_id)},
        {"$set": {"rating": avg, "reviewsCount": total}},
    )
    await cache_invalidate_pattern("api_products:*")
    await cache_invalidate_pattern(f"api_product:{product_id}")


async def _verify_purchase(user: dict, product_id: str) -> bool:
    """Check if the user has purchased this product."""
    user_phone = user.get("phone")
    user_email = user.get("email")
    user_id = user.get("id")

    or_clauses = []
    if user_phone:
        or_clauses.extend([{"phone": user_phone}, {"customerPhone": user_phone}])
    if user_email:
        or_clauses.extend([{"email": user_email}, {"customerEmail": user_email}])
    if user_id:
        or_clauses.append({"user_id": user_id})

    if not or_clauses:
        return False

    order = await db.orders.find_one({
        "$and": [
            {"$or": or_clauses},
            {"$or": [
                {"items.id": product_id},
                {"items.product_id": product_id},
            ]},
        ]
    })
    return order is not None


# ──────────────────── GET Reviews ────────────────────

@router.get("/product/{product_id}")
async def get_product_reviews(
    product_id: str,
    sort_by: Optional[str] = Query("recent"),
    rating_filter: Optional[int] = Query(None, ge=1, le=5),
    verified_only: bool = False,
    with_photos: bool = False,
    with_videos: bool = False,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=MAX_REVIEWS_PER_PAGE),
):
    """Fetch paginated, filtered, and sorted reviews for a product."""

    # Base query: only approved reviews shown to customers
    base_query = {
        "product_id": product_id,
        "status": {"$in": ["approved", None]},
    }

    # ── Overall metrics from ALL approved reviews ──
    try:
        all_reviews = await db.reviews.find(base_query).to_list(5000)
    except Exception:
        all_reviews = []

    total_all = len(all_reviews)
    avg_rating = round(sum(r.get("rating", 5) for r in all_reviews) / total_all, 1) if total_all > 0 else 0.0

    recommend_count = sum(1 for r in all_reviews if r.get("rating", 5) >= 4)
    recommend_percent = int(round((recommend_count / total_all) * 100)) if total_all > 0 else 100

    breakdown = {str(s): 0 for s in range(1, 6)}
    for r in all_reviews:
        star = str(r.get("rating", 5))
        if star in breakdown:
            breakdown[star] += 1

    # Feature averages
    fit_vals = [r.get("fitRating") for r in all_reviews if r.get("fitRating") is not None]
    quality_vals = [r.get("qualityRating") for r in all_reviews if r.get("qualityRating") is not None]
    value_vals = [r.get("valueRating") for r in all_reviews if r.get("valueRating") is not None]

    avg_fit = round(sum(fit_vals) / len(fit_vals), 1) if fit_vals else 3.0
    avg_quality = round(sum(quality_vals) / len(quality_vals), 1) if quality_vals else 4.8
    avg_value = round(sum(value_vals) / len(value_vals), 1) if value_vals else 4.7

    # Media count
    media_count = sum(1 for r in all_reviews if (r.get("photos") and len(r["photos"]) > 0) or r.get("photoUrl") or (r.get("videos") and len(r["videos"]) > 0))

    # ── Filtered query ──
    query = dict(base_query)
    if rating_filter:
        query["rating"] = rating_filter
    if verified_only:
        query["verifiedPurchase"] = True
    if with_photos:
        query["$or"] = query.get("$or", []) + [
            {"photos": {"$exists": True, "$not": {"$size": 0}}},
            {"photoUrl": {"$ne": None}},
        ]
    if with_videos:
        video_cond = {"videos": {"$exists": True, "$not": {"$size": 0}}}
        if "$or" in query:
            query["$or"].append(video_cond)
        else:
            query.update(video_cond)
    if search:
        query["$text"] = {"$search": search}

    # ── Sort ──
    sort_map = {
        "recent": [("created_at", -1)],
        "highest": [("rating", -1), ("created_at", -1)],
        "lowest": [("rating", 1), ("created_at", -1)],
        "helpful": [("helpfulVotes", -1), ("created_at", -1)],
        "verified": [("verifiedPurchase", -1), ("created_at", -1)],
        "with_images": [("created_at", -1)],
        "with_videos": [("created_at", -1)],
    }
    sort_spec = sort_map.get(sort_by, [("created_at", -1)])

    # ── Pagination ──
    skip = (page - 1) * limit
    try:
        total_filtered = await db.reviews.count_documents(query)
        cursor = db.reviews.find(query).sort(sort_spec).skip(skip).limit(limit)
        reviews = await cursor.to_list(limit)
    except Exception as e:
        logger.warning(f"Review query error: {e}")
        total_filtered = 0
        reviews = []

    total_pages = max(1, math.ceil(total_filtered / limit))

    # Anonymize names where needed
    serialized = []
    for r in reviews:
        doc = serialize_doc(r)
        if doc.get("anonymous"):
            doc["userName"] = "Anonymous Customer"
            doc.pop("userEmail", None)
        serialized.append(doc)

    return {
        "reviews": serialized,
        "total": total_filtered,
        "total_unfiltered": total_all,
        "page": page,
        "limit": limit,
        "pages": total_pages,
        "has_more": page < total_pages,
        "avg_rating": avg_rating,
        "recommend_percent": recommend_percent,
        "breakdown": breakdown,
        "media_count": media_count,
        "feature_ratings": {
            "avg_fit": avg_fit,
            "avg_quality": avg_quality,
            "avg_value": avg_value,
        },
    }


# ──────────────────── POST Create Review ────────────────────

@router.post("/product/{product_id}")
async def create_review(
    product_id: str,
    inp: ReviewCreate,
    request: Request,
):
    """Submit a new product review with spam detection & purchase verification."""

    # Validate product exists
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    user = await get_current_user_or_none(request)
    client_ip = request.client.host if request.client else "unknown"

    user_id = user.get("id") if user else None

    # ── Prevent duplicate reviews for same product by same user ──
    if user_id:
        existing = await db.reviews.find_one({
            "product_id": product_id,
            "user_id": user_id,
            "status": {"$nin": ["soft_deleted", "rejected"]},
        })
        if existing:
            raise HTTPException(
                status_code=409,
                detail="You have already reviewed this product. You may edit your existing review instead.",
            )

    # ── Build review document ──
    doc = inp.model_dump()
    doc["product_id"] = product_id
    doc["user_id"] = user_id
    doc["client_ip"] = client_ip
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = None
    doc["helpfulVotes"] = 0
    doc["notHelpfulVotes"] = 0
    doc["upvotedBy"] = []
    doc["downvotedBy"] = []
    doc["reactions"] = {"like": 0, "love": 0, "useful": 0}
    doc["reactionUsers"] = {}
    doc["adminResponse"] = None
    doc["reports"] = []
    doc["report_count"] = 0
    doc["moderation_history"] = []

    # Consolidate photos
    photos_list = list(doc.get("photos") or [])
    if doc.get("photoUrl") and doc["photoUrl"] not in photos_list:
        photos_list.append(doc["photoUrl"])
    doc["photos"] = photos_list

    # ── Purchase verification ──
    if user and doc.get("verifiedPurchase") is None:
        doc["verifiedPurchase"] = await _verify_purchase(user, product_id)
    elif doc.get("verifiedPurchase") is None:
        doc["verifiedPurchase"] = False

    # ── Spam & Trust scoring ──
    trust = await compute_trust_score(
        text=doc["comment"],
        user_id=user_id,
        client_ip=client_ip,
        product_id=product_id,
    )
    doc["status"] = trust["status"]
    doc["trust_score"] = trust["score"]
    doc["content_hash"] = trust["content_hash"]
    doc["spam_flags"] = trust["flags"]

    # ── Insert ──
    result = await db.reviews.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)

    # ── Recalculate product rating (only for approved reviews) ──
    if doc["status"] == "approved":
        await _recalc_product_rating(product_id)

    # Log moderation
    await db.review_audit_log.insert_one({
        "review_id": doc["id"],
        "action": "created",
        "status": doc["status"],
        "trust_score": doc["trust_score"],
        "flags": doc["spam_flags"],
        "actor": user_id or client_ip,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # Anonymize response if needed
    if doc.get("anonymous"):
        doc["userName"] = "Anonymous Customer"
        doc.pop("userEmail", None)

    return doc


# ──────────────────── PUT Edit Review ────────────────────

@router.put("/{review_id}")
async def edit_review(
    review_id: str,
    updates: ReviewUpdate,
    request: Request,
):
    """Edit an existing review within the configurable time window."""
    user = await get_current_user_or_none(request)

    try:
        review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    except Exception:
        review = None

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # ── Authorization ──
    if user:
        is_author = str(review.get("user_id")) == user.get("id")
        is_admin = user.get("role") == "admin"
        if not is_author and not is_admin:
            raise HTTPException(status_code=403, detail="Not authorized to edit this review")
    else:
        raise HTTPException(status_code=401, detail="Authentication required to edit reviews")

    # ── Edit window check (skip for admins) ──
    if not is_admin:
        created_at = review.get("created_at", "")
        if created_at:
            try:
                created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                window_end = created_dt + timedelta(days=REVIEW_EDIT_WINDOW_DAYS)
                if datetime.now(timezone.utc) > window_end:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Reviews can only be edited within {REVIEW_EDIT_WINDOW_DAYS} days of submission.",
                    )
            except (ValueError, TypeError):
                pass

    # ── Apply updates ──
    update_dict = updates.model_dump(exclude_unset=True, exclude_none=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Re-run spam check if comment changed
    if "comment" in update_dict:
        trust = await compute_trust_score(
            text=update_dict["comment"],
            user_id=str(review.get("user_id")),
            product_id=review.get("product_id", ""),
        )
        update_dict["trust_score"] = trust["score"]
        update_dict["content_hash"] = trust["content_hash"]
        update_dict["spam_flags"] = trust["flags"]
        # Only auto-flag if score dropped; don't downgrade approved status on edit
        if trust["score"] < 40:
            update_dict["status"] = "flagged"

    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {"$set": update_dict},
    )

    updated = await db.reviews.find_one({"_id": to_object_id(review_id)})
    product_id = review.get("product_id")
    if product_id:
        await _recalc_product_rating(product_id)

    # Audit log
    await db.review_audit_log.insert_one({
        "review_id": review_id,
        "action": "edited",
        "changes": list(update_dict.keys()),
        "actor": user.get("id") if user else "unknown",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return serialize_doc(updated)


# ──────────────────── DELETE Review ────────────────────

@router.delete("/{review_id}")
async def delete_review(review_id: str, request: Request):
    """Delete a review (author or admin). Recalculates product rating."""
    user = await get_current_user_or_none(request)

    try:
        review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    except Exception:
        review = None

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if user:
        is_author = str(review.get("user_id")) == user.get("id")
        is_admin = user.get("role") == "admin"
        if not is_author and not is_admin:
            raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    else:
        raise HTTPException(status_code=401, detail="Authentication required")

    product_id = review.get("product_id")

    # Soft delete for customer; admins can hard delete via admin router
    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {"$set": {
            "status": "soft_deleted",
            "deleted_at": datetime.now(timezone.utc).isoformat(),
            "deleted_by": user.get("id") if user else "unknown",
        }},
    )

    if product_id:
        await _recalc_product_rating(product_id)

    await db.review_audit_log.insert_one({
        "review_id": review_id,
        "action": "deleted",
        "actor": user.get("id") if user else "unknown",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": "Review deleted successfully", "product_id": product_id}


# ──────────────────── POST Vote ────────────────────

@router.post("/{review_id}/vote")
async def vote_on_review(review_id: str, vote: ReviewVote, request: Request):
    """Toggle helpful / not-helpful vote on a review."""
    user = await get_current_user_or_none(request)
    client_ip = request.client.host if request.client else "anonymous"
    voter_key = user.get("id") if user else client_ip

    review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    upvoted_by = list(review.get("upvotedBy") or [])
    downvoted_by = list(review.get("downvotedBy") or [])
    helpful = review.get("helpfulVotes", 0)
    not_helpful = review.get("notHelpfulVotes", 0)

    if vote.vote_type == VoteType.HELPFUL:
        if voter_key in upvoted_by:
            upvoted_by.remove(voter_key)
            helpful = max(0, helpful - 1)
            user_voted = False
        else:
            upvoted_by.append(voter_key)
            helpful += 1
            user_voted = True
            # Remove from downvoted if exists
            if voter_key in downvoted_by:
                downvoted_by.remove(voter_key)
                not_helpful = max(0, not_helpful - 1)
    else:
        if voter_key in downvoted_by:
            downvoted_by.remove(voter_key)
            not_helpful = max(0, not_helpful - 1)
            user_voted = False
        else:
            downvoted_by.append(voter_key)
            not_helpful += 1
            user_voted = True
            if voter_key in upvoted_by:
                upvoted_by.remove(voter_key)
                helpful = max(0, helpful - 1)

    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {"$set": {
            "helpfulVotes": helpful,
            "notHelpfulVotes": not_helpful,
            "upvotedBy": upvoted_by,
            "downvotedBy": downvoted_by,
        }},
    )

    return {
        "helpfulVotes": helpful,
        "notHelpfulVotes": not_helpful,
        "userVoted": user_voted,
        "voteType": vote.vote_type.value,
    }


# ──────────────────── POST Reaction ────────────────────

@router.post("/{review_id}/react")
async def react_to_review(review_id: str, reaction: ReviewReaction, request: Request):
    """Toggle a lightweight reaction on a review."""
    user = await get_current_user_or_none(request)
    client_ip = request.client.host if request.client else "anonymous"
    reactor_key = user.get("id") if user else client_ip

    review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    reactions = dict(review.get("reactions") or {"like": 0, "love": 0, "useful": 0})
    reaction_users = dict(review.get("reactionUsers") or {})
    reaction_type = reaction.reaction_type.value

    user_reactions = reaction_users.get(reactor_key, [])

    if reaction_type in user_reactions:
        user_reactions.remove(reaction_type)
        reactions[reaction_type] = max(0, reactions.get(reaction_type, 0) - 1)
        toggled = False
    else:
        user_reactions.append(reaction_type)
        reactions[reaction_type] = reactions.get(reaction_type, 0) + 1
        toggled = True

    reaction_users[reactor_key] = user_reactions

    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {"$set": {"reactions": reactions, "reactionUsers": reaction_users}},
    )

    return {"reactions": reactions, "toggled": toggled, "reaction_type": reaction_type}


# ──────────────────── POST Report ────────────────────

@router.post("/{review_id}/report")
async def report_review(review_id: str, report: ReviewReport, request: Request):
    """Flag a review for admin moderation."""
    user = await get_current_user_or_none(request)
    client_ip = request.client.host if request.client else "anonymous"
    reporter = user.get("id") if user else client_ip

    review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    report_doc = {
        "reporter": reporter,
        "reason": report.reason.value,
        "comment": report.comment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {
            "$push": {"reports": report_doc},
            "$inc": {"report_count": 1},
        },
    )

    # Auto-flag if report count exceeds threshold
    updated = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if (updated.get("report_count", 0) >= 3 and
            updated.get("status") not in ["flagged", "spam", "rejected"]):
        await db.reviews.update_one(
            {"_id": to_object_id(review_id)},
            {"$set": {"status": "flagged"}},
        )

    await db.review_audit_log.insert_one({
        "review_id": review_id,
        "action": "reported",
        "reason": report.reason.value,
        "reporter": reporter,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": "Review reported successfully. Our moderation team will review it."}


# ──────────────────── GET User Reviews ────────────────────

@router.get("/user/my-reviews")
async def get_user_reviews(request: Request):
    """Get the current user's submitted reviews and products eligible for review."""
    user = await get_current_user(request)
    user_id = user.get("id")

    # User's submitted reviews
    reviews = await db.reviews.find({
        "user_id": user_id,
        "status": {"$ne": "soft_deleted"},
    }).sort("created_at", -1).to_list(100)

    # Find products the user has ordered but not yet reviewed
    user_phone = user.get("phone")
    user_email = user.get("email")

    or_clauses = []
    if user_phone:
        or_clauses.extend([{"phone": user_phone}, {"customerPhone": user_phone}])
    if user_email:
        or_clauses.extend([{"email": user_email}, {"customerEmail": user_email}])
    if user_id:
        or_clauses.append({"user_id": user_id})

    eligible_products = []
    if or_clauses:
        orders = await db.orders.find({"$or": or_clauses}).to_list(200)
        reviewed_product_ids = {r.get("product_id") for r in reviews}

        for order in orders:
            for item in order.get("items", []):
                pid = item.get("id") or item.get("product_id")
                if pid and pid not in reviewed_product_ids:
                    eligible_products.append({
                        "product_id": pid,
                        "product_name": item.get("name", "Product"),
                        "product_image": item.get("image", ""),
                        "order_id": str(order.get("_id", "")),
                    })
                    reviewed_product_ids.add(pid)  # deduplicate

    return {
        "reviews": [serialize_doc(r) for r in reviews],
        "eligible_products": eligible_products,
    }
