"""
Admin Products Router — Enhanced with Category-Aware Product Creation & Robust Deletion
Supports extended fields: images gallery, categorySpecs, logistics, returnPolicy, deliveryInfo
Supports deleting and updating products by ObjectId, string _id, string id, or seed_ index.
"""

import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc, to_object_id, build_id_query
from core.security import get_current_admin
from models.product import ProductCreate
from services.meilisearch_service import index_product, delete_product_from_index

from core.cache import cache_invalidate_pattern

router = APIRouter(prefix="/products", tags=["Admin - Products"])


def generate_sku(category: str, name: str) -> str:
    """Auto-generate a unique SKU like RV-SAR-A3X7."""
    cat_code = (category or "GEN")[:3].upper()
    rand_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"RV-{cat_code}-{rand_suffix}"


async def resolve_product_query(product_id: str):
    """
    Resolve a product_id to an exact MongoDB query filter dict.
    Supports ObjectId, string _id, string id, and seed_N index fallbacks.
    """
    if not product_id:
        return {"_id": None}

    # 1. Try standard query (_id or id)
    query = build_id_query(product_id)
    doc = await db.products.find_one(query)
    if doc:
        return {"_id": doc["_id"]}

    # 2. Handle seed_N format (e.g., seed_4, seed_7)
    if isinstance(product_id, str) and product_id.startswith("seed_"):
        try:
            idx = int(product_id.split("_")[1])
            all_prods = await db.products.find({}).to_list(1000)
            if 0 <= idx < len(all_prods):
                return {"_id": all_prods[idx]["_id"]}
        except Exception:
            pass

    return query


@router.post("")
async def create_product(inp: ProductCreate, admin: dict = Depends(get_current_admin)):
    doc = inp.model_dump()

    # Auto-generate SKU if not provided
    if not doc.get("sku"):
        doc["sku"] = generate_sku(doc.get("category", "GEN"), doc.get("name", ""))

    # Serialize nested Pydantic models to dicts for MongoDB
    if doc.get("logistics") and hasattr(doc["logistics"], "model_dump"):
        doc["logistics"] = doc["logistics"].model_dump()
    if doc.get("returnPolicy") and hasattr(doc["returnPolicy"], "model_dump"):
        doc["returnPolicy"] = doc["returnPolicy"].model_dump()
    if doc.get("deliveryInfo") and hasattr(doc["deliveryInfo"], "model_dump"):
        doc["deliveryInfo"] = doc["deliveryInfo"].model_dump()

    # Add server timestamps
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]

    res = await db.products.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    index_product(doc)
    await cache_invalidate_pattern("api_products:*")
    return doc

@router.patch("/{product_id}")
async def update_product(product_id: str, updates: dict, admin: dict = Depends(get_current_admin)):
    updates.pop("_id", None)
    updates.pop("id", None)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    query = await resolve_product_query(product_id)
    res = await db.products.update_one(query, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = await db.products.find_one(query)
    doc = serialize_doc(updated)
    index_product(doc)
    await cache_invalidate_pattern("api_products:*")
    await cache_invalidate_pattern(f"api_product:{product_id}")
    return doc

@router.delete("/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    query = await resolve_product_query(product_id)
    res = await db.products.delete_one(query)
    
    # Clean up index and Redis cache
    delete_product_from_index(product_id)
    await cache_invalidate_pattern("api_products:*")
    await cache_invalidate_pattern(f"api_product:{product_id}")
    
    return {"message": "Product deleted successfully"}
