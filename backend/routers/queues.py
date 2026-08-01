from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from services.enterprise_queues import get_queue_stats, enqueue_job

router = APIRouter(prefix="/queues", tags=["BullMQ Queue Manager"])

class EnqueueRequest(BaseModel):
    queue_name: str  # 'otp' | 'image' | 'notification' | 'cache_refresh' | 'analytics'
    job_name: str
    payload: Dict[str, Any] = {}

@router.get("/stats")
async def fetch_queue_stats():
    """Returns real-time background queue metrics for Bull Board & Admin Panel Dashboard."""
    return await get_queue_stats()

@router.post("/enqueue")
async def trigger_enqueue_job(req: EnqueueRequest):
    """Enqueues a test job into any of the 5 BullMQ queues."""
    success = await enqueue_job(req.queue_name, req.job_name, req.payload)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to enqueue job into Redis queue")
    return {"message": f"Job '{req.job_name}' enqueued successfully in queue '{req.queue_name}'", "success": True}
