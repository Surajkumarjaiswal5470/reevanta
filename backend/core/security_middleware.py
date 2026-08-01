import re
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

def sanitize_text(text: str) -> str:
    """Sanitize string input to prevent XSS (Cross-Site Scripting) attacks."""
    if not isinstance(text, str):
        return text
    # Remove script and iframe tags
    cleaned = re.sub(r'(?i)<script[\s\S]*?>[\s\S]*?<\/script>', '', text)
    cleaned = re.sub(r'(?i)<iframe[\s\S]*?>[\s\S]*?<\/iframe>', '', cleaned)
    # Remove event handlers (e.g. onerror=, onload=, onclick=)
    cleaned = re.sub(r'(?i)on\w+\s*=\s*["\'][^"\']*["\']', '', cleaned)
    cleaned = re.sub(r'(?i)on\w+\s*=\s*[^>\s]+', '', cleaned)
    # Remove javascript: protocols
    cleaned = re.sub(r'(?i)javascript:', '', cleaned)
    return cleaned

def sanitize_data(data):
    """Recursively sanitize dict/list string values against XSS."""
    if isinstance(data, str):
        return sanitize_text(data)
    elif isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(i) for i in data]
    return data

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Set Security Headers
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' http: https: ws: wss:;"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        return response
