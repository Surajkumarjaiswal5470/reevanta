import json
import logging
import asyncio
import redis.asyncio as aioredis
from core.config import REDIS_URL

logger = logging.getLogger("reevanta.enterprise_queues")

QUEUES = {
    "otp": "reevanta:otp_queue",
    "image": "reevanta:image_processing_queue",
    "notification": "reevanta:notification_queue",
    "cache_refresh": "reevanta:cache_refresh_queue",
    "analytics": "reevanta:analytics_queue"
}

_redis_conn = None

async def get_redis():
    global _redis_conn
    if _redis_conn is not None:
        return _redis_conn
    try:
        conn = aioredis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2.0)
        await conn.ping()
        _redis_conn = conn
        return conn
    except Exception as e:
        logger.warning(f"Redis Queue Connection error: {e}")
        return None


async def enqueue_job(queue_key: str, job_name: str, payload: dict) -> bool:
    """Enqueues a task into one of the 5 background queues (<5ms)."""
    redis = await get_redis()
    if not redis:
        return False
    try:
        queue_name = QUEUES.get(queue_key, f"reevanta:{queue_key}_queue")
        doc = {
            "name": job_name,
            "data": payload,
            "timestamp": asyncio.get_event_loop().time()
        }
        await redis.rpush(queue_name, json.dumps(doc))
        logger.info(f"[Queue Enqueue] Pushed '{job_name}' to {queue_name}")
        return True
    except Exception as e:
        logger.error(f"Enqueue error on {queue_key}: {e}")
        return False


async def get_queue_stats() -> dict:
    """Returns queue depths and status for Bull Board / Admin Panel Dashboard."""
    redis = await get_redis()
    stats = {}
    if not redis:
        return {"status": "offline", "queues": {}}

    try:
        for key, name in QUEUES.items():
            depth = await redis.llen(name)
            stats[key] = {
                "queue_name": name,
                "pending_jobs": depth,
                "status": "healthy"
            }
        return {"status": "online", "queues": stats}
    except Exception as e:
        logger.error(f"Error reading queue stats: {e}")
        return {"status": "error", "error": str(e)}
