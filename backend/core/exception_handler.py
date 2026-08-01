import logging
from datetime import datetime, timezone
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pymongo.errors import PyMongoError

logger = logging.getLogger("reevanta.exception")

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle FastAPI HTTPExceptions with enterprise JSON schema."""
    error_type = "BAD_REQUEST"
    if exc.status_code == 401:
        error_type = "UNAUTHORIZED"
    elif exc.status_code == 403:
        error_type = "FORBIDDEN"
    elif exc.status_code == 404:
        error_type = "NOT_FOUND"
    elif exc.status_code == 429:
        error_type = "TOO_MANY_REQUESTS"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "success": False,
            "error": {
                "code": exc.status_code,
                "type": error_type,
                "message": str(exc.detail),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        },
        headers=getattr(exc, "headers", None)
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors cleanly."""
    errors = exc.errors()
    first_msg = errors[0]["msg"] if errors else "Invalid request data"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": first_msg,
            "success": False,
            "error": {
                "code": 422,
                "type": "VALIDATION_ERROR",
                "message": first_msg,
                "details": errors,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled server exceptions to prevent raw 500 tracebacks."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error. Please try again later.",
            "success": False,
            "error": {
                "code": 500,
                "type": "INTERNAL_SERVER_ERROR",
                "message": "Internal server error. Please try again later.",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )
