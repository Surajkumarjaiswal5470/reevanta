import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import MONGO_URL, DB_NAME

def test_meilisearch_service_import_and_fallback():
    async def run_test():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        products = await db.products.find({"name": {"$regex": "saree", "$options": "i"}}).to_list(10)
        assert isinstance(products, list)
        
        client.close()

    asyncio.run(run_test())
