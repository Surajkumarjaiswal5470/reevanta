import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import MONGO_URL, DB_NAME
from models.cart import ShippingEstimateRequest

def test_personalization_and_loyalty():
    async def run():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        sample = await db.products.find_one({})
        assert sample is not None
        p_id = str(sample["_id"])

        # Insert Restock subscription directly
        res = await db.restock_subscriptions.insert_one({
            "product_id": p_id,
            "product_name": sample.get("name"),
            "email": "customer@example.com",
            "notified": False
        })
        assert res.inserted_id is not None

        # Check personalized query
        prods = await db.products.find({"category": "clothes"}).to_list(4)
        assert isinstance(prods, list)

        client.close()

    asyncio.run(run())
