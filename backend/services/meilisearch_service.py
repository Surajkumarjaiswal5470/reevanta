import logging
import requests
from typing import List, Dict, Any, Optional
from core.config import MEILISEARCH_URL, MEILISEARCH_MASTER_KEY
from core.database import db, serialize_doc

logger = logging.getLogger("reevanta.meilisearch")

HEADERS = {
    "Authorization": f"Bearer {MEILISEARCH_MASTER_KEY}",
    "Content-Type": "application/json"
}

INDEX_NAME = "products"

def is_meilisearch_available() -> bool:
    """Check if Meilisearch engine is active and reachable."""
    try:
        res = requests.get(f"{MEILISEARCH_URL}/health", headers=HEADERS, timeout=1.5)
        return res.status_code == 200 and res.json().get("status") == "available"
    except Exception:
        return False

def init_meilisearch():
    """Initialize Meilisearch settings, searchable fields, and filterable attributes."""
    if not is_meilisearch_available():
        logger.info("Meilisearch server not running at %s. Falling back to MongoDB text search.", MEILISEARCH_URL)
        return False

    try:
        # Create index if it does not exist
        requests.post(f"{MEILISEARCH_URL}/indexes", json={"uid": INDEX_NAME, "primaryKey": "id"}, headers=HEADERS, timeout=3)
        
        # Configure settings for typo tolerance & attributes
        settings = {
            "searchableAttributes": ["name", "brand", "category", "tags", "description"],
            "filterableAttributes": ["category", "inStock", "isFlashSale", "price"],
            "sortableAttributes": ["price", "discountPercent"],
            "typoTolerance": {
                "enabled": True,
                "minWordSizeForTypos": {"oneTypo": 4, "twoTypos": 8}
            }
        }
        requests.patch(f"{MEILISEARCH_URL}/indexes/{INDEX_NAME}/settings", json=settings, headers=HEADERS, timeout=3)
        logger.info("Meilisearch index '%s' initialized successfully.", INDEX_NAME)
        return True
    except Exception as err:
        logger.warning("Meilisearch initialization warning: %s", err)
        return False

def index_product(product: dict):
    """Add or update a single product document in Meilisearch."""
    if not is_meilisearch_available():
        return False
    try:
        doc = serialize_doc(product)
        doc["id"] = str(doc.get("id") or doc.get("_id"))
        doc.pop("_id", None)
        res = requests.post(f"{MEILISEARCH_URL}/indexes/{INDEX_NAME}/documents", json=[doc], headers=HEADERS, timeout=3)
        return res.status_code in (200, 202)
    except Exception as err:
        logger.warning("Failed to index product in Meilisearch: %s", err)
        return False

def bulk_index_products(products: list):
    """Bulk index products array into Meilisearch."""
    if not is_meilisearch_available():
        return False
    try:
        docs = []
        for p in products:
            doc = serialize_doc(p)
            doc["id"] = str(doc.get("id") or doc.get("_id"))
            doc.pop("_id", None)
            docs.append(doc)
        
        if docs:
            requests.post(f"{MEILISEARCH_URL}/indexes/{INDEX_NAME}/documents", json=docs, headers=HEADERS, timeout=5)
            logger.info("Bulk indexed %d products in Meilisearch.", len(docs))
        return True
    except Exception as err:
        logger.warning("Bulk index failed for Meilisearch: %s", err)
        return False

def delete_product_from_index(product_id: str):
    """Remove a product document from Meilisearch."""
    if not is_meilisearch_available():
        return False
    try:
        requests.delete(f"{MEILISEARCH_URL}/indexes/{INDEX_NAME}/documents/{product_id}", headers=HEADERS, timeout=3)
        return True
    except Exception as err:
        logger.warning("Failed to delete product from Meilisearch: %s", err)
        return False

async def search_products(query: Optional[str] = None, category: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Advanced Typo-Tolerant Search using Meilisearch with automatic fallback to MongoDB.
    """
    if is_meilisearch_available() and query and len(query.strip()) > 0:
        try:
            search_params = {
                "q": query.strip(),
                "limit": limit,
            }
            if category and category != "all":
                search_params["filter"] = f"category = '{category}'"

            res = requests.post(f"{MEILISEARCH_URL}/indexes/{INDEX_NAME}/search", json=search_params, headers=HEADERS, timeout=3)
            if res.status_code == 200:
                hits = res.json().get("hits", [])
                logger.info("Meilisearch query '%s' returned %d hits.", query, len(hits))
                return hits
        except Exception as err:
            logger.warning("Meilisearch search error: %s. Falling back to MongoDB.", err)

    # Fallback to MongoDB
    try:
        mongo_query = {}
        if category and category != "all":
            mongo_query["category"] = category
        if query and len(query.strip()) > 0:
            regex = {"$regex": query.strip(), "$options": "i"}
            mongo_query["$or"] = [{"name": regex}, {"brand": regex}, {"description": regex}, {"tags": regex}, {"category": regex}]
        
        products = await db.products.find(mongo_query).to_list(limit)
        return [serialize_doc(p) for p in products]
    except Exception as err:
        logger.warning("MongoDB product search failed: %s", err)
        return []

async def search_suggestions(query: str, limit: int = 6) -> List[Dict[str, Any]]:
    """Instant autocomplete suggestions with Meilisearch typo tolerance."""
    if not query or len(query.strip()) < 1:
        return []
    
    if is_meilisearch_available():
        try:
            search_params = {
                "q": query.strip(),
                "limit": limit,
                "attributesToRetrieve": ["id", "name", "brand", "category", "price", "image", "tags"]
            }
            res = requests.post(f"{MEILISEARCH_URL}/indexes/{INDEX_NAME}/search", json=search_params, headers=HEADERS, timeout=2)
            if res.status_code == 200:
                hits = res.json().get("hits", [])
                return hits
        except Exception:
            pass

    # MongoDB fallback
    regex = {"$regex": query.strip(), "$options": "i"}
    cursor = db.products.find({"$or": [{"name": regex}, {"brand": regex}, {"tags": regex}]}).limit(limit)
    products = await cursor.to_list(limit)
    return [serialize_doc(p) for p in products]

def clear_search_index() -> bool:
    """Delete all documents in the Meilisearch index."""
    if not is_meilisearch_available():
        return False
    try:
        res = requests.delete(f"{MEILISEARCH_URL}/indexes/{INDEX_NAME}/documents", headers=HEADERS, timeout=3)
        return res.status_code == 200
    except Exception as err:
        logger.warning("Failed to clear Meilisearch index: %s", err)
        return False
