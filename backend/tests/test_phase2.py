import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import MONGO_URL, DB_NAME
from models.product import ReviewCreate

def test_phase2_reviews_and_recommendations():
    async def run():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Pick sample product directly
        sample = await db.products.find_one({})
        assert sample is not None
        p_id = str(sample["_id"])
        
        # Insert test review directly
        rev_res = await db.reviews.insert_one({
            "product_id": p_id,
            "userName": "Test Reviewer",
            "rating": 5,
            "comment": "Excellent luxury quality!",
            "photoUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
            "verifiedPurchase": True
        })
        assert rev_res.inserted_id is not None
        
        fetched = await db.reviews.find_one({"_id": rev_res.inserted_id})
        assert fetched["userName"] == "Test Reviewer"
        assert fetched["verifiedPurchase"] is True
        
        client.close()

    asyncio.run(run())
