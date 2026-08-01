import logging
import urllib.parse
import urllib.request
import base64
import json
from core.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_MAIN_ACCOUNT_SID

logger = logging.getLogger("reevanta.sms")

def send_twilio_sms(to_phone: str, message_body: str) -> bool:
    """
    Send an SMS message via Twilio REST API v2010-04-01.
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
        with urllib.request.urlopen(req) as res:
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

