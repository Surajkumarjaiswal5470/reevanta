import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

import certifi

async def main():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "reevanta_db")
    print(f"Testing MongoDB Atlas URL: {mongo_url}")
    
    try:
        client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
        db = client[db_name]
        res = await db.command("ping")
        print("SUCCESS with certifi! Response:", res)
    except Exception as e:
        print("Failed with certifi:", e)
        print("Trying tlsAllowInvalidCertificates=True...")
        client = AsyncIOMotorClient(mongo_url, tls=True, tlsAllowInvalidCertificates=True)
        db = client[db_name]
        res = await db.command("ping")
        print("SUCCESS with tlsAllowInvalidCertificates! Response:", res)

    collections = await db.list_collection_names()
    print("Existing Atlas Collections:", collections)
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
