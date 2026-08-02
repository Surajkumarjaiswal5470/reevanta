from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from datetime import datetime, timezone
from core.database import db, serialize_doc

router = APIRouter(prefix="/audit", tags=["Enterprise Audit Trail"])

class AuditLogCreate(BaseModel):
    actor_id: str
    actor_email: Optional[str] = "admin@reevanta.com"
    action: str  # e.g., 'price_updated', 'voucher_created', 'order_status_changed'
    target_resource: str
    metadata: Optional[Dict[str, Any]] = {}

@router.post("/log")
async def record_audit_log(req: AuditLogCreate, request: Request):
    """Records an Enterprise Security Audit Log entry."""
    try:
        client_ip = request.client.host if request.client else "unknown"
        doc = {
            "actor_id": req.actor_id,
            "actor_email": req.actor_email,
            "action": req.action,
            "target_resource": req.target_resource,
            "metadata": req.metadata or {},
            "client_ip": client_ip,
            "user_agent": request.headers.get("User-Agent", "unknown"),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        res = await db.audit_logs.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return {"message": "Audit log recorded", "log": serialize_doc(doc)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
async def get_audit_logs(limit: int = Query(50)):
    """Fetches recent security audit log entries for Admin Security Console."""
    try:
        docs = await db.audit_logs.find().sort("timestamp", -1).limit(limit).to_list(limit)
        return [serialize_doc(d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
