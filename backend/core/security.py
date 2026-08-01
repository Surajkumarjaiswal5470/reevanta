import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import Request, HTTPException, Depends, Response
from bson import ObjectId
from core.config import JWT_SECRET, JWT_ALGORITHM
from core.database import db

def hash_password(password: str) -> str:
    """Hash a plain‑text password using bcrypt.

    The original code exposed this as ``hash_password``. Some tests expect a
    function named ``get_password_hash``. We keep the original implementation
    and provide ``get_password_hash`` as an alias for compatibility.
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

# Compatibility alias expected by the test suite
def get_password_hash(password: str) -> str:
    return hash_password(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# Alias for backward compatibility (some code may import this name)
def check_password_hash(plain_password: str, hashed_password: str) -> bool:
    return verify_password(plain_password, hashed_password)

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=1),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Validate a JWT and return its payload.

    The test suite expects a ``verify_token`` function that raises an
    ``HTTPException`` with status 401 for any invalid or expired token. This
    mirrors the behaviour of ``get_current_user`` but operates on a raw token
    string rather than extracting it from a request.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookies(response: Response, user_id: str, email_or_phone: str):
    access_token = create_access_token(user_id, email_or_phone)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

def format_phone(phone_str: str) -> str:
    cleaned = "".join(c for c in phone_str if c.isdigit())
    if phone_str.startswith("+977") or cleaned.startswith("977"):
        digits = cleaned[3:] if cleaned.startswith("977") else cleaned
        return f"+977{digits}"
    elif phone_str.startswith("+91") or cleaned.startswith("91"):
        digits = cleaned[2:] if cleaned.startswith("91") else cleaned
        return f"+91{digits}"
    elif len(cleaned) == 10:
        if cleaned.startswith("98") or cleaned.startswith("97"):
            return f"+977{cleaned}"
        return f"+91{cleaned}"
    elif phone_str.startswith("+"):
        return phone_str
    return f"+977{cleaned}"

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ---------------------------------------------------------------------------
# Compatibility helpers expected by the test suite
# ---------------------------------------------------------------------------

async def get_current_user_or_admin(request: Request) -> dict:
    """Return the current authenticated user (admin or regular).

    The original code only provided ``get_current_user`` and ``get_current_admin``.
    Some tests import ``get_current_user_or_admin`` which should behave like
    ``get_current_user`` – i.e. raise ``HTTPException`` if the request is not
    authenticated. Admin users are also regular users, so delegating to
    ``get_current_user`` satisfies the contract.
    """
    return await get_current_user(request)

async def get_current_user_or_admin_or_none(request: Request) -> dict | None:
    """Return the current user if authenticated, otherwise ``None``.

    This mirrors the behaviour of FastAPI's optional dependencies. It catches
    authentication errors and returns ``None`` instead of propagating the
    exception.
    """
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def get_current_user_or_none(request: Request) -> dict | None:
    """Alias for ``get_current_user_or_admin_or_none`` for backward compatibility.
    """
    return await get_current_user_or_admin_or_none(request)

async def get_current_admin_or_none(user: dict = Depends(get_current_user)) -> dict | None:
    """Return the admin user if the current user has admin role, otherwise ``None``.

    This helper is useful when a route can be accessed by both admins and
    regular users but needs to know whether the caller is an admin.
    """
    if user.get("role") == "admin":
        return user
    return None
