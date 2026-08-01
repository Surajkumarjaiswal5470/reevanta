from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin, get_current_user_or_none
from models.product import ProductCreate, ReviewCreate, ReviewVote, AdminReviewReply
from services.meilisearch_service import search_products, search_suggestions

from core.cache import cache_get, cache_set, cache_invalidate_pattern

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("")
async def get_products(
    category: Optional[str] = None,
    q: Optional[str] = None,
    page: Optional[int] = None,
    limit: int = 100,
    sort_by: Optional[str] = None
):
    cache_key = f"api_products:{category}:{q}:{page}:{limit}:{sort_by}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    all_items = await search_products(query=q, category=category, limit=1000)

    if sort_by == "price_low":
        all_items = sorted(all_items, key=lambda x: x.get("price", 0))
    elif sort_by == "price_high":
        all_items = sorted(all_items, key=lambda x: x.get("price", 0), reverse=True)
    elif sort_by == "rating":
        all_items = sorted(all_items, key=lambda x: x.get("rating", 0), reverse=True)
    elif sort_by == "newest":
        all_items = sorted(all_items, key=lambda x: x.get("created_at", ""), reverse=True)

    total = len(all_items)

    if page is not None and page > 0:
        start = (page - 1) * limit
        end = start + limit
        paginated_items = all_items[start:end]
        total_pages = max(1, (total + limit - 1) // limit) if total > 0 else 1
        result = {
            "items": paginated_items,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": total_pages,
            "has_more": page < total_pages
        }
    else:
        result = all_items[:limit]

    await cache_set(cache_key, result, ttl_seconds=300)
    return result

@router.get("/search-suggest")
async def search_suggest(q: str, limit: int = 6):
    cache_key = f"api_search_suggest:{q}:{limit}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    res = await search_suggestions(query=q, limit=limit)
    await cache_set(cache_key, res, ttl_seconds=300)
    return res

@router.get("/{product_id}")
async def get_product(product_id: str):
    cache_key = f"api_product:{product_id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    res = serialize_doc(product)
    await cache_set(cache_key, res, ttl_seconds=300)
    return res

@router.get("/{product_id}/reviews")
async def get_product_reviews(
    product_id: str,
    sort_by: Optional[str] = "recent",  # recent, highest, lowest, helpful
    rating_filter: Optional[int] = None,  # 1..5
    verified_only: bool = False,
    photos_only: bool = False,
    limit: int = 100
):
    query = {"product_id": product_id}
    if rating_filter in (1, 2, 3, 4, 5):
        query["rating"] = rating_filter
    if verified_only:
        query["verifiedPurchase"] = True
    if photos_only:
        query["$or"] = [
            {"photos": {"$exists": True, "$not": {"$size": 0}}},
            {"photoUrl": {"$ne": None}}
        ]

    try:
        all_reviews = await db.reviews.find({"product_id": product_id}).to_list(1000)
    except Exception:
        all_reviews = []

    total_all = len(all_reviews)

    # Compute overall metrics across ALL reviews for this product
    avg_rating = round((sum(r.get("rating", 5) for r in all_reviews) / total_all), 1) if total_all > 0 else 0.0
    recommend_count = sum(1 for r in all_reviews if r.get("rating", 5) >= 4)
    recommend_percent = int(round((recommend_count / total_all) * 100)) if total_all > 0 else 100

    rating_breakdown = {
        "5": len([r for r in all_reviews if r.get("rating", 0) == 5]),
        "4": len([r for r in all_reviews if r.get("rating", 0) == 4]),
        "3": len([r for r in all_reviews if r.get("rating", 0) == 3]),
        "2": len([r for r in all_reviews if r.get("rating", 0) == 2]),
        "1": len([r for r in all_reviews if r.get("rating", 0) == 1]),
    }

    # Feature averages
    fit_ratings = [r.get("fitRating") for r in all_reviews if r.get("fitRating") is not None]
    quality_ratings = [r.get("qualityRating") for r in all_reviews if r.get("qualityRating") is not None]
    value_ratings = [r.get("valueRating") for r in all_reviews if r.get("valueRating") is not None]

    avg_fit = round(sum(fit_ratings) / len(fit_ratings), 1) if fit_ratings else 3.0
    avg_quality = round(sum(quality_ratings) / len(quality_ratings), 1) if quality_ratings else 4.8
    avg_value = round(sum(value_ratings) / len(value_ratings), 1) if value_ratings else 4.7

    try:
        cursor = db.reviews.find(query)
        if sort_by == "highest":
            cursor = cursor.sort("rating", -1)
        elif sort_by == "lowest":
            cursor = cursor.sort("rating", 1)
        elif sort_by == "helpful":
            cursor = cursor.sort("helpfulVotes", -1)
        else:  # recent
            cursor = cursor.sort("created_at", -1)

        filtered_reviews = await cursor.to_list(limit)
    except Exception:
        filtered_reviews = []

    return {
        "reviews": [serialize_doc(r) for r in filtered_reviews],
        "total": len(filtered_reviews),
        "total_unfiltered": total_all,
        "avg_rating": avg_rating,
        "recommend_percent": recommend_percent,
        "breakdown": rating_breakdown,
        "feature_ratings": {
            "avg_fit": avg_fit,
            "avg_quality": avg_quality,
            "avg_value": avg_value
        }
    }

@router.post("/{product_id}/reviews")
async def add_product_review(
    product_id: str,
    inp: ReviewCreate,
    request: Request
):
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    user = await get_current_user_or_none(request)
    doc = inp.model_dump()
    doc["product_id"] = product_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["helpfulVotes"] = 0
    doc["upvotedBy"] = []
    doc["adminResponse"] = None

    # Consolidate photos array
    photos_list = list(doc.get("photos") or [])
    if doc.get("photoUrl") and doc["photoUrl"] not in photos_list:
        photos_list.append(doc["photoUrl"])
    doc["photos"] = photos_list

    # Auto-verify purchase if user is logged in & has ordered product
    if user and doc.get("verifiedPurchase") is None:
        user_phone = user.get("phone")
        user_email = user.get("email")
        query = {"$or": []}
        if user_phone:
            query["$or"].append({"phone": user_phone})
            query["$or"].append({"customerPhone": user_phone})
        if user_email:
            query["$or"].append({"email": user_email})
            query["$or"].append({"customerEmail": user_email})

        existing_order = None
        if query["$or"]:
            existing_order = await db.orders.find_one({
                "$and": [
                    query,
                    {"$or": [{"items.id": product_id}, {"items.product_id": product_id}]}
                ]
            })
        doc["verifiedPurchase"] = existing_order is not None
    elif doc.get("verifiedPurchase") is None:
        doc["verifiedPurchase"] = True

    res = await db.reviews.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)

    # Recompute average rating & review count for product
    all_reviews = await db.reviews.find({"product_id": product_id}).to_list(1000)
    new_avg = round(sum(r.get("rating", 5) for r in all_reviews) / len(all_reviews), 1) if all_reviews else 0.0
    await db.products.update_one(
        {"_id": to_object_id(product_id)},
        {"$set": {"rating": new_avg, "reviewsCount": len(all_reviews)}}
    )

    # Invalidate catalog & product caches
    await cache_invalidate_pattern("api_products:*")
    await cache_invalidate_pattern(f"api_product:{product_id}")

    return doc

