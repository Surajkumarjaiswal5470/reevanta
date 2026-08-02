import hmac
import hashlib
import json
import logging
import urllib.request
from datetime import datetime, timezone
from core.database import db, serialize_doc

logger = logging.getLogger("reevanta.webhooks")

WEBHOOK_SECRET = "rv_whsec_98472910385719284710928471"

def generate_hmac_signature(payload_bytes: bytes, secret: str = WEBHOOK_SECRET) -> str:
    """Generates an HMAC-SHA256 signature for webhook security verification."""
    return hmac.new(secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()

async def dispatch_webhook_event(event_type: str, data: dict):
    """
    Dispatches HMAC-SHA256 signed Webhook to all active subscriber URLs.
    event_type: 'order.created' | 'order.updated' | 'product.low_stock'
    """
    try:
        subscriptions = await db.webhook_subscriptions.find({"event": event_type, "active": True}).to_list(50)
        if not subscriptions:
            return

        payload = {
            "event": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": serialize_doc(data)
        }
        
        payload_json = json.dumps(payload, default=str)
        payload_bytes = payload_json.encode('utf-8')
        signature = generate_hmac_signature(payload_bytes)

        headers = {
            "Content-Type": "application/json",
            "X-Reevanta-Signature": signature,
            "X-Reevanta-Event": event_type,
            "User-Agent": "Reevanta-Webhook-Engine/1.0"
        }

        for sub in subscriptions:
            target_url = sub.get("target_url")
            try:
                req = urllib.request.Request(target_url, data=payload_bytes, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=5) as resp:
                    logger.info(f"[Webhook Success] Dispatched '{event_type}' to {target_url} (HTTP {resp.getcode()})")
            except Exception as err:
                logger.warning(f"[Webhook Error] Failed dispatch to {target_url}: {err}")

    except Exception as e:
        logger.error(f"[Webhook Service Error] {e}")
