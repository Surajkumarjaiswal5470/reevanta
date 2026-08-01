import logging
import urllib.parse
import urllib.request
import base64
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from core.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_MAIN_ACCOUNT_SID

logger = logging.getLogger("reevanta.sms")

# Thread pool for non-blocking SMS — doesn't block the event loop
_sms_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="sms")

def _send_twilio_sms_sync(to_phone: str, message_body: str) -> bool:
    """
    Send an SMS message via Twilio REST API v2010-04-01 (blocking).
    Returns True if sent successfully, False otherwise.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        logger.info(f"[DEV MODE - Twilio credentials or Phone Number not set] Would send SMS to {to_phone}: '{message_body}'")
        return False

    account_sid_for_url = TWILIO_MAIN_ACCOUNT_SID if TWILIO_MAIN_ACCOUNT_SID else TWILIO_ACCOUNT_SID
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid_for_url}/Messages.json"
    
    data = urllib.parse.urlencode({
        "To": to_phone,
        "From": TWILIO_PHONE_NUMBER,
        "Body": message_body
    }).encode("utf-8")


    # Basic Auth header: base64(ACCOUNT_SID:AUTH_TOKEN)
    credentials = f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}"
    encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    try:
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as res:
            resp_body = res.read().decode("utf-8")
            resp_json = json.loads(resp_body)
            logger.info(f"Twilio SMS sent to {to_phone}. SID: {resp_json.get('sid')}")
            return True
    except Exception as e:
        error_msg = str(e)
        if hasattr(e, "read"):
            try:
                err_json = json.loads(e.read().decode("utf-8"))
                error_msg = f"{err_json.get('message')} (Code: {err_json.get('code')})"
            except Exception:
                pass
        logger.error(f"Failed to send Twilio SMS to {to_phone}: {error_msg}")
        return False


# Backward-compatible sync API
def send_twilio_sms(to_phone: str, message_body: str) -> bool:
    """Synchronous SMS send — use send_twilio_sms_async for non-blocking."""
    return _send_twilio_sms_sync(to_phone, message_body)


async def send_twilio_sms_async(to_phone: str, message_body: str) -> bool:
    """Non-blocking async SMS send — offloads to thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_sms_executor, _send_twilio_sms_sync, to_phone, message_body)


def send_twilio_sms_fire_and_forget(to_phone: str, message_body: str) -> None:
    """Fire-and-forget SMS — returns immediately, SMS sent in background thread."""
    _sms_executor.submit(_send_twilio_sms_sync, to_phone, message_body)