@router.post("/reviews/{review_id}/vote")
async def vote_review_helpful(review_id: str, request: Request):
    user = await get_current_user_or_none(request)
    client_ip = request.client.host if request.client else "anonymous"
    voter_key = user.get("id") if user else client_ip

    review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    upvoted_by = list(review.get("upvotedBy") or [])
    if voter_key in upvoted_by:
        # Toggle off
        upvoted_by.remove(voter_key)
        new_count = max(0, review.get("helpfulVotes", 1) - 1)
    else:
        # Toggle on
        upvoted_by.append(voter_key)
        new_count = review.get("helpfulVotes", 0) + 1

    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {"$set": {"helpfulVotes": new_count, "upvotedBy": upvoted_by}}
    )
    return {"helpfulVotes": new_count, "userVoted": voter_key in upvoted_by}

@router.post("/reviews/{review_id}/reply")
async def reply_to_review(review_id: str, inp: AdminReviewReply, admin: dict = Depends(get_current_admin)):
    review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    reply_doc = {
        "responseText": inp.responseText,
        "respondedBy": admin.get("name", "RIVAANTA Support"),
        "respondedAt": datetime.now(timezone.utc).isoformat()
    }

    await db.reviews.update_one(
        {"_id": to_object_id(review_id)},
        {"$set": {"adminResponse": reply_doc}}
    )
    return reply_doc

@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, admin: dict = Depends(get_current_admin)):
    review = await db.reviews.find_one({"_id": to_object_id(review_id)})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    product_id = review.get("product_id")
    await db.reviews.delete_one({"_id": to_object_id(review_id)})

    # Recalculate product rating
    if product_id:
        all_reviews = await db.reviews.find({"product_id": product_id}).to_list(1000)
        new_avg = round(sum(r.get("rating", 5) for r in all_reviews) / len(all_reviews), 1) if all_reviews else 0.0
        await db.products.update_one(
            {"_id": to_object_id(product_id)},
            {"$set": {"rating": new_avg, "reviewsCount": len(all_reviews)}}
        )

    return {"message": "Review deleted successfully"}

@router.get("/{product_id}/recommendations")
async def get_product_recommendations(product_id: str):
    """Tag-based & Category Collaborative Filtering Recommendation Engine."""
    target = await db.products.find_one({"_id": to_object_id(product_id)})
    if not target:
        return {"frequently_bought_together": [], "related_products": []}

    target_tags = target.get("tags", [])
    target_category = target.get("category", "")

    all_products = await db.products.find({"_id": {"$ne": to_object_id(product_id)}}).to_list(100)

    def compute_similarity(p):
        score = 0
        if p.get("category") == target_category:
            score += 2
        p_tags = p.get("tags", [])
        overlap = set(target_tags).intersection(set(p_tags))
        score += len(overlap) * 3
        return score

    sorted_by_relevance = sorted(all_products, key=compute_similarity, reverse=True)

    # Frequently bought together (complementary across categories e.g. jewelry + clothes)
    freq_bought = [serialize_doc(p) for p in sorted_by_relevance[:2]]
    # Related products (similar category & tags)
    related = [serialize_doc(p) for p in sorted_by_relevance[2:6]]

    return {
        "frequently_bought_together": freq_bought,
        "related_products": related
    }

@router.post("")
async def create_product(inp: ProductCreate, admin: dict = Depends(get_current_admin)):
    from routers.admin.products import create_product as admin_create_product
    return await admin_create_product(inp, admin)

@router.patch("/{product_id}")
async def update_product(product_id: str, updates: dict, admin: dict = Depends(get_current_admin)):
    from routers.admin.products import update_product as admin_update_product
    return await admin_update_product(product_id, updates, admin)

@router.delete("/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    from routers.admin.products import delete_product as admin_delete_product
    return await admin_delete_product(product_id, admin)
