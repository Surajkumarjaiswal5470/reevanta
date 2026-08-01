import logging
import json
import urllib.request
from core.config import BREVO_API_KEY, SENDER_EMAIL, SENDER_NAME

logger = logging.getLogger(__name__)

def send_email_brevo(recipient_email: str, subject: str, html_content: str) -> bool:
    """Send transactional emails via Brevo API v3."""
    if not BREVO_API_KEY:
        logger.info(f"[DEV MODE - Brevo API Key Not Set] Would send email to {recipient_email}: {subject}")
        return False
        
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": recipient_email}],
        "subject": subject,
        "htmlContent": html_content
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req) as res:
            logger.info(f"Brevo email sent to {recipient_email}. Status: {res.status}")
            return True
    except Exception as e:
        logger.error(f"Failed to send email via Brevo: {e}")
        return False
