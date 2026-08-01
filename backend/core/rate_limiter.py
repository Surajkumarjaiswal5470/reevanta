import time
import os
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class RateLimiter:
    """In-memory rate limiter for IP tracking, failed login lockout, and checkout fraud velocity control."""
    
    def __init__(self):
        # ip -> list of timestamps
        self.ip_requests = defaultdict(list)
        # (ip, endpoint) -> list of timestamps
        self.endpoint_requests = defaultdict(list)
        # ip -> list of failed attempt timestamps
        self.failed_logins = defaultdict(list)
        # ip -> list of checkout timestamps
        self.checkout_attempts = defaultdict(list)

    def is_rate_limited(self, ip: str, path: str, method: str) -> tuple[bool, int]:
        # Allow tests to bypass rate limiting
        if os.getenv("DISABLE_RATE_LIMIT") == "1":
            return False, 0
        now = time.time()
        window_sec = 60
        
        # Clean old timestamps
        self.ip_requests[ip] = [t for t in self.ip_requests[ip] if now - t < window_sec]
        
        # Check global IP rate limit (120 reqs/min)
        if len(self.ip_requests[ip]) >= 120:
            return True, 60

        # Check endpoint-specific limits
        if "/api/auth/" in path:
            key = f"{ip}:{path}"
            self.endpoint_requests[key] = [t for t in self.endpoint_requests[key] if now - t < window_sec]
            if len(self.endpoint_requests[key]) >= 15:
                return True, 30
            self.endpoint_requests[key].append(now)

        # Record request
        self.ip_requests[ip].append(now)
        return False, 0

    def is_checkout_velocity_exceeded(self, ip: str) -> bool:
        """Checkout Fraud & Velocity Check: max 5 order placements per 10 mins."""
        now = time.time()
        window_10min = 600
        self.checkout_attempts[ip] = [t for t in self.checkout_attempts[ip] if now - t < window_10min]
        if len(self.checkout_attempts[ip]) >= 5:
            return True
        self.checkout_attempts[ip].append(now)
        return False

    def record_failed_login(self, ip: str) -> bool:
        """Record a failed login attempt. Returns True if IP is locked out (>5 failures in 10 mins)."""
        now = time.time()
        window_10min = 600
        self.failed_logins[ip] = [t for t in self.failed_logins[ip] if now - t < window_10min]
        self.failed_logins[ip].append(now)
        return len(self.failed_logins[ip]) >= 5

    def is_login_locked_out(self, ip: str) -> bool:
        now = time.time()
        window_10min = 600
        self.failed_logins[ip] = [t for t in self.failed_logins[ip] if now - t < window_10min]
        return len(self.failed_logins[ip]) >= 5

    def reset_failed_login(self, ip: str):
        self.failed_logins[ip] = []

rate_limiter = RateLimiter()

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        path = request.url.path

        # Check login lockout
        if path == "/api/auth/login" and request.method == "POST":
            if os.getenv("DISABLE_RATE_LIMIT") != "1" and rate_limiter.is_login_locked_out(client_ip):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many failed login attempts. Account temporarily locked for 10 minutes."}
                )

        limited, retry_after = rate_limiter.is_rate_limited(client_ip, path, request.method)
        if limited:
            return JSONResponse(
                status_code=429,
                headers={"Retry-After": str(retry_after)},
                content={"detail": f"Too many requests. Please slow down and try again in {retry_after} seconds."}
            )

        response = await call_next(request)
        return response
