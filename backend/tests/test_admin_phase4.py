import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import MONGO_URL, DB_NAME
from models.cms import HomepageCMS
from models.voucher import VoucherApplyRequest

def test_admin_analytics_and_cms():
    async def run():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]

        # Insert / Update CMS directly in DB
        await db.cms.update_one(
            {"key": "homepage"},
            {"$set": {
                "key": "homepage",
                "heroTitle": "Royal Festive Wear 2026",
                "heroSubtitle": "Exclusive Handloom Sarees & Silk Kurtas",
                "heroImageUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
                "announcementTicker": "🔥 Free Express Delivery across Kathmandu Valley!",
                "promoBadge": "Royal Collection"
            }},
            upsert=True
        )

        cms = await db.cms.find_one({"key": "homepage"})
        assert cms["heroTitle"] == "Royal Festive Wear 2026"
        assert "announcementTicker" in cms

        client.close()

    asyncio.run(run())
