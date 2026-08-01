from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.voucher import VoucherCreate

router = APIRouter(prefix="/vouchers", tags=["Admin - Vouchers"])

@router.get("")
async def list_vouchers_admin(admin: dict = Depends(get_current_admin)):
    vouchers = await db.vouchers.find({}).sort("created_at", -1).to_list(100)
    return [serialize_doc(v) for v in vouchers]

@router.post("")
async def create_voucher_admin(inp: VoucherCreate, admin: dict = Depends(get_current_admin)):
    code_clean = inp.code.strip().upper()
    existing = await db.vouchers.find_one({"code": code_clean})
    if existing:
        raise HTTPException(status_code=400, detail=f"Voucher code '{code_clean}' already exists")

    doc = inp.model_dump()
    doc["code"] = code_clean
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.vouchers.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc

@router.patch("/{voucher_id}")
async def update_voucher_admin(voucher_id: str, updates: dict, admin: dict = Depends(get_current_admin)):
    updates.pop("_id", None)
    updates.pop("id", None)
    if "code" in updates:
        updates["code"] = updates["code"].strip().upper()
    res = await db.vouchers.update_one({"_id": to_object_id(voucher_id)}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    updated = await db.vouchers.find_one({"_id": to_object_id(voucher_id)})
    return serialize_doc(updated)

@router.delete("/{voucher_id}")
async def delete_voucher_admin(voucher_id: str, admin: dict = Depends(get_current_admin)):
    res = await db.vouchers.delete_one({"_id": to_object_id(voucher_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Voucher not found")
    return {"message": "Voucher deleted successfully"}
