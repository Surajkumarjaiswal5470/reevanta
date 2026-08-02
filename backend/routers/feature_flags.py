from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from core.database import db

router = APIRouter(prefix="/feature-flags", tags=["Enterprise Feature Flags"])

DEFAULT_FLAGS = {
    "enable_flash_sales": True,
    "enable_cod_payments": True,
    "enable_nepalotp_sms": True,
    "enable_recommendation_engine": True,
    "maintenance_mode": False
}

class FlagToggleRequest(BaseModel):
    flag_key: str
    enabled: bool

@router.get("")
async def get_feature_flags():
    """Returns active enterprise feature flags."""
    try:
        doc = await db.feature_flags.find_one({"_id": "global_flags"})
        if not doc:
            await db.feature_flags.insert_one({"_id": "global_flags", "flags": DEFAULT_FLAGS})
            return DEFAULT_FLAGS
        return doc.get("flags", DEFAULT_FLAGS)
    except Exception:
        return DEFAULT_FLAGS

@router.post("/toggle")
async def toggle_feature_flag(req: FlagToggleRequest):
    """Toggles a dynamic feature flag remotely without code redeploys."""
    try:
        doc = await db.feature_flags.find_one({"_id": "global_flags"})
        flags = doc.get("flags", DEFAULT_FLAGS) if doc else DEFAULT_FLAGS
        
        flags[req.flag_key] = req.enabled

        await db.feature_flags.update_one(
            {"_id": "global_flags"},
            {"$set": {"flags": flags, "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )

        return {"message": f"Feature flag '{req.flag_key}' set to {req.enabled}", "flags": flags}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
