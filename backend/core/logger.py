import time
import json
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("reevanta.api")

class JSONLogMiddleware(BaseHTTPMiddleware):
    """
    Structured JSON Logging Middleware that records request timing (ms),
    status code, method, path, and client IP.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"
        
        response = await call_next(request)
        
        process_time_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Process-Time"] = f"{process_time_ms}ms"

        log_data = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": process_time_ms,
            "client_ip": client_ip
        }

        # Log formatted JSON string
        logger.info(json.dumps(log_data))

        return response
