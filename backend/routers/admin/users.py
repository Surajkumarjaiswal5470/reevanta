from fastapi import APIRouter, Depends
from core.database import db, serialize_doc
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
