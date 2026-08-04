"""
Spam Filter & Fraud Detection Service
Handles profanity, duplicate detection, velocity limits, and trust scoring.
"""

import re
import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from core.database import db

logger = logging.getLogger("reevanta.spam_filter")

# ──────────────────── Banned Patterns ────────────────────

PROFANITY_PATTERNS = [
    r"\b(?:f+u+c+k+|s+h+i+t+|a+s+s+h+o+l+e|b+i+t+c+h+|d+a+m+n+|c+r+a+p+)\b",
    r"\b(?:bastard|bloody|bollocks|bugger|cunt|dick|piss)\b",
]

SPAM_KEYWORDS = [
    r"\b(?:buy now|click here|free money|earn cash|miracle|limited offer)\b",
    r"\b(?:weight loss|casino|poker|lottery|viagra|cialis)\b",
    r"(?:https?://\S+){3,}",  # 3+ URLs in one review = likely spam
]

_profanity_re = re.compile("|".join(PROFANITY_PATTERNS), re.IGNORECASE)
_spam_re = re.compile("|".join(SPAM_KEYWORDS), re.IGNORECASE)


# ──────────────────── Content Hash ────────────────────

def _content_hash(text: str) -> str:
    """Produce a normalised hash for duplicate detection."""
    normalised = re.sub(r"\s+", " ", text.strip().lower())
    return hashlib.sha256(normalised.encode("utf-8")).hexdigest()


# ──────────────────── Public API ────────────────────

async def check_profanity(text: str) -> bool:
    """Return True if the text contains profanity."""
    return bool(_profanity_re.search(text))


async def check_spam(text: str) -> bool:
    """Return True if the text looks like spam."""
    return bool(_spam_re.search(text))


async def check_duplicate(
    user_id: Optional[str],
    product_id: str,
    text: str,
    client_ip: Optional[str] = None,
) -> bool:
    """Return True if a near-duplicate review was submitted within 24 hours."""
    content_hash = _content_hash(text)
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    query = {
        "product_id": product_id,
        "content_hash": content_hash,
        "created_at": {"$gte": cutoff},
    }

    # Also prevent same user reviewing same product twice
    if user_id:
        user_dup = await db.reviews.find_one({
            "product_id": product_id,
            "user_id": user_id,
            "status": {"$nin": ["soft_deleted", "rejected"]},
        })
        if user_dup:
            return True

    dup = await db.reviews.find_one(query)
    return dup is not None


async def check_velocity(
    user_id: Optional[str],
    client_ip: Optional[str] = None,
    max_reviews: int = 5,
    window_minutes: int = 10,
) -> bool:
    """Return True if the user/IP has exceeded the posting velocity limit."""
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=window_minutes)).isoformat()

    or_conditions = []
    if user_id:
        or_conditions.append({"user_id": user_id})
    if client_ip:
        or_conditions.append({"client_ip": client_ip})

    if not or_conditions:
        return False

    count = await db.reviews.count_documents({
        "$or": or_conditions,
        "created_at": {"$gte": cutoff},
    })

    return count >= max_reviews


async def check_user_banned(user_id: str) -> bool:
    """Return True if the user is banned from posting reviews."""
    ban = await db.review_bans.find_one({"user_id": user_id})
    if not ban:
        return False
    # Check if ban is expired
    if ban.get("expires_at"):
        if datetime.now(timezone.utc).isoformat() > ban["expires_at"]:
            await db.review_bans.delete_one({"user_id": user_id})
            return False
    return True


async def compute_trust_score(
    text: str,
    user_id: Optional[str] = None,
    client_ip: Optional[str] = None,
    product_id: str = "",
) -> dict:
    """
    Evaluate a review and return a trust assessment.

    Returns:
        {
            "status": "approved" | "pending" | "flagged" | "spam",
            "score": float (0-100, higher = more trusted),
            "flags": list of strings describing concerns,
        }
    """
    score = 100.0
    flags = []

    # 1. Profanity check
    if await check_profanity(text):
        score -= 40
        flags.append("profanity_detected")

    # 2. Spam check
    if await check_spam(text):
        score -= 50
        flags.append("spam_keywords_detected")

    # 3. Very short review (under 20 chars)
    if len(text.strip()) < 20:
        score -= 15
        flags.append("very_short_content")

    # 4. Excessive caps
    upper_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if upper_ratio > 0.6 and len(text) > 20:
        score -= 15
        flags.append("excessive_capitals")

    # 5. Duplicate detection
    if await check_duplicate(user_id, product_id, text, client_ip):
        score -= 60
        flags.append("duplicate_content")

    # 6. Velocity check
    if await check_velocity(user_id, client_ip):
        score -= 30
        flags.append("rate_limit_exceeded")

    # 7. User banned
    if user_id and await check_user_banned(user_id):
        score = 0
        flags.append("user_banned")

    # Determine status
    score = max(0.0, min(100.0, score))

    if score >= 70:
        status = "approved"
    elif score >= 40:
        status = "pending"
    elif score >= 20:
        status = "flagged"
    else:
        status = "spam"

    return {
        "status": status,
        "score": round(score, 1),
        "flags": flags,
        "content_hash": _content_hash(text),
    }
