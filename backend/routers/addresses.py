from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_user
from models.address import AddressCreate

router = APIRouter(prefix="/addresses", tags=["Addresses"])

@router.get("")
async def get_addresses(user: dict = Depends(get_current_user)):
    addrs = await db.addresses.find({"user_id": user["id"]}).to_list(50)
    return [serialize_doc(a) for a in addrs]

@router.post("")
async def create_address(inp: AddressCreate, user: dict = Depends(get_current_user)):
    doc = inp.model_dump()
    doc["user_id"] = user["id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    if doc.get("isDefault"):
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"isDefault": False}})
    else:
        existing_count = await db.addresses.count_documents({"user_id": user["id"]})
        if existing_count == 0:
            doc["isDefault"] = True
    res = await db.addresses.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc

@router.delete("/{address_id}")
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    res = await db.addresses.delete_one({"_id": to_object_id(address_id), "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted"}

@router.patch("/{address_id}/default")
async def set_default_address(address_id: str, user: dict = Depends(get_current_user)):
    obj_id = to_object_id(address_id)
    owned = await db.addresses.find_one({"_id": obj_id, "user_id": user["id"]})
    if not owned:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"isDefault": False}})
    await db.addresses.update_one({"_id": obj_id, "user_id": user["id"]}, {"$set": {"isDefault": True}})
    return {"message": "Default address updated"}
