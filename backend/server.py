import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from core.config import CORS_ORIGINS
from core.database import db, client
from services.seed_service import seed_admin, seed_products
from routers.auth import router as auth_router
from routers.products import router as products_router
from routers.addresses import router as addresses_router
from routers.orders import router as orders_router
from routers.vouchers import router as vouchers_router
from routers.cart import router as cart_router
from routers.personalization import router as personalization_router
from routers.admin import admin_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("reevanta.server")

import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Reevanta backend...")
    async def init_db():
        try:
            await db.users.create_index("email", unique=True)
            await db.products.create_index([
                ("name", "text"), ("brand", "text"), ("description", "text"),
                ("category", "text"), ("tags", "text")
            ])
            await db.orders.create_index("user_id")
            await db.addresses.create_index("user_id")
            await db.carts.create_index("user_id", unique=True)
            await db.vouchers.create_index("code", unique=True)
            await db.restock_subscriptions.create_index([("product_id", 1), ("email", 1)])
            await seed_admin()
            await seed_products()
            logger.info("Reevanta database initialized successfully.")
        except Exception as e:
            logger.error(f"MongoDB Atlas Connection Warning: {e}")
            logger.warning("Ensure your current IP address is whitelisted in MongoDB Atlas Network Access.")
    
    asyncio.create_task(init_db())
    yield
    logger.info("Closing Reevanta database connections...")
    client.close()



from core.rate_limiter import RateLimitMiddleware
from core.security_middleware import SecurityHeadersMiddleware

app = FastAPI(
    title="RIVAANTA Luxury Wear API",
    description="Production-ready REST API backend for Reevanta E-Commerce platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Add Security Headers & Rate Limiting Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(addresses_router)
api_router.include_router(orders_router)
api_router.include_router(vouchers_router)
api_router.include_router(cart_router)
api_router.include_router(personalization_router)
api_router.include_router(admin_router)

app.include_router(api_router)

# Hardened CORS configuration
if CORS_ORIGINS.strip() == '*':
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origin_regex=".*",
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=[origin.strip() for origin in CORS_ORIGINS.split(',')],
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
