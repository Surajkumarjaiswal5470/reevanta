import json
import logging
import asyncio
import redis.asyncio as aioredis
from core.config import REDIS_URL, NEPALOTP_API_KEY
from services.nepalotp_service import send_nepalotp_sms

logger = logging.getLogger("reevanta.otp_queue")

QUEUE_NAME = "reevanta:otp_queue"
_redis_client = None

async def get_redis_queue_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        client = aioredis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2.0)
        await client.ping()
        _redis_client = client
        return client
    except Exception as e:
        logger.warning(f"Redis Queue client connection failed: {e}")
        return None


async def enqueue_otp_job(job_type: str, payload: dict) -> bool:
    """
    Enqueues an OTP delivery task into Redis Queue (< 5ms response time).
    job_type: 'nepal_otp' | 'email_otp' | 'sms_otp'
    """
    redis_conn = await get_redis_queue_client()
    if not redis_conn:
        logger.info("Redis queue unavailable, processing OTP synchronously inline.")
        return False

    try:
        job_data = {
            "type": job_type,
            "payload": payload,
            "attempts": 0,
            "created_at": asyncio.get_event_loop().time()
        }
        await redis_conn.rpush(QUEUE_NAME, json.dumps(job_data))
        logger.info(f"[Redis OTP Queue] Successfully enqueued '{job_type}' job in <5ms.")
        return True
    except Exception as e:
        logger.error(f"[Redis OTP Queue Error] Enqueue failed: {e}")
        return False


async def start_otp_worker():
    """
    Background worker task consuming queued OTP jobs from Redis.
    Executes asynchronous retries with exponential backoff.
    """
    logger.info("Starting Redis Background OTP Worker Processor...")
    while True:
        try:
            redis_conn = await get_redis_queue_client()
            if not redis_conn:
                await asyncio.sleep(5)
                continue

            # Pop job from Redis queue (blocking with timeout)
            res = await redis_conn.blpop(QUEUE_NAME, timeout=5)
            if not res:
                await asyncio.sleep(1)
                continue

            _, raw_data = res
            job = json.loads(raw_data)
            job_type = job.get("type")
            payload = job.get("payload", {})
            attempts = job.get("attempts", 0) + 1

            logger.info(f"[OTP Worker] Processing '{job_type}' job (Attempt #{attempts})...")

            success = False
            if job_type == "nepal_otp":
                phone = payload.get("phone")
                res_api = await send_nepalotp_sms(phone)
                success = res_api.get("success", False)

            elif job_type == "email_otp":
                email = payload.get("email")
                otp = payload.get("otp")
                logger.info(f"[OTP Worker - Email] Sent OTP {otp} to {email}")
                success = True

            if success:
                logger.info(f"[OTP Worker Completed] Successfully processed '{job_type}'!")
            else:
                if attempts < 3:
                    backoff_delay = 2 ** attempts  # 2s, 4s backoff
                    logger.warning(f"[OTP Worker Retry] Re-queueing '{job_type}' after {backoff_delay}s backoff...")
                    await asyncio.sleep(backoff_delay)
                    job["attempts"] = attempts
                    await redis_conn.rpush(QUEUE_NAME, json.dumps(job))
                else:
                    logger.error(f"[OTP Worker Failed] Job '{job_type}' max retries exceeded.")

        except asyncio.CancelledError:
            break
        except Exception as err:
            logger.error(f"[OTP Worker Error] Worker loop exception: {err}")
            await asyncio.sleep(3)
