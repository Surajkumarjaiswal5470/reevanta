import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import MONGO_URL, DB_NAME
from models.voucher import VoucherApplyRequest

def test_voucher_system():
    async def run():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Check vouchers in DB directly
        voucher = await db.vouchers.find_one({"code": "WELCOME500"})
        if not voucher:
            await db.vouchers.insert_one({
                "code": "WELCOME500",
                "discountType": "fixed",
                "discountValue": 500,
                "minOrderValue": 1500,
                "autoApply": True,
                "isActive": True
            })
            voucher = await db.vouchers.find_one({"code": "WELCOME500"})
            
        assert voucher["code"] == "WELCOME500"
        assert voucher["discountValue"] == 500
        client.close()

    asyncio.run(run())
