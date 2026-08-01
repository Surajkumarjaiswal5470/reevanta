from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.product import ProductCreate
from services.meilisearch_service import index_product, delete_product_from_index

router = APIRouter(prefix="/products", tags=["Admin - Products"])

@router.post("")
async def create_product(inp: ProductCreate, admin: dict = Depends(get_current_admin)):
    doc = inp.model_dump()
    res = await db.products.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    index_product(doc)
    return doc

@router.patch("/{product_id}")
async def update_product(product_id: str, updates: dict, admin: dict = Depends(get_current_admin)):
    updates.pop("_id", None)
    updates.pop("id", None)
    res = await db.products.update_one({"_id": to_object_id(product_id)}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = await db.products.find_one({"_id": to_object_id(product_id)})
    doc = serialize_doc(updated)
    index_product(doc)
    return doc

@router.delete("/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.products.delete_one({"_id": to_object_id(product_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    delete_product_from_index(product_id)
    return {"message": "Product deleted successfully"}
