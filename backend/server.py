from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=1), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
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


def serialize_doc(doc):
    if not doc:
        return doc
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


def to_object_id(id_str: str) -> ObjectId:
    """Safely convert a string to ObjectId, raising 404 if invalid."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")


# ================== SEED DATA ==================

SEED_PRODUCTS = [
    {
        "name": "Oversized Vintage Graphic Hoodie",
        "category": "clothes",
        "brand": "UrbanRev",
        "price": 1299, "originalPrice": 2499,
        "rating": 4.6, "reviewsCount": 342,
        "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800",
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["#282C3F", "#FF3F6C", "#E0E0E0"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 48, "resellerMargin": 350,
        "description": "Premium heavy cotton fleece hoodie with vintage wash and drop shoulder fit.",
        "tags": ["hoodie", "streetwear", "winter", "unisex", "graphic"]
    },
    {
        "name": "Chunky Platform Retro Sneakers",
        "category": "shoes",
        "brand": "KicksLab",
        "price": 2199, "originalPrice": 3999,
        "rating": 4.8, "reviewsCount": 512,
        "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800",
        "sizes": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
        "colors": ["#FFFFFF", "#000000", "#FF3F6C"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 45, "resellerMargin": 500,
        "description": "Cloud-cushioning platform sneakers with breathable mesh and modern streetwear aesthetic.",
        "tags": ["sneakers", "platform", "chunky", "retro", "shoes"]
    },
    {
        "name": "Velvet Matte Lipstick & Gloss Kit",
        "category": "makeup",
        "brand": "GlowGasm",
        "price": 699, "originalPrice": 1299,
        "rating": 4.7, "reviewsCount": 890,
        "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800",
        "sizes": ["Standard"],
        "colors": ["#8B0000", "#FF69B4", "#D2B48C"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 46, "resellerMargin": 220,
        "description": "Long-lasting transfer-proof velvet matte liquid lipstick with high-shine lip gloss.",
        "tags": ["lipstick", "matte", "makeup", "beauty", "gloss"]
    },
    {
        "name": "Quilted Chain Crossbody Bag",
        "category": "accessories",
        "brand": "AuraLux",
        "price": 999, "originalPrice": 1999,
        "rating": 4.5, "reviewsCount": 184,
        "image": "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800",
        "sizes": ["One Size"],
        "colors": ["#000000", "#F5F5DC", "#FF3F6C"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 50, "resellerMargin": 300,
        "description": "Chic quilted vegan leather handbag with gold-tone heavy chain strap and secure magnetic snap.",
        "tags": ["bag", "crossbody", "handbag", "chain", "quilted"]
    },
    {
        "name": "Highlighter & Contour Glow Palette",
        "category": "makeup",
        "brand": "GlowGasm",
        "price": 849, "originalPrice": 1599,
        "rating": 4.9, "reviewsCount": 420,
        "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800",
        "sizes": ["Palette"],
        "colors": ["#FFD700", "#B76E79", "#CD7F32"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 47, "resellerMargin": 280,
        "description": "Ultra-pigmented shimmer highlighter and sculpting contour powders for flawless definition.",
        "tags": ["highlighter", "contour", "palette", "makeup", "glow"]
    },
    {
        "name": "Slim Fit Pleated Tennis Skirt",
        "category": "clothes",
        "brand": "UrbanRev",
        "price": 799, "originalPrice": 1499,
        "rating": 4.4, "reviewsCount": 215,
        "image": "https://images.unsplash.com/photo-1583496661160-fb5886a13d44?auto=format&fit=crop&w=800",
        "sizes": ["XS", "S", "M", "L"],
        "colors": ["#000000", "#FFFFFF", "#FF3F6C", "#000080"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 46, "resellerMargin": 250,
        "description": "High-waisted pleated tennis skirt with built-in safety shorts for active everyday style.",
        "tags": ["skirt", "tennis", "pleated", "clothes", "women"]
    },
    {
        "name": "Minimalist Gold-Plated Hoop Earrings",
        "category": "accessories",
        "brand": "AuraLux",
        "price": 499, "originalPrice": 999,
        "rating": 4.7, "reviewsCount": 630,
        "image": "https://images.unsplash.com/photo-1611085583191-a3b181a88401?auto=format&fit=crop&w=800",
        "sizes": ["Standard"],
        "colors": ["#FFD700", "#C0C0C0"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 50, "resellerMargin": 180,
        "description": "Tarnish-resistant 18k gold plated lightweight chunky hoops for effortless everyday elegance.",
        "tags": ["earrings", "hoops", "jewelry", "gold", "accessories"]
    },
    {
        "name": "Air Cushion Running Sport Shoes",
        "category": "shoes",
        "brand": "KicksLab",
        "price": 2499, "originalPrice": 4999,
        "rating": 4.9, "reviewsCount": 780,
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800",
        "sizes": ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
        "colors": ["#000000", "#FF3F6C", "#008080"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 50, "resellerMargin": 600,
        "description": "Professional running shoes with responsive air-sole cushioning and shock-absorbent outsole.",
        "tags": ["running", "sports", "shoes", "cushion", "athletic"]
    },
    {
        "name": "Classic Denim Straight-Leg Jeans",
        "category": "clothes",
        "brand": "UrbanRev",
        "price": 1499, "originalPrice": 2999,
        "rating": 4.6, "reviewsCount": 512,
        "image": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800",
        "sizes": ["28", "30", "32", "34", "36"],
        "colors": ["#4169E1", "#000000", "#87CEEB"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 50, "resellerMargin": 400,
        "description": "Vintage-inspired denim jeans with classic straight-leg fit and premium fade wash.",
        "tags": ["jeans", "denim", "clothes", "pants", "unisex"]
    },
    {
        "name": "Waterproof Mascara & Eyeliner Set",
        "category": "makeup",
        "brand": "GlowGasm",
        "price": 549, "originalPrice": 1099,
        "rating": 4.5, "reviewsCount": 260,
        "image": "https://images.unsplash.com/photo-1631214540242-3cd8c4b0b3b6?auto=format&fit=crop&w=800",
        "sizes": ["Standard"],
        "colors": ["#000000", "#8B4513"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 50, "resellerMargin": 200,
        "description": "24hr smudge-proof waterproof mascara paired with a precision liquid eyeliner pen.",
        "tags": ["mascara", "eyeliner", "makeup", "waterproof", "eyes"]
    },
    {
        "name": "Leather Analog Wristwatch",
        "category": "accessories",
        "brand": "AuraLux",
        "price": 1799, "originalPrice": 3499,
        "rating": 4.7, "reviewsCount": 340,
        "image": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800",
        "sizes": ["One Size"],
        "colors": ["#654321", "#000000", "#8B4513"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 48, "resellerMargin": 500,
        "description": "Minimalist genuine leather strap analog wristwatch with Japanese quartz movement.",
        "tags": ["watch", "wristwatch", "leather", "accessories", "analog"]
    },
    {
        "name": "Casual Slip-On Loafers",
        "category": "shoes",
        "brand": "KicksLab",
        "price": 1499, "originalPrice": 2799,
        "rating": 4.5, "reviewsCount": 190,
        "image": "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800",
        "sizes": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
        "colors": ["#000000", "#8B4513", "#DEB887"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 46, "resellerMargin": 350,
        "description": "Comfortable slip-on loafers with cushioned insole for all-day wear.",
        "tags": ["loafers", "shoes", "slipon", "casual", "footwear"]
    }
]


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({"email": admin_email, "password_hash": hashed, "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc)})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})


async def seed_products():
    count = await db.products.count_documents({})
    if count == 0:
        await db.products.insert_many(SEED_PRODUCTS)


@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.products.create_index([("name", "text"), ("brand", "text"), ("description", "text"), ("category", "text"), ("tags", "text")])
    await db.orders.create_index("user_id")
    await db.addresses.create_index("user_id")
    await seed_admin()
    await seed_products()


# ================== AUTH ==================

class UserRegister(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


def set_auth_cookies(response: Response, user_id: str, email: str):
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


@api_router.post("/auth/register")
async def register(inp: UserRegister, response: Response):
    email = inp.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(inp.password)
    doc = {"email": email, "password_hash": hashed, "name": inp.name, "role": "user", "created_at": datetime.now(timezone.utc)}
    res = await db.users.insert_one(doc)
    user_id = str(res.inserted_id)
    set_auth_cookies(response, user_id, email)
    return {"id": user_id, "email": email, "name": inp.name, "role": "user"}


@api_router.post("/auth/login")
async def login(inp: UserLogin, response: Response):
    email = inp.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    user_id = str(user["_id"])
    set_auth_cookies(response, user_id, email)
    return {"id": user_id, "email": email, "name": user.get("name", "User"), "role": user.get("role", "user")}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user.get("name"), "role": user.get("role", "user")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/", samesite="none", secure=True)
    response.delete_cookie(key="refresh_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out successfully"}


# ================== PRODUCTS ==================

class ProductCreate(BaseModel):
    name: str
    category: str
    brand: str
    price: float
    originalPrice: float
    rating: float = 4.5
    reviewsCount: int = 10
    image: str
    sizes: List[str]
    colors: List[str]
    inStock: bool = True
    isFlashSale: bool = False
    discountPercent: int = 20
    resellerMargin: float = 200
    description: str
    tags: List[str] = []


@api_router.get("/products")
async def get_products(category: Optional[str] = None, q: Optional[str] = None, limit: int = 100):
    query = {}
    if category and category != "all":
        query["category"] = category
    if q:
        # Case-insensitive substring search across name/brand/description/tags
        regex = {"$regex": q, "$options": "i"}
        query["$or"] = [{"name": regex}, {"brand": regex}, {"description": regex}, {"tags": regex}, {"category": regex}]
    products = await db.products.find(query).to_list(limit)
    return [serialize_doc(p) for p in products]


@api_router.get("/products/search-suggest")
async def search_suggest(q: str, limit: int = 6):
    if not q or len(q.strip()) < 1:
        return []
    regex = {"$regex": q.strip(), "$options": "i"}
    cursor = db.products.find({"$or": [{"name": regex}, {"brand": regex}, {"tags": regex}]}).limit(limit)
    products = await cursor.to_list(limit)
    return [serialize_doc(p) for p in products]


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_doc(product)


@api_router.post("/products")
async def create_product(inp: ProductCreate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    doc = inp.model_dump()
    res = await db.products.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    res = await db.products.delete_one({"_id": to_object_id(product_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


# ================== ADDRESSES ==================

class AddressCreate(BaseModel):
    label: str = "Home"
    fullName: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: Optional[str] = ""
    pincode: str
    country: str = "India"
    lat: Optional[float] = None
    lng: Optional[float] = None
    isDefault: bool = False


@api_router.get("/addresses")
async def get_addresses(user: dict = Depends(get_current_user)):
    addrs = await db.addresses.find({"user_id": user["id"]}).to_list(50)
    return [serialize_doc(a) for a in addrs]


@api_router.post("/addresses")
async def create_address(inp: AddressCreate, user: dict = Depends(get_current_user)):
    doc = inp.model_dump()
    doc["user_id"] = user["id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    if doc.get("isDefault"):
        # Unset previous defaults
        await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"isDefault": False}})
    else:
        # If no addresses yet, make this default
        existing_count = await db.addresses.count_documents({"user_id": user["id"]})
        if existing_count == 0:
            doc["isDefault"] = True
    res = await db.addresses.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    res = await db.addresses.delete_one({"_id": to_object_id(address_id), "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted"}


@api_router.patch("/addresses/{address_id}/default")
async def set_default_address(address_id: str, user: dict = Depends(get_current_user)):
    # Verify address belongs to user BEFORE mutating any defaults
    obj_id = to_object_id(address_id)
    owned = await db.addresses.find_one({"_id": obj_id, "user_id": user["id"]})
    if not owned:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.addresses.update_many({"user_id": user["id"]}, {"$set": {"isDefault": False}})
    await db.addresses.update_one({"_id": obj_id, "user_id": user["id"]}, {"$set": {"isDefault": True}})
    return {"message": "Default address updated"}


# ================== ORDERS ==================

ORDER_STATUSES = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"]


class OrderItem(BaseModel):
    productId: Optional[str] = None
    name: str
    price: float
    qty: int
    image: Optional[str] = ""
    selectedSize: Optional[str] = ""
    selectedColor: Optional[str] = ""


class OrderCreate(BaseModel):
    items: List[OrderItem]
    subtotal: float
    shipping: float = 0
    total: float
    address: dict
    paymentMethod: str = "COD"
    notes: Optional[str] = ""


def build_timeline(status: str):
    """Build order tracking timeline based on current status."""
    now = datetime.now(timezone.utc)
    steps = []
    idx = ORDER_STATUSES.index(status) if status in ORDER_STATUSES else 0
    for i, s in enumerate(ORDER_STATUSES[:5]):
        if i < idx:
            eta = (now - timedelta(hours=(idx - i) * 12)).isoformat()
            steps.append({"status": s, "completed": True, "timestamp": eta})
        elif i == idx:
            steps.append({"status": s, "completed": True, "timestamp": now.isoformat(), "current": True})
        else:
            eta = (now + timedelta(days=(i - idx))).isoformat()
            steps.append({"status": s, "completed": False, "eta": eta})
    return steps


@api_router.post("/orders")
async def create_order(inp: OrderCreate, user: dict = Depends(get_current_user)):
    doc = inp.model_dump()
    doc["user_id"] = user["id"]
    doc["userName"] = user.get("name", "")
    doc["userEmail"] = user.get("email", "")
    doc["status"] = "Order Placed"
    doc["placed_at"] = datetime.now(timezone.utc).isoformat()
    doc["order_number"] = f"LB-{int(datetime.now(timezone.utc).timestamp())}"
    res = await db.orders.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    doc["timeline"] = build_timeline(doc["status"])
    return doc


@api_router.get("/orders/mine")
async def get_my_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}).sort("placed_at", -1).to_list(100)
    out = []
    for o in orders:
        s = serialize_doc(o)
        s["timeline"] = build_timeline(s.get("status", "Order Placed"))
        out.append(s)
    return out


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # Only owner or admin can view
    if str(order.get("user_id")) != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    s = serialize_doc(order)
    s["timeline"] = build_timeline(s.get("status", "Order Placed"))
    return s


@api_router.get("/orders")
async def list_orders_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    orders = await db.orders.find({}).sort("placed_at", -1).to_list(200)
    out = []
    for o in orders:
        s = serialize_doc(o)
        s["timeline"] = build_timeline(s.get("status", "Order Placed"))
        out.append(s)
    return out


class StatusUpdate(BaseModel):
    status: str


@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, inp: StatusUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if inp.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {ORDER_STATUSES}")
    res = await db.orders.update_one({"_id": to_object_id(order_id)}, {"$set": {"status": inp.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated", "status": inp.status}


@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    obj_id = to_object_id(order_id)
    order = await db.orders.find_one({"_id": obj_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(order.get("user_id")) != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if order.get("status") in ["Shipped", "Out for Delivery", "Delivered"]:
        raise HTTPException(status_code=400, detail="Cannot cancel order that has already shipped")
    await db.orders.update_one({"_id": obj_id}, {"$set": {"status": "Cancelled"}})
    return {"message": "Order cancelled"}


# ================== APP MOUNT ==================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
