import logging
import json
import urllib.request
import urllib.error
from core.config import NEPALOTP_API_KEY

logger = logging.getLogger("reevanta.nepalotp")

SEND_URL = "https://nepalotp.com/api/v1/otp/send"
VERIFY_URL = "https://nepalotp.com/api/v1/otp/verify"

def send_nepalotp_sms(phone: str, reference: str = "reevanta_auth") -> dict:
    """
    Send OTP to a Nepalese phone number via NepalOTP API.
    Returns response dict containing `success`, `otp_id`, `message`, etc.
    """
    if not NEPALOTP_API_KEY:
        logger.warning("NEPALOTP_API_KEY not configured. Falling back to local OTP.")
        return {"success": False, "message": "NepalOTP API key not configured"}

    headers = {
        "Authorization": f"Bearer {NEPALOTP_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "phone": phone,
        "reference": reference
    }

    try:
        req = urllib.request.Request(
            SEND_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            body = res.read().decode("utf-8")
            data = json.loads(body)
            logger.info(f"NepalOTP send response for {phone}: {data}")
            return data
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        logger.error(f"NepalOTP send HTTP error ({e.code}): {error_body}")
        try:
            return json.loads(error_body)
        except Exception:
            return {"success": False, "message": f"HTTP {e.code} error from NepalOTP"}
    except Exception as e:
        logger.error(f"Failed to send SMS via NepalOTP to {phone}: {e}")
        return {"success": False, "message": str(e)}


def verify_nepalotp_sms(otp_id: str, otp_code: str) -> dict:
    """
    Verify OTP via NepalOTP API using otp_id and code.
    Returns response dict containing `success`, `message`, etc.
    """
    if not NEPALOTP_API_KEY:
        return {"success": False, "message": "NepalOTP API key not configured"}

    headers = {
        "Authorization": f"Bearer {NEPALOTP_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "otp_id": otp_id,
        "otp": otp_code
    }

    try:
        req = urllib.request.Request(
            VERIFY_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            body = res.read().decode("utf-8")
            data = json.loads(body)
            logger.info(f"NepalOTP verify response for otp_id {otp_id}: {data}")
            return data
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        logger.error(f"NepalOTP verify HTTP error ({e.code}): {error_body}")
        try:
            return json.loads(error_body)
        except Exception:
            return {"success": False, "message": f"HTTP {e.code} error from NepalOTP"}
    except Exception as e:
        logger.error(f"Failed to verify OTP via NepalOTP for otp_id {otp_id}: {e}")
        return {"success": False, "message": str(e)}
