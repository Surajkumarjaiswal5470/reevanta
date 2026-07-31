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
    # ===== Sarees =====
    {
        "name": "Chikankari Organza Saree",
        "category": "sarees",
        "brand": "Rivaanta Heritage",
        "price": 3499, "originalPrice": 5999,
        "rating": 4.8, "reviewsCount": 126,
        "image": "https://images.unsplash.com/photo-1610030469668-8e450b47a4a5?auto=format&fit=crop&w=900",
        "sizes": ["Free Size"],
        "colors": ["#E8CFC5", "#D4B896", "#8B6F5C", "#B8A48F", "#A7B8C7", "#C4C0BA"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 42, "resellerMargin": 500,
        "description": "Delicate chikankari embroidery on premium organza with an elegant zari border. Comes with an unstitched blouse piece.",
        "tags": ["saree", "chikankari", "organza", "traditional", "ethnic", "wedding"],
        "fabric": "Organza",
        "work": "Chikankari Embroidery",
        "badge": "NEW ARRIVAL"
    },
    {
        "name": "Kanjivaram Silk Saree",
        "category": "sarees",
        "brand": "Rivaanta Heritage",
        "price": 6899, "originalPrice": 11999,
        "rating": 4.9, "reviewsCount": 214,
        "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900",
        "sizes": ["Free Size"],
        "colors": ["#7A1F2A", "#3E1F3E", "#0E4B4A"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 43, "resellerMargin": 900,
        "description": "Handloom pure silk Kanjivaram saree with rich gold zari motifs and contrast pallu.",
        "tags": ["saree", "silk", "kanjivaram", "handloom", "wedding", "traditional"],
        "fabric": "Pure Silk",
        "work": "Gold Zari",
        "badge": "BEST SELLER"
    },
    {
        "name": "Banarasi Georgette Saree",
        "category": "sarees",
        "brand": "Rivaanta Heritage",
        "price": 2799, "originalPrice": 4999,
        "rating": 4.6, "reviewsCount": 88,
        "image": "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&w=900",
        "sizes": ["Free Size"],
        "colors": ["#D4A574", "#8E2B2B", "#284B63"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 44, "resellerMargin": 400,
        "description": "Flowy Banarasi georgette saree with intricate zari weaving throughout.",
        "tags": ["saree", "banarasi", "georgette", "ethnic"],
        "fabric": "Georgette",
        "work": "Zari Weaving"
    },
    # ===== Kurtas =====
    {
        "name": "Embroidered Organza Kurta Set",
        "category": "kurtas",
        "brand": "Rivaanta Signature",
        "price": 3499, "originalPrice": 5999,
        "rating": 4.7, "reviewsCount": 145,
        "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900",
        "sizes": ["XS", "S", "M", "L", "XL"],
        "colors": ["#C4A5CB", "#E8D9CC", "#8B6F5C"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 42, "resellerMargin": 500,
        "description": "Hand-embroidered organza kurta set paired with matching palazzo and dupatta.",
        "tags": ["kurta", "organza", "embroidered", "set", "ethnic"],
        "fabric": "Organza",
        "work": "Hand Embroidery"
    },
    {
        "name": "A-Line Cotton Kurta Set",
        "category": "kurtas",
        "brand": "Rivaanta Everyday",
        "price": 1899, "originalPrice": 3499,
        "rating": 4.7, "reviewsCount": 302,
        "image": "https://images.unsplash.com/photo-1596785231165-7d43ca8c9d0e?auto=format&fit=crop&w=900",
        "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
        "colors": ["#8FA37C", "#D4A574", "#B8A48F", "#7A6F5C"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 45, "resellerMargin": 350,
        "description": "Breathable A-line cotton kurta with matching palazzo — perfect for everyday elegance.",
        "tags": ["kurta", "cotton", "a-line", "casual", "set"],
        "fabric": "Pure Cotton",
        "work": "Block Print"
    },
    {
        "name": "Anarkali Silk Suit",
        "category": "kurtas",
        "brand": "Rivaanta Signature",
        "price": 4299, "originalPrice": 6999,
        "rating": 4.8, "reviewsCount": 176,
        "image": "https://images.unsplash.com/photo-1610030181087-540017dc9d61?auto=format&fit=crop&w=900",
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["#7A1F2A", "#3E1F3E", "#2C4A3E"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 39, "resellerMargin": 600,
        "description": "Floor-length Anarkali suit in luxurious silk with intricate zari yoke and sequined dupatta.",
        "tags": ["anarkali", "suit", "silk", "ethnic", "festive"],
        "fabric": "Art Silk",
        "work": "Zari & Sequins"
    },
    # ===== Lehenga =====
    {
        "name": "Bridal Lehenga Choli",
        "category": "lehenga",
        "brand": "Rivaanta Bridal",
        "price": 12999, "originalPrice": 22999,
        "rating": 4.9, "reviewsCount": 92,
        "image": "https://images.unsplash.com/photo-1610030469668-8e450b47a4a5?auto=format&fit=crop&w=900",
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["#7A1F2A", "#3E1F3E", "#8B3A3A"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 43, "resellerMargin": 1500,
        "description": "Heavily embellished bridal lehenga with hand-crafted zardozi work and matching net dupatta.",
        "tags": ["lehenga", "bridal", "wedding", "zardozi", "heavy"],
        "fabric": "Raw Silk",
        "work": "Zardozi & Stones",
        "badge": "BEST SELLER"
    },
    {
        "name": "Sangeet Party Lehenga",
        "category": "lehenga",
        "brand": "Rivaanta Signature",
        "price": 6499, "originalPrice": 10999,
        "rating": 4.7, "reviewsCount": 65,
        "image": "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&w=900",
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["#D4A574", "#B76E79", "#2C4A3E"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 41, "resellerMargin": 800,
        "description": "Flared party lehenga in soft net with sequin embroidery — perfect for sangeet and mehendi.",
        "tags": ["lehenga", "party", "sangeet", "sequin"],
        "fabric": "Net",
        "work": "Sequin Embroidery"
    },
    # ===== Cosmetics =====
    {
        "name": "Velvet Matte Lipstick",
        "category": "cosmetics",
        "brand": "Rivaanta Beauty",
        "price": 799, "originalPrice": 1299,
        "rating": 4.7, "reviewsCount": 98,
        "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900",
        "sizes": ["Standard"],
        "colors": ["#B76E79", "#8B3A3A", "#7A1F2A", "#C4838C", "#8B4547", "#5C1E1E"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 38, "resellerMargin": 220,
        "description": "Luxuriously rich matte lipstick with intense color payoff and a comfortable, long-lasting wear.",
        "tags": ["lipstick", "matte", "velvet", "makeup", "cosmetics"],
        "shade": "Rose Nude",
        "badge": "BEST SELLER"
    },
    {
        "name": "Lip Liner — Rose Collection",
        "category": "cosmetics",
        "brand": "Rivaanta Beauty",
        "price": 349, "originalPrice": 599,
        "rating": 4.6, "reviewsCount": 78,
        "image": "https://images.unsplash.com/photo-1591360236480-9c6a1cbf1f4a?auto=format&fit=crop&w=900",
        "sizes": ["Standard"],
        "colors": ["#B76E79", "#8B3A3A", "#7A1F2A"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 42, "resellerMargin": 100,
        "description": "Creamy long-wear lip liner that glides on effortlessly. Pair with any Rivaanta lipstick.",
        "tags": ["lip liner", "lip pencil", "makeup"]
    },
    {
        "name": "Makeup Fixer Spray",
        "category": "cosmetics",
        "brand": "Rivaanta Beauty",
        "price": 699, "originalPrice": 1199,
        "rating": 4.5, "reviewsCount": 54,
        "image": "https://images.unsplash.com/photo-1631214540242-3cd8c4b0b3b6?auto=format&fit=crop&w=900",
        "sizes": ["100 ml"],
        "colors": ["#F5F5F5"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 42, "resellerMargin": 180,
        "description": "16-hour makeup fixing mist with hyaluronic acid — locks in your look without dryness.",
        "tags": ["setting spray", "fixer", "makeup"]
    },
    {
        "name": "Compact Powder — Silk Finish",
        "category": "cosmetics",
        "brand": "Rivaanta Beauty",
        "price": 649, "originalPrice": 1099,
        "rating": 4.6, "reviewsCount": 112,
        "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900",
        "sizes": ["Standard"],
        "colors": ["#F1D3B2", "#E1B891", "#C69C74"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 41, "resellerMargin": 160,
        "description": "Featherlight compact powder for a smooth, silky, all-day matte finish.",
        "tags": ["compact", "powder", "matte", "makeup"]
    },
    # ===== Beauty Care =====
    {
        "name": "Vitamin C Face Serum",
        "category": "beauty",
        "brand": "Rivaanta Skin",
        "price": 1299, "originalPrice": 2199,
        "rating": 4.6, "reviewsCount": 224,
        "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900",
        "sizes": ["30 ml"],
        "colors": ["#F3D5A6"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 41, "resellerMargin": 320,
        "description": "Brightening Vitamin C 15% serum with hyaluronic acid — visibly evens tone and boosts radiance.",
        "tags": ["serum", "vitamin c", "skincare", "brightening"]
    },
    {
        "name": "Rose Gold Face Toner Mist",
        "category": "beauty",
        "brand": "Rivaanta Skin",
        "price": 799, "originalPrice": 1399,
        "rating": 4.5, "reviewsCount": 86,
        "image": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900",
        "sizes": ["100 ml"],
        "colors": ["#E8CFC5"],
        "inStock": True, "isFlashSale": False,
        "discountPercent": 43, "resellerMargin": 210,
        "description": "Alcohol-free rose water & 24K gold toner to soothe and hydrate all skin types.",
        "tags": ["toner", "mist", "skincare", "rose"]
    },
    {
        "name": "Argan Oil Hair Serum",
        "category": "beauty",
        "brand": "Rivaanta Hair",
        "price": 549, "originalPrice": 999,
        "rating": 4.7, "reviewsCount": 320,
        "image": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900",
        "sizes": ["50 ml"],
        "colors": ["#B8956A"],
        "inStock": True, "isFlashSale": True,
        "discountPercent": 45, "resellerMargin": 150,
        "description": "Nourishing pure argan oil serum for frizz-free, glossy, salon-smooth hair.",
        "tags": ["hair serum", "argan", "hair care"]
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
    # Force-reseed if categories are stale (old catalog had hoodies/shoes)
    sample = await db.products.find_one({})
    if sample and sample.get("category") in {"clothes", "shoes", "makeup", "accessories"}:
        await db.products.delete_many({})
    count = await db.products.count_documents({})
    if count == 0:
        await db.products.insert_many([{**p} for p in SEED_PRODUCTS])


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
    fabric: Optional[str] = None
    work: Optional[str] = None
    shade: Optional[str] = None
    badge: Optional[str] = None


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

# CORS: when credentials are used, cannot use wildcard origin. Reflect origin via regex.
_cors_env = os.environ.get('CORS_ORIGINS', '*')
if _cors_env.strip() == '*':
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origin_regex=".*",
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=_cors_env.split(','),
        allow_methods=["*"],
        allow_headers=["*"],
    )

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
