import os
import logging
import asyncio
import urllib.request

logger = logging.getLogger("reevanta.keep_alive")

RENDER_URL = os.getenv("RENDER_URL", "https://reevanta-backend-pg3v.onrender.com")
HEALTH_ENDPOINT = f"{RENDER_URL.rstrip('/')}/api/health"
PING_INTERVAL_SECONDS = 720  # Ping every 12 minutes (Render sleeps after 15 mins)

async def start_render_keep_alive():
    """
    Background 24/7 Heartbeat Service to prevent Render Free Tier from sleeping.
    Pings the health check endpoint every 12 minutes.
    """
    logger.info(f"[Render Keep-Alive] Initializing 24/7 heartbeat pinger -> {HEALTH_ENDPOINT}")
    
    # Initial delay before first ping
    await asyncio.sleep(10)

    while True:
        try:
            # Execute HTTP ping request off the main thread
            loop = asyncio.get_event_loop()
            req = urllib.request.Request(
                HEALTH_ENDPOINT,
                headers={"User-Agent": "Reevanta-KeepAlive-Heartbeat/1.0"}
            )
            
            def ping():
                with urllib.request.urlopen(req, timeout=10) as response:
                    return response.getcode()

            status_code = await loop.run_in_executor(None, ping)
            logger.info(f"[Render Keep-Alive Ping] Heartbeat ping successful (Status: {status_code}) 🟢 Server remains 100% warm!")

        except asyncio.CancelledError:
            logger.info("[Render Keep-Alive] Service stopping.")
            break
        except Exception as err:
            logger.warning(f"[Render Keep-Alive Ping Warning] Heartbeat ping failed: {err}")

        # Wait 12 minutes before next ping
        await asyncio.sleep(PING_INTERVAL_SECONDS)
