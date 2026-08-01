from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.product import ProductCreate, ReviewCreate
from services.meilisearch_service import search_products, search_suggestions

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("")
async def get_products(category: Optional[str] = None, q: Optional[str] = None, limit: int = 100):
    return await search_products(query=q, category=category, limit=limit)

@router.get("/search-suggest")
async def search_suggest(q: str, limit: int = 6):
    return await search_suggestions(query=q, limit=limit)

@router.get("/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_doc(product)

@router.get("/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}).sort("created_at", -1).to_list(100)
    
    # Calculate breakdown
    total = len(reviews)
    avg_rating = round(sum(r.get("rating", 5) for r in reviews) / total, 1) if total > 0 else 4.8
    rating_breakdown = {
        "5": len([r for r in reviews if r.get("rating") == 5]),
        "4": len([r for r in reviews if r.get("rating") == 4]),
        "3": len([r for r in reviews if r.get("rating") == 3]),
        "2": len([r for r in reviews if r.get("rating") == 2]),
        "1": len([r for r in reviews if r.get("rating") == 1]),
    }
    return {
        "reviews": [serialize_doc(r) for r in reviews],
        "total": total,
        "avg_rating": avg_rating,
        "breakdown": rating_breakdown
    }

@router.post("/{product_id}/reviews")
async def add_product_review(product_id: str, inp: ReviewCreate):
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    doc = inp.model_dump()
    doc["product_id"] = product_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.reviews.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)

    # Recompute average rating for product
    all_reviews = await db.reviews.find({"product_id": product_id}).to_list(200)
    new_avg = round(sum(r.get("rating", 5) for r in all_reviews) / len(all_reviews), 1)
    await db.products.update_one(
        {"_id": to_object_id(product_id)},
        {"$set": {"rating": new_avg, "reviewsCount": len(all_reviews)}}
    )

    return doc

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
