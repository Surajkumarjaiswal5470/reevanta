import os
import logging
import asyncio
import urllib.request

logger = logging.getLogger("reevanta.keep_alive")

PING_INTERVAL_SECONDS = 180  # Ping every 3 minutes (Render free tier sleeps after 15 mins)

# Configurable endpoints to keep warm
TARGET_ENDPOINTS = [
    os.getenv("BACKEND_PING_URL", "https://reevanta-backend-pg3v.onrender.com/api/health/liveness"),
    os.getenv("ADMIN_PING_URL", "https://reevanta-admin.onrender.com"),
    os.getenv("FRONTEND_PING_URL", "https://reevanta.onrender.com"),
]


async def start_render_keep_alive():
    """
    Background 24/7 Heartbeat Service to prevent Render Free Tier from sleeping.
    Pings backend, admin, and frontend health endpoints every 3 minutes.
    """
    logger.info(f"[Render Keep-Alive] Initializing 24/7 multi-service heartbeat pinger every {PING_INTERVAL_SECONDS}s")
    
    # Short initial delay before first ping cycle
    await asyncio.sleep(5)

    while True:
        loop = asyncio.get_event_loop()

        for endpoint in TARGET_ENDPOINTS:
            if not endpoint:
                continue
            try:
                req = urllib.request.Request(
                    endpoint,
                    headers={"User-Agent": "Reevanta-KeepAlive-Heartbeat/2.0"}
                )

                def ping(url_req):
                    with urllib.request.urlopen(url_req, timeout=10) as response:
                        return response.getcode()

                status_code = await loop.run_in_executor(None, ping, req)
                logger.info(f"[Render Keep-Alive] Heartbeat ping -> {endpoint} (Status: {status_code}) 🟢 Active & Warm!")
            except asyncio.CancelledError:
                logger.info("[Render Keep-Alive] Service stopping.")
                return
            except Exception as err:
                logger.warning(f"[Render Keep-Alive Warning] Heartbeat ping failed for {endpoint}: {err}")

        # Wait 3 minutes before next keep-alive round
        await asyncio.sleep(PING_INTERVAL_SECONDS)
