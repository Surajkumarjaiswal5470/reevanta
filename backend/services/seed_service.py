from datetime import datetime, timezone
from core.config import ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE
from core.database import db
from core.security import hash_password
from seeds.catalog_data import SEED_PRODUCTS

async def seed_admin():
    existing = await db.users.find_one({"$or": [{"email": ADMIN_EMAIL}, {"phone": ADMIN_PHONE}]})
    if existing is None:
        hashed = hash_password(ADMIN_PASSWORD)
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "phone": ADMIN_PHONE,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
    else:
        await db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "phone": ADMIN_PHONE,
                "password_hash": hash_password(ADMIN_PASSWORD),
                "role": "admin"
            }}
        )

from services.meilisearch_service import init_meilisearch, bulk_index_products

async def seed_products():
    # Sync existing products with Meilisearch (clean catalog for live production)
    init_meilisearch()
    all_products = await db.products.find({}).to_list(200)
    bulk_index_products(all_products)
    
    await seed_vouchers()
    # NOTE: We intentionally skip seeding fake reviews to start with a clean
    # rating system. Real reviews will be added via the public API.
    # await seed_reviews(all_products)

async def seed_vouchers():
    count = await db.vouchers.count_documents({})
    if count == 0:
        default_vouchers = [
            {
                "code": "WELCOME500",
                "discountType": "fixed",
                "discountValue": 500,
                "minOrderValue": 1500,
                "autoApply": True,
                "isActive": True,
                "description": "Auto-applied Welcome Gift (NPR 500 Off on orders above NPR 1,500)",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "code": "KATHMANDU20",
                "discountType": "percentage",
                "discountValue": 20,
                "minOrderValue": 1000,
                "maxDiscount": 1000,
                "autoApply": False,
                "isActive": True,
                "description": "20% Off Kathmandu Heritage Discount (Max NPR 1,000)",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "code": "FESTIVE1000",
                "discountType": "fixed",
                "discountValue": 1000,
                "minOrderValue": 3000,
                "autoApply": False,
                "isActive": True,
                "description": "Festive Luxury Offer (NPR 1,000 Off on orders above NPR 3,000)",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.vouchers.insert_many(default_vouchers)

async def seed_reviews(products):
    rev_count = await db.reviews.count_documents({})
    if rev_count == 0 and products:
        sample_reviews = []
        for p in products[:5]:
            p_id = str(p["_id"])
            sample_reviews.extend([
                {
                    "product_id": p_id,
                    "userName": "Aaradhya Sharma",
                    "rating": 5,
                    "comment": "Exquisite quality fabric and stitching! Wore it to a Kathmandu festive gathering and received endless compliments.",
                    "photoUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400",
                    "verifiedPurchase": True,
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                {
                    "product_id": p_id,
                    "userName": "Priya Adhikari",
                    "rating": 5,
                    "comment": "Super fast delivery to Durbar Marg, Kathmandu. Highly recommended luxury store!",
                    "photoUrl": None,
                    "verifiedPurchase": True,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            ])
        if sample_reviews:
            await db.reviews.insert_many(sample_reviews)
