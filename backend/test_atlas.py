import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def main():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "reevanta_db")
    print(f"Testing MongoDB Atlas URL: {mongo_url}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    res = await db.command("ping")
    print("SUCCESS! MongoDB Atlas ping response:", res)
    
    # Check collections
    collections = await db.list_collection_names()
    print("Existing Atlas Collections:", collections)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
