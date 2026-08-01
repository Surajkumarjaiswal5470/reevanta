from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin

router = APIRouter(prefix="/users", tags=["Admin - Users"])

@router.get("")
async def list_users_admin(admin: dict = Depends(get_current_admin)):
    users = await db.users.find({}).sort("created_at", -1).to_list(200)
    out = []
    for u in users:
        s = serialize_doc(u)
        s.pop("password_hash", None)
        out.append(s)
    return out

@router.patch("/{user_id}")
async def update_user_admin(user_id: str, updates: dict, admin: dict = Depends(get_current_admin)):
    """Update user role or active status."""
    updates.pop("_id", None)
    updates.pop("id", None)
    updates.pop("password_hash", None)
    res = await db.users.update_one({"_id": to_object_id(user_id)}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    updated = await db.users.find_one({"_id": to_object_id(user_id)})
    s = serialize_doc(updated)
    s.pop("password_hash", None)
    return s

@router.delete("/{user_id}")
async def delete_user_admin(user_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a user account."""
    res = await db.users.delete_one({"_id": to_object_id(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User account deleted successfully"}
