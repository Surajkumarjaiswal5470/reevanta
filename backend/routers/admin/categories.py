from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin

router = APIRouter(prefix="/categories", tags=["Admin - Categories"])

class CategoryCreate(BaseModel):
    name: str = Field(..., examples=["Sarees"])
    slug: str = Field(..., examples=["sarees"])
    description: str | None = ""
    imageUrl: str | None = ""
    featured: bool = False

@router.get("")
async def list_categories():
    """Fetch all product categories."""
    try:
        categories = await db.categories.find({}).sort("name", 1).to_list(100)
    except Exception:
        categories = []
    if not categories:
        # Seed default luxury categories if empty
        default_cats = [
            {"name": "Sarees", "slug": "sarees", "description": "Handcrafted Silk & Organza Sarees", "imageUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c", "featured": True},
            {"name": "Lehengas", "slug": "lehengas", "description": "Designer Bridal & Event Lehengas", "imageUrl": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b", "featured": True},
            {"name": "Kurtas", "slug": "kurtas", "description": "Royal Silk & Velvet Kurtas", "imageUrl": "https://images.unsplash.com/photo-1595777457583-95e059d581b8", "featured": True},
            {"name": "Jewelry", "slug": "jewelry", "description": "Heritage Kundan & Gold Fine Jewelry", "imageUrl": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908", "featured": True},
            {"name": "Cosmetics", "slug": "cosmetics", "description": "Artisanal Velvet Lipsticks & Palettes", "imageUrl": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e", "featured": True},
        ]
        try:
            for cat in default_cats:
                cat["created_at"] = datetime.now(timezone.utc).isoformat()
                res = await db.categories.insert_one(cat)
                cat["id"] = str(res.inserted_id)
                cat.pop("_id", None)
        except Exception:
            pass
        return default_cats
    return [serialize_doc(c) for c in categories]

@router.post("")
async def create_category(inp: CategoryCreate, admin: dict = Depends(get_current_admin)):
    """Create a new category."""
    slug_clean = inp.slug.strip().lower()
    existing = await db.categories.find_one({"slug": slug_clean})
    if existing:
        raise HTTPException(status_code=400, detail=f"Category with slug '{slug_clean}' already exists")

    doc = inp.model_dump()
    doc["slug"] = slug_clean
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.categories.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc

@router.put("/{category_id}")
async def update_category(category_id: str, updates: dict, admin: dict = Depends(get_current_admin)):
    """Update an existing category."""
    updates.pop("_id", None)
    updates.pop("id", None)
    if "slug" in updates:
        updates["slug"] = updates["slug"].strip().lower()
    res = await db.categories.update_one({"_id": to_object_id(category_id)}, {"$set": updates})
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
