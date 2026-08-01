"""
Enterprise Redis Cache with Memory Fallback & CDN Headers
──────────────────────────────────────────────────────────
Provides high-performance response caching for product catalog,
search queries, and review breakdowns.

- Tries Redis connection if REDIS_URL is configured
- Automatically falls back to high-speed In-Memory TTL store if Redis is unavailable
- Supports pattern-based cache invalidation when catalog/reviews change
- Generates CDN Cache-Control headers for max edge performance
"""

import json
import time
import logging
import asyncio
from typing import Any, Optional, Dict
from functools import wraps
from fastapi import Request, Response
from core.config import REDIS_URL

logger = logging.getLogger("reevanta.cache")

# ─── In-Memory Fallback Cache ────────────────────────────────────────────────
class InMemoryTTLCache:
    def __init__(self, max_items: int = 1000):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._max_items = max_items

    def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if not item:
            return None
        if time.time() > item["expires_at"]:
            del self._store[key]
            return None
        return item["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        if len(self._store) >= self._max_items:
            # Purge expired or oldest items
            now = time.time()
            expired = [k for k, v in self._store.items() if now > v["expires_at"]]
            for k in expired:
                del self._store[k]
            if len(self._store) >= self._max_items:
                # Remove first key
                first_key = next(iter(self._store))
                del self._store[first_key]

        self._store[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds
        }

    def invalidate_pattern(self, pattern: str):
        prefix = pattern.rstrip("*")
        keys_to_delete = [k for k in self._store if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._store[k]

    def clear(self):
        self._store.clear()

memory_cache = InMemoryTTLCache()

# ─── Redis Client Connection Manager ─────────────────────────────────────────
_redis_client = None
_redis_available = False

async def get_redis_client():
    global _redis_client, _redis_available
    if _redis_client is not None:
        return _redis_client if _redis_available else None

    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2.0)
        await client.ping()
        _redis_client = client
        _redis_available = True
        logger.info(f"Connected to Redis at {REDIS_URL}")
        return client
    except Exception as e:
        logger.info(f"Redis unavailable ({e}), using in-memory TTL cache fallback")
        _redis_available = False
        _redis_client = False
        return None

# ─── Cache Operations API ────────────────────────────────────────────────────
async def cache_get(key: str) -> Optional[Any]:
    redis = await get_redis_client()
    if redis:
        try:
            val = await redis.get(key)
            if val:
                return json.loads(val)
        except Exception:
            pass
    return memory_cache.get(key)

async def cache_set(key: str, value: Any, ttl_seconds: int = 300):
    redis = await get_redis_client()
    if redis:
        try:
            await redis.setex(key, ttl_seconds, json.dumps(value))
            return
        except Exception:
            pass
    memory_cache.set(key, value, ttl_seconds)

async def cache_delete(key: str):
    redis = await get_redis_client()
    if redis:
        try:
            await redis.delete(key)
        except Exception:
            pass
    memory_cache.invalidate_pattern(key)

async def cache_invalidate_pattern(pattern: str):
    redis = await get_redis_client()
    if redis:
        try:
            keys = await redis.keys(pattern)
            if keys:
                await redis.delete(*keys)
        except Exception:
            pass
    memory_cache.invalidate_pattern(pattern)

# ─── Response Cache Decorator & CDN Headers ──────────────────────────────────
def cache_response(ttl: int = 300, cdn_max_age: int = 3600):
    """
    Decorator for FastAPI routes to cache JSON responses.
    Sets Redis/Memory cache + CDN Cache-Control headers.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request object if present
            request: Optional[Request] = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            # If no request or method isn't GET, skip cache
            if not request or request.method != "GET":
                return await func(*args, **kwargs)

            # Generate unique cache key from query params & path
            cache_key = f"api_cache:{request.url.path}:{request.url.query}"
            cached_data = await cache_get(cache_key)

            if cached_data is not None:
                response = Response(
                    content=json.dumps(cached_data),
                    media_type="application/json",
                    headers={
                        "X-Cache-Status": "HIT",
                        "Cache-Control": f"public, max-age={ttl}, s-maxage={cdn_max_age}, stale-while-revalidate=86400"
                    }
                )
                return response

            # Execute handler
            result = await func(*args, **kwargs)

            # Cache the result
            if isinstance(result, (dict, list)):
                await cache_set(cache_key, result, ttl_seconds=ttl)

            # Return with CDN headers
            return Response(
                content=json.dumps(result),
                media_type="application/json",
                headers={
                    "X-Cache-Status": "MISS",
                    "Cache-Control": f"public, max-age={ttl}, s-maxage={cdn_max_age}, stale-while-revalidate=86400"
                }
            )
        return wrapper
    return decorator
