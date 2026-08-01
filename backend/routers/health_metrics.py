import time
import os
try:
    import psutil
except ImportError:
    psutil = None

from fastapi import APIRouter, Response, status
from datetime import datetime, timezone
from core.database import db
from services.enterprise_queues import get_queue_stats, get_redis

router = APIRouter(tags=["Health & Monitoring Metrics"])

START_TIME = time.time()

@router.get("/health")
@router.get("/api/health")
async def health_check(response: Response):
    """
    Deep Health Diagnostic Endpoint inspecting:
    - MongoDB Atlas Connection & Ping Latency
    - Redis Cloud Connection & Ping Latency
    - Process Memory Usage
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "checks": {}
    }
    
    all_healthy = True

    # 1. MongoDB Health Ping
    try:
        mongo_start = time.time()
        await db.command("ping")
        mongo_latency = round((time.time() - mongo_start) * 1000, 2)
        health_status["checks"]["mongodb"] = {
            "status": "up",
            "latency_ms": mongo_latency
        }
    except Exception as e:
        health_status["checks"]["mongodb"] = {"status": "down", "error": str(e)}
        all_healthy = False

    # 2. Redis Cloud Health Ping
    try:
        redis_conn = await get_redis()
        if redis_conn:
            redis_start = time.time()
            await redis_conn.ping()
            redis_latency = round((time.time() - redis_start) * 1000, 2)
            health_status["checks"]["redis"] = {
                "status": "up",
                "latency_ms": redis_latency
            }
        else:
            health_status["checks"]["redis"] = {"status": "down", "error": "Redis disconnected"}
            all_healthy = False
    except Exception as e:
        health_status["checks"]["redis"] = {"status": "down", "error": str(e)}
        all_healthy = False

    # 3. Memory Diagnostics
    try:
        process = psutil.Process(os.getpid())
        mem_info = process.memory_info()
        health_status["checks"]["memory"] = {
            "rss_mb": round(mem_info.rss / 1024 / 1024, 2),
            "vsz_mb": round(mem_info.vsz / 1024 / 1024, 2)
        }
    except Exception:
        pass

    if not all_healthy:
        health_status["status"] = "unhealthy"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return health_status


@router.get("/api/metrics")
async def get_metrics():
    """
    Exposes System Performance & Queue Metrics:
    - Queue depths across all 5 BullMQ queues
    - Collection counts in MongoDB Atlas
    - Memory & Uptime stats
    """
    queue_stats = await get_queue_stats()
    
    # Collection counts
    user_count = await db.users.count_documents({})
    product_count = await db.products.count_documents({})
    order_count = await db.orders.count_documents({})
    chat_count = await db.chat_messages.count_documents({})

    process = psutil.Process(os.getpid())
    mem = process.memory_info()

    return {
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "memory": {
            "rss_bytes": mem.rss,
            "rss_mb": round(mem.rss / 1024 / 1024, 2)
        },
        "database": {
            "users": user_count,
            "products": product_count,
            "orders": order_count,
            "chat_messages": chat_count
        },
        "queues": queue_stats
    }
