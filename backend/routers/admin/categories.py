"""
Admin Categories & Subcategories Router
Provides CRUD operations for categories, subcategories, collection mappings, banners, icons, SEO, and sort order.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin

router = APIRouter(prefix="/categories", tags=["Admin - Categories"])
public_router = APIRouter(prefix="/categories", tags=["Categories"])


# ──────────────────── Public Endpoint ────────────────────

@public_router.get("")
async def list_public_categories():
    """Public endpoint to fetch all categories sorted by sort_order for storefront."""
    return await list_categories()


# ──────────────────── Pydantic Models ────────────────────

class CategorySEO(BaseModel):
    metaTitle: Optional[str] = Field(None, max_length=120)
    metaDescription: Optional[str] = Field(None, max_length=300)
    metaKeywords: List[str] = Field(default_factory=list)
    canonicalUrl: Optional[str] = None


class SubCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Silk Sarees"])
    slug: Optional[str] = Field(None, examples=["silk-sarees"])
    description: Optional[str] = ""
    imageUrl: Optional[str] = ""
    bannerUrl: Optional[str] = ""
    iconUrl: Optional[str] = ""
    display_order: Optional[int] = 0
    seo: Optional[CategorySEO] = Field(default_factory=CategorySEO)


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Sarees"])
    slug: Optional[str] = Field(None, examples=["sarees"])
    description: Optional[str] = ""
    imageUrl: Optional[str] = ""
    bannerUrl: Optional[str] = ""
    iconName: Optional[str] = "Sparkles"
    iconUrl: Optional[str] = ""
    featured: bool = False
    sort_order: int = Field(1, ge=0)
    collections: List[str] = Field(default_factory=list)
    subcategories: List[SubCategoryCreate] = Field(default_factory=list)
    seo: Optional[CategorySEO] = Field(default_factory=CategorySEO)


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    iconName: Optional[str] = None
    iconUrl: Optional[str] = None
    featured: Optional[bool] = None
    sort_order: Optional[int] = None
    collections: Optional[List[str]] = None
    subcategories: Optional[List[SubCategoryCreate]] = None
    seo: Optional[CategorySEO] = None


class CategoryReorderItem(BaseModel):
    id: str
    sort_order: int


# ──────────────────── Default Pre-seeded Categories ────────────────────

DEFAULT_LUXURY_CATEGORIES = [
    {
        "name": "Sarees",
        "slug": "sarees",
        "description": "Handcrafted Silk & Organza Sarees",
        "imageUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800",
        "bannerUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600",
        "iconName": "Sparkles",
        "featured": True,
        "sort_order": 1,
        "collections": ["summer-silk-2026", "new-arrivals"],
        "seo": {
            "metaTitle": "Handcrafted Luxury Silk & Organza Sarees | RIVAANTA",
            "metaDescription": "Explore pure Kanjivaram and Banarasi silk sarees. Express Kathmandu delivery."
        },
        "subcategories": [
            {"name": "Silk Sarees", "slug": "silk-sarees", "description": "Pure Kanjivaram & Banarasi Silk", "imageUrl": ""},
            {"name": "Organza Sarees", "slug": "organza-sarees", "description": "Lightweight Sheer Organza", "imageUrl": ""},
            {"name": "Chiffon & Georgette", "slug": "chiffon-georgette", "description": "Flowy Festive Sarees", "imageUrl": ""}
        ]
    },
    {
        "name": "Lehengas",
        "slug": "lehengas",
        "description": "Designer Bridal & Event Lehengas",
        "imageUrl": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800",
        "bannerUrl": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600",
        "iconName": "Crown",
        "featured": True,
        "sort_order": 2,
        "collections": ["festive-bridal"],
        "seo": {
            "metaTitle": "Designer Bridal & Partywear Lehengas | RIVAANTA",
            "metaDescription": "Royal Zardozi embroidered wedding lehengas and choli sets."
        },
        "subcategories": [
            {"name": "Bridal Lehengas", "slug": "bridal-lehengas", "description": "Heavy Zardozi Bridal Sets", "imageUrl": ""},
            {"name": "Partywear Lehengas", "slug": "partywear-lehengas", "description": "Modern Crop Top Sets", "imageUrl": ""}
        ]
    },
    {
        "name": "Kurtas",
        "slug": "kurtas",
        "description": "Royal Silk & Velvet Kurtas",
        "imageUrl": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800",
        "bannerUrl": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1600",
        "iconName": "Shirt",
        "featured": True,
        "sort_order": 3,
        "collections": ["velvet-winter-royale"],
        "subcategories": [
            {"name": "Kurta Sets", "slug": "kurta-sets", "description": "Kurta with Dupatta & Pants", "imageUrl": ""},
            {"name": "Anarkalis", "slug": "anarkalis", "description": "Floor Length Anarkalis", "imageUrl": ""}
        ]
    },
    {
        "name": "Jewelry",
        "slug": "jewelry",
        "description": "Heritage Kundan & Gold Fine Jewelry",
        "imageUrl": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800",
        "bannerUrl": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600",
        "iconName": "Gem",
        "featured": True,
        "sort_order": 4,
        "collections": ["festive-bridal"],
        "subcategories": [
            {"name": "Necklaces", "slug": "necklaces", "description": "Royal Chokers & Rani Haars", "imageUrl": ""},
            {"name": "Earrings", "slug": "earrings", "description": "Jhumkas & Chandbalis", "imageUrl": ""}
        ]
    },
    {
        "name": "Cosmetics",
        "slug": "cosmetics",
        "description": "Artisanal Velvet Lipsticks & Palettes",
        "imageUrl": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800",
        "bannerUrl": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600",
        "iconName": "Palette",
        "featured": True,
        "sort_order": 5,
        "collections": ["new-arrivals"],
        "subcategories": [
            {"name": "Lipsticks", "slug": "lipsticks", "description": "Matte & Satin Lip Colors", "imageUrl": ""},
            {"name": "Palettes", "slug": "palettes", "description": "Eyeshadow & Blush Sets", "imageUrl": ""}
        ]
    }
]


# ──────────────────── API Endpoints ────────────────────

@router.get("")
async def list_categories():
    """Fetch all categories sorted by sort_order ascending."""
    try:
        categories = await db.categories.find({}).sort("sort_order", 1).to_list(200)
    except Exception:
        categories = []

    if not categories:
        seeded = []
        try:
            for cat in DEFAULT_LUXURY_CATEGORIES:
                c_copy = dict(cat)
                c_copy["created_at"] = datetime.now(timezone.utc).isoformat()
                res = await db.categories.insert_one(c_copy)
                c_copy["id"] = str(res.inserted_id)
                c_copy.pop("_id", None)
                seeded.append(c_copy)
            return seeded
        except Exception:
            return DEFAULT_LUXURY_CATEGORIES

    return [serialize_doc(c) for c in categories]


@router.post("")
async def create_category(inp: CategoryCreate, admin: dict = Depends(get_current_admin)):
    """Create a new category with banners, icons, SEO, collections, and sort_order."""
    slug_clean = (inp.slug or inp.name).strip().lower().replace(" ", "-")
    existing = await db.categories.find_one({"slug": slug_clean})
    if existing:
        raise HTTPException(status_code=400, detail=f"Category with slug '{slug_clean}' already exists")

    doc = inp.model_dump()
    doc["slug"] = slug_clean
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    # Clean subcategory slugs
    cleaned_subs = []
    for sub in doc.get("subcategories", []):
        sub_slug = (sub.get("slug") or sub.get("name", "")).strip().lower().replace(" ", "-")
        sub["slug"] = sub_slug
        cleaned_subs.append(sub)
    doc["subcategories"] = cleaned_subs

    res = await db.categories.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/reorder")
async def reorder_categories(items: List[CategoryReorderItem], admin: dict = Depends(get_current_admin)):
    """Bulk update sort_order for categories."""
    for item in items:
        try:
            await db.categories.update_one(
                {"_id": to_object_id(item.id)},
                {"$set": {"sort_order": item.sort_order, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        except Exception:
            pass
    return {"message": "Category sort order updated successfully"}


@router.put("/{category_id}")
async def update_category(category_id: str, updates: CategoryUpdate, admin: dict = Depends(get_current_admin)):
    """Update category details, banners, icons, SEO, and collections."""
    update_dict = updates.model_dump(exclude_unset=True, exclude_none=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No update fields provided")

    if "slug" in update_dict:
        update_dict["slug"] = update_dict["slug"].strip().lower().replace(" ", "-")

    if "subcategories" in update_dict:
        cleaned_subs = []
        for sub in update_dict["subcategories"]:
            sub_slug = (sub.get("slug") or sub.get("name", "")).strip().lower().replace(" ", "-")
            sub["slug"] = sub_slug
            cleaned_subs.append(sub)
        update_dict["subcategories"] = cleaned_subs

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.categories.update_one({"_id": to_object_id(category_id)}, {"$set": update_dict})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")

    updated = await db.categories.find_one({"_id": to_object_id(category_id)})
    return serialize_doc(updated)


@router.delete("/{category_id}")
async def delete_category(category_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a category."""
    res = await db.categories.delete_one({"_id": to_object_id(category_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}


@router.post("/{category_id}/subcategories")
async def add_subcategory(
    category_id: str,
    inp: SubCategoryCreate,
    admin: dict = Depends(get_current_admin),
):
    """Add a new subcategory with optional banner and SEO."""
    category = await db.categories.find_one({"_id": to_object_id(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    sub_slug = (inp.slug or inp.name).strip().lower().replace(" ", "-")
    existing_subs = category.get("subcategories", [])

    if any(s.get("slug") == sub_slug for s in existing_subs):
        raise HTTPException(status_code=400, detail=f"Subcategory with slug '{sub_slug}' already exists")

    new_sub = inp.model_dump()
    new_sub["slug"] = sub_slug

    await db.categories.update_one(
        {"_id": to_object_id(category_id)},
        {"$push": {"subcategories": new_sub}},
    )

    updated = await db.categories.find_one({"_id": to_object_id(category_id)})
    return serialize_doc(updated)


@router.delete("/{category_id}/subcategories/{sub_slug}")
async def delete_subcategory(
    category_id: str,
    sub_slug: str,
    admin: dict = Depends(get_current_admin),
):
    """Remove a subcategory from a parent category."""
    category = await db.categories.find_one({"_id": to_object_id(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    await db.categories.update_one(
        {"_id": to_object_id(category_id)},
        {"$pull": {"subcategories": {"slug": sub_slug.lower()}}},
    )

    updated = await db.categories.find_one({"_id": to_object_id(category_id)})
    return serialize_doc(updated)
