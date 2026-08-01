import os
import sys
import time
import platform
from datetime import datetime, timezone
from fastapi import APIRouter, Response
from core.database import client, db
from core.cache import get_redis_client, _redis_available
from services.meilisearch_service import is_meilisearch_available

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])

START_TIME = time.time()

@router.get("")
async def get_health_status(response: Response):
    """
    Enterprise Deep Health & System Diagnostics Endpoint.
    Returns status of MongoDB, Redis, Meilisearch, Uptime, & Environment.
    """
    health_status = "healthy"
    services = {}

    # 1. MongoDB Health & Latency
    mongo_start = time.time()
    try:
        await client.admin.command('ping')
        mongo_latency_ms = round((time.time() - mongo_start) * 1000, 2)
        services["mongodb"] = {
            "status": "up",
            "latency_ms": mongo_latency_ms,
            "database": db.name
        }
    except Exception as e:
        health_status = "degraded"
        services["mongodb"] = {
            "status": "down",
            "error": str(e)
        }

    # 2. Redis Cache Health
    try:
        redis_client = await get_redis_client()
        if redis_client:
            redis_start = time.time()
            await redis_client.ping()
            redis_latency_ms = round((time.time() - redis_start) * 1000, 2)
            services["redis"] = {
                "status": "up",
                "mode": "redis",
                "latency_ms": redis_latency_ms
            }
        else:
            services["redis"] = {
                "status": "up",
                "mode": "in-memory-fallback",
                "note": "Using high-speed in-memory TTL store"
            }
    except Exception as e:
        services["redis"] = {
            "status": "degraded",
            "mode": "in-memory-fallback",
            "error": str(e)
        }

    # 3. Meilisearch Engine
    meili_available = is_meilisearch_available()
    services["meilisearch"] = {
        "status": "up" if meili_available else "fallback_mongo",
        "mode": "meilisearch" if meili_available else "mongodb_text_index"
    }

    # If database is down, mark 503
    if services["mongodb"]["status"] == "down":
        response.status_code = 503
        health_status = "unhealthy"

    uptime_seconds = int(time.time() - START_TIME)

    return {
        "status": health_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "version": "1.0.0",
        "system": {
            "python": platform.python_version(),
            "platform": platform.platform(),
        },
        "services": services
    }

@router.get("/liveness")
async def liveness_probe():
    """K8s / Container Liveness Probe."""
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}

@router.get("/readiness")
async def readiness_probe(response: Response):
    """K8s / Container Readiness Probe."""
    db_connected = True
    try:
        await client.admin.command('ping')
    except Exception:
        db_connected = False

    return {
        "status": "ready" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
