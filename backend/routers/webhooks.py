from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from core.database import db, serialize_doc
from services.webhook_service import dispatch_webhook_event

router = APIRouter(prefix="/webhooks", tags=["Enterprise Webhooks"])

class WebhookSubscriptionRequest(BaseModel):
    name: str
    target_url: str
    event: str  # 'order.created' | 'order.updated' | 'product.low_stock'

class TestWebhookDispatch(BaseModel):
    event: str
    payload: Optional[Dict[str, Any]] = {}

@router.post("/subscribe")
async def subscribe_webhook(req: WebhookSubscriptionRequest):
    """Registers a third-party Webhook endpoint."""
    try:
        doc = {
            "name": req.name,
            "target_url": req.target_url,
            "event": req.event,
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        res = await db.webhook_subscriptions.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return {"message": "Webhook subscribed successfully", "subscription": serialize_doc(doc)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def list_webhooks():
    """Lists registered webhook subscriptions."""
    try:
        docs = await db.webhook_subscriptions.find().to_list(50)
        return [serialize_doc(d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-dispatch")
async def trigger_test_webhook(req: TestWebhookDispatch):
    """Dispatches a test HMAC-SHA256 signed webhook event."""
    await dispatch_webhook_event(req.event, req.payload or {"test": True, "source": "Admin Console"})
    return {"message": f"Webhook event '{req.event}' dispatched successfully", "success": True}
