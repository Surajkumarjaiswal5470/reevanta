import asyncio
import logging
import os
import uvicorn
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware

from core.config import CORS_ORIGINS
from core.database import db, client
from core.rate_limiter import RateLimitMiddleware
from core.security_middleware import SecurityHeadersMiddleware
from core.exception_handler import (
    http_exception_handler,
    validation_exception_handler,
    global_unhandled_exception_handler,
)
from services.seed_service import seed_admin, seed_products
from routers.health import router as health_router
from routers.auth import router as auth_router
from routers.products import router as products_router
from routers.addresses import router as addresses_router
from routers.orders import router as orders_router
from routers.vouchers import router as vouchers_router
from routers.cart import router as cart_router
from routers.personalization import router as personalization_router
from routers.admin import admin_router
from routers.admin.cms import router as admin_cms_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("reevanta.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Reevanta backend...")

    async def init_db():
        try:
            await db.users.create_index("email", unique=True)
            await db.products.create_index(
                [
                    ("name", "text"),
                    ("brand", "text"),
                    ("description", "text"),
                    ("category", "text"),
                    ("tags", "text"),
                ]
            )
            await db.orders.create_index("user_id")
            await db.addresses.create_index("user_id")
            await db.carts.create_index("user_id", unique=True)
            await db.vouchers.create_index("code", unique=True)
            await db.restock_subscriptions.create_index(
                [("product_id", 1), ("email", 1)]
            )
            await seed_admin()
            await seed_products()
            logger.info("Reevanta database initialized successfully.")
        except Exception as e:
            logger.error(f"MongoDB Atlas Connection Warning: {e}")
            logger.warning(
                "Ensure your IP address is whitelisted in MongoDB Atlas."
            )

    asyncio.create_task(init_db())
    yield
    logger.info("Closing Reevanta database connections...")
    client.close()


app = FastAPI(
    title="RIVAANTA Luxury Wear API",
    description="REST API backend for Reevanta E-Commerce platform.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_unhandled_exception_handler)

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(addresses_router)
api_router.include_router(orders_router)
api_router.include_router(vouchers_router)
api_router.include_router(cart_router)
api_router.include_router(personalization_router)
api_router.include_router(admin_cms_router)
api_router.include_router(admin_router)

app.include_router(api_router)

# Middleware order matters: last-added runs first.
# CORS must be outermost so it handles preflight & headers even on 500s.
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8001",
    "http://localhost:3001",
    "https://reevanta.onrender.com",
    "https://therivaanta.com",
    "https://www.therivaanta.com",
]
if CORS_ORIGINS.strip() != "*" and CORS_ORIGINS.strip():
    for o in CORS_ORIGINS.split(","):
        if o.strip() and o.strip() not in cors_origins:
            cors_origins.append(o.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
