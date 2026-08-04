"""
Admin Catalog Management Router
Handles Brands, Collections, Product Status Toggles, SKU Variants, 360° Images, and SEO.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.catalog import (
    BrandCreate, BrandUpdate, CollectionCreate, CollectionUpdate,
    ProductVariant, EnterpriseProductCreate, EnterpriseProductUpdate
)

router = APIRouter(prefix="/catalog", tags=["Admin - Catalog"])
public_brands_router = APIRouter(prefix="/brands", tags=["Brands"])
public_router = public_brands_router


# ──────────────────── Public Brand Endpoints ────────────────────

@public_brands_router.get("")
async def list_public_brands():
    """Public endpoint to fetch all brands for storefront showcase."""
    return await list_brands()


@public_brands_router.get("/{slug}")
async def get_brand_profile(slug: str):
    """Fetch detailed brand profile and its associated catalog products."""
    brand = await db.brands.find_one({"slug": slug.lower().strip()})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    brand_data = serialize_doc(brand)

    # Fetch products under this brand
    products = await db.products.find({
        "$or": [
            {"brand": brand_data.get("name")},
            {"brand_id": brand_data.get("id")},
            {"brand": {"$regex": slug, "$options": "i"}}
        ]
    }).to_list(100)

    brand_data["products"] = [serialize_doc(p) for p in products]
    brand_data["products_count"] = len(products)
    return brand_data


# Default Pre-seeded Brands
DEFAULT_BRANDS = [
    {
        "name": "RIVAANTA Luxury",
        "slug": "rivaanta-luxury",
        "description": "Signature Royal Ethnic Wear & Handcrafted Fine Silk",
        "logoUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200",
        "bannerUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600",
        "website": "https://therivaanta.com",
        "establishedYear": 2020,
        "originCountry": "Nepal",
        "featured": True,
        "sort_order": 1,
        "seo": {
            "metaTitle": "RIVAANTA Luxury Ethnic Wear | Handcrafted Royal Weaves",
            "metaDescription": "Discover signature luxury sarees, bridal lehengas, and royal kurtas from RIVAANTA Luxury."
        }
    },
    {
        "name": "Kanjivaram Heritage",
        "slug": "kanjivaram-heritage",
        "description": "Authentic Handwoven Kanjivaram & Banarasi Silk Sarees",
        "logoUrl": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=200",
        "bannerUrl": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600",
        "website": "https://therivaanta.com/brands/kanjivaram-heritage",
        "establishedYear": 2018,
        "originCountry": "India",
        "featured": True,
        "sort_order": 2,
        "seo": {
            "metaTitle": "Kanjivaram Heritage | Pure Handwoven Silk Sarees",
            "metaDescription": "Pure silk Kanjivaram sarees handcrafted by master weavers."
        }
    },
    {
        "name": "Zardozi Atelier",
        "slug": "zardozi-atelier",
        "description": "Heavy Zardozi Embroidered Bridal & Partywear Lehengas",
        "logoUrl": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200",
        "bannerUrl": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1600",
        "website": "https://therivaanta.com/brands/zardozi-atelier",
        "establishedYear": 2021,
        "originCountry": "Nepal",
        "featured": True,
        "sort_order": 3,
        "seo": {
            "metaTitle": "Zardozi Atelier | Royal Bridal Lehengas",
            "metaDescription": "Intricate hand-embroidered Zardozi lehengas and choli sets."
        }
    },
    {
        "name": "Kundan Jewels",
        "slug": "kundan-jewels",
        "description": "Heritage Gold & Kundan Fine Jewelry Collections",
        "logoUrl": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=200",
        "bannerUrl": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600",
        "website": "https://therivaanta.com/brands/kundan-jewels",
        "establishedYear": 2019,
        "originCountry": "Nepal",
        "featured": True,
        "sort_order": 4,
        "seo": {
            "metaTitle": "Kundan Jewels | Heritage Fine Gold & Kundan Jewelry",
            "metaDescription": "Royal Kundan chokers, Rani haars, and bridal jewelry."
        }
    }
]

# Default Pre-seeded Collections
DEFAULT_COLLECTIONS = [
    {"name": "Summer Silk 2026", "slug": "summer-silk-2026", "season": "Summer", "description": "Lightweight breathable organza & chiffon silk weaves", "featured": True},
    {"name": "Velvet Winter Royale", "slug": "velvet-winter-royale", "season": "Winter", "description": "Heavy velvet kurtas & zardozi embroidered shawls", "featured": True},
    {"name": "Festive Bridal Collection", "slug": "festive-bridal", "season": "Festive", "description": "Royal wedding bridal lehengas & Kundan jewelry sets", "featured": True},
    {"name": "New Arrivals", "slug": "new-arrivals", "season": "New Arrival", "description": "Fresh handcrafted luxury drops of the season", "featured": True},
]


# ──────────────────── BRANDS ────────────────────

@router.get("/brands")
async def list_brands():
    """Fetch all catalog brands."""
    brands = await db.brands.find({}).sort("name", 1).to_list(200)
    if not brands:
        seeded = []
        try:
            for b in DEFAULT_BRANDS:
                b_copy = dict(b)
                b_copy["created_at"] = datetime.now(timezone.utc).isoformat()
                res = await db.brands.insert_one(b_copy)
                b_copy["id"] = str(res.inserted_id)
                b_copy.pop("_id", None)
                seeded.append(b_copy)
            return seeded
        except Exception:
            return DEFAULT_BRANDS
    return [serialize_doc(b) for b in brands]


@router.post("/brands")
async def create_brand(inp: BrandCreate, admin: dict = Depends(get_current_admin)):
    """Create a new brand."""
    slug_clean = (inp.slug or inp.name).strip().lower().replace(" ", "-")
    existing = await db.brands.find_one({"slug": slug_clean})
    if existing:
        raise HTTPException(status_code=400, detail=f"Brand with slug '{slug_clean}' already exists")

    doc = inp.model_dump()
    doc["slug"] = slug_clean
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.brands.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/brands/{brand_id}")
async def update_brand(brand_id: str, updates: BrandUpdate, admin: dict = Depends(get_current_admin)):
    """Update an existing brand."""
    update_dict = updates.model_dump(exclude_unset=True, exclude_none=True)
    if "slug" in update_dict:
        update_dict["slug"] = update_dict["slug"].strip().lower().replace(" ", "-")
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.brands.update_one({"_id": to_object_id(brand_id)}, {"$set": update_dict})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")

    updated = await db.brands.find_one({"_id": to_object_id(brand_id)})
    return serialize_doc(updated)


@router.delete("/brands/{brand_id}")
async def delete_brand(brand_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a brand."""
    res = await db.brands.delete_one({"_id": to_object_id(brand_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"message": "Brand deleted successfully"}


# ──────────────────── COLLECTIONS ────────────────────

@router.get("/collections")
async def list_collections():
    """Fetch all catalog collections."""
    collections = await db.collections.find({}).sort("name", 1).to_list(200)
    if not collections:
        seeded = []
        try:
            for c in DEFAULT_COLLECTIONS:
                c_copy = dict(c)
                c_copy["created_at"] = datetime.now(timezone.utc).isoformat()
                res = await db.collections.insert_one(c_copy)
                c_copy["id"] = str(res.inserted_id)
                c_copy.pop("_id", None)
                seeded.append(c_copy)
            return seeded
        except Exception:
            return DEFAULT_COLLECTIONS
    return [serialize_doc(c) for c in collections]


@router.post("/collections")
async def create_collection(inp: CollectionCreate, admin: dict = Depends(get_current_admin)):
    """Create a new collection."""
    slug_clean = (inp.slug or inp.name).strip().lower().replace(" ", "-")
    existing = await db.collections.find_one({"slug": slug_clean})
    if existing:
        raise HTTPException(status_code=400, detail=f"Collection with slug '{slug_clean}' already exists")

    doc = inp.model_dump()
    doc["slug"] = slug_clean
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.collections.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/collections/{collection_id}")
async def update_collection(collection_id: str, updates: CollectionUpdate, admin: dict = Depends(get_current_admin)):
    """Update an existing collection."""
    update_dict = updates.model_dump(exclude_unset=True, exclude_none=True)
    if "slug" in update_dict:
        update_dict["slug"] = update_dict["slug"].strip().lower().replace(" ", "-")
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.collections.update_one({"_id": to_object_id(collection_id)}, {"$set": update_dict})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")

    updated = await db.collections.find_one({"_id": to_object_id(collection_id)})
    return serialize_doc(updated)


@router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a collection."""
    res = await db.collections.delete_one({"_id": to_object_id(collection_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {"message": "Collection deleted successfully"}


# ──────────────────── SKU VARIANTS & 360° IMAGES ────────────────────

@router.post("/products/{product_id}/variants")
async def update_product_variants(
    product_id: str,
    variants: List[ProductVariant],
    admin: dict = Depends(get_current_admin),
):
    """Save or update multi-SKU variants for a product."""
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    variant_docs = [v.model_dump() for v in variants]
    await db.products.update_one(
        {"_id": to_object_id(product_id)},
        {"$set": {"variants": variant_docs, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    updated = await db.products.find_one({"_id": to_object_id(product_id)})
    return serialize_doc(updated)


@router.post("/products/{product_id}/360-images")
async def update_product_360_images(
    product_id: str,
    images_360: List[str],
    admin: dict = Depends(get_current_admin),
):
    """Save sequential image frame URLs for 360° product spinner."""
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.products.update_one(
        {"_id": to_object_id(product_id)},
        {"$set": {"images_360": images_360, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    updated = await db.products.find_one({"_id": to_object_id(product_id)})
    return serialize_doc(updated)


@router.patch("/products/{product_id}/status")
async def toggle_product_status(
    product_id: str,
    status: str = Query(..., pattern="^(published|draft|archived)$"),
    admin: dict = Depends(get_current_admin),
):
    """Quickly toggle product status (published, draft, archived)."""
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.products.update_one(
        {"_id": to_object_id(product_id)},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"message": f"Product status updated to '{status}'", "product_id": product_id}
