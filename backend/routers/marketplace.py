from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel
from datetime import datetime, timezone
from bson import ObjectId
from core.database import db, serialize_doc

router = APIRouter(prefix="/marketplace", tags=["Marketplace Features"])

# --- Models ---
class WishlistToggleRequest(BaseModel):
    user_id: str
    product_id: str

class SavedSearchRequest(BaseModel):
    user_id: str
    query: str
    filters: Optional[Dict[str, Any]] = {}

class ReportListingRequest(BaseModel):
    product_id: str
    reporter_user_id: Optional[str] = "guest"
    reason: str
    details: Optional[str] = ""

# --- 1. Wishlist / Favorites ---
@router.post("/wishlist/toggle")
async def toggle_wishlist_item(req: WishlistToggleRequest):
    """Toggle a product in the user's wishlist."""
    user_id = req.user_id
    product_id = req.product_id

    try:
        existing = await db.wishlists.find_one({"user_id": user_id, "product_id": product_id})
        if existing:
            await db.wishlists.delete_one({"_id": existing["_id"]})
            return {"message": "Removed from wishlist", "in_wishlist": False, "product_id": product_id}
        else:
            doc = {
                "user_id": user_id,
                "product_id": product_id,
                "added_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wishlists.insert_one(doc)
            return {"message": "Added to wishlist", "in_wishlist": True, "product_id": product_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wishlist")
async def get_user_wishlist(user_id: str = Query(...)):
    """Fetch all products in user's wishlist."""
    try:
        wish_docs = await db.wishlists.find({"user_id": user_id}).to_list(100)
        p_ids = [w["product_id"] for w in wish_docs]
        
        object_ids = []
        string_ids = []
        for pid in p_ids:
            if ObjectId.is_valid(pid):
                object_ids.append(ObjectId(pid))
            string_ids.append(pid)

        products = await db.products.find({
            "$or": [
                {"_id": {"$in": object_ids}},
                {"id": {"$in": string_ids}}
            ]
        }).to_list(100)

        return [serialize_doc(p) for p in products]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. Saved Searches ---
@router.post("/saved-searches")
async def save_search(req: SavedSearchRequest):
    """Save search query & filter criteria."""
    try:
        doc = {
            "user_id": req.user_id,
            "query": req.query,
            "filters": req.filters or {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        res = await db.saved_searches.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return {"message": "Search saved successfully", "saved_search": serialize_doc(doc)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved-searches")
async def get_saved_searches(user_id: str = Query(...)):
    """Fetch user's saved searches."""
    try:
        docs = await db.saved_searches.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
        return [serialize_doc(d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/saved-searches/{search_id}")
async def delete_saved_search(search_id: str):
    """Delete a saved search."""
    try:
        if ObjectId.is_valid(search_id):
            await db.saved_searches.delete_one({"_id": ObjectId(search_id)})
        else:
            await db.saved_searches.delete_one({"_id": search_id})
        return {"message": "Saved search deleted", "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. Report Listing ---
@router.post("/report")
async def report_listing(req: ReportListingRequest):
    """Flag or report an inappropriate or misleading product listing."""
    try:
        report_doc = {
            "product_id": req.product_id,
            "reporter_user_id": req.reporter_user_id,
            "reason": req.reason,
            "details": req.details,
            "status": "pending_review",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        res = await db.reported_listings.insert_one(report_doc)
        report_doc["_id"] = str(res.inserted_id)
        return {"message": "Report submitted. Thank you for keeping RIVAANTA safe!", "report": serialize_doc(report_doc)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. Similar Listings Recommendation Engine ---
@router.get("/similar/{product_id}")
async def get_similar_listings(product_id: str, limit: int = Query(6)):
    """Fetch algorithmically similar products based on category & price range."""
    try:
        # Find target product
        target = None
        if ObjectId.is_valid(product_id):
            target = await db.products.find_one({"_id": ObjectId(product_id)})
        if not target:
            target = await db.products.find_one({"id": product_id})

        if not target:
            # Fallback to featured products
            docs = await db.products.find().limit(limit).to_list(limit)
            return [serialize_doc(d) for d in docs]

        category = target.get("category", "")
        price = float(target.get("price", 0))

        # Query similar items in same category, within ±40% price range
        min_price = max(0, price * 0.6)
        max_price = price * 1.4

        query = {
            "category": category,
            "price": {"$gte": min_price, "$lte": max_price}
        }

        # Exclude self
        if "_id" in target:
            query["_id"] = {"$ne": target["_id"]}

        docs = await db.products.find(query).limit(limit).to_list(limit)

        if len(docs) < limit:
            # Fallback if not enough matches in price bracket
            fallback_query = {"category": category}
            if "_id" in target:
                fallback_query["_id"] = {"$ne": target["_id"]}
            docs = await db.products.find(fallback_query).limit(limit).to_list(limit)

        return [serialize_doc(d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
