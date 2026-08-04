import certifi
import ssl
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from fastapi import HTTPException
from core.config import MONGO_URL, DB_NAME

# High-Concurrency Motor Async Connection Pool Configuration (5,000+ Concurrent Users)
POOL_SETTINGS = {
    "maxPoolSize": 200,
    "minPoolSize": 20,
    "maxIdleTimeMS": 45000,
    "waitQueueTimeoutMS": 5000,
    "serverSelectionTimeoutMS": 3000,
    "connectTimeoutMS": 5000,
    "socketTimeoutMS": 10000,
}

if "mongodb+srv" in MONGO_URL or "ssl=true" in MONGO_URL.lower() or "tls=true" in MONGO_URL.lower():
    # SSL context for Mongo Atlas
    client = AsyncIOMotorClient(
        MONGO_URL,
        tls=True,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        **POOL_SETTINGS
    )
else:
    client = AsyncIOMotorClient(MONGO_URL, **POOL_SETTINGS)

db = client[DB_NAME]


def serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    d = dict(doc)
    if "_id" in d:
        d["id"] = str(d["_id"])
        d.pop("_id", None)
    return d

def to_object_id(id_str: str) -> ObjectId:
    """Safely convert a string to ObjectId, raising 404 if invalid."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")

def build_id_query(id_str: str) -> dict:
    """Build a flexible MongoDB query matching by _id (as ObjectId or str) or id field."""
    if not id_str:
        return {"_id": None}
    clauses = [{"_id": id_str}, {"id": id_str}]
    try:
        if isinstance(id_str, str) and ObjectId.is_valid(id_str):
            clauses.append({"_id": ObjectId(id_str)})
    except Exception:
        pass
    return {"$or": clauses}
