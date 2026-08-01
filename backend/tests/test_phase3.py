import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.config import MONGO_URL, DB_NAME
from models.cart import ShippingEstimateRequest
from routers.cart import calculate_shipping_estimate

def test_phase3_shipping_and_cart():
    async def run():
        # Test 1: Real-time Shipping Estimator
        res_valley = await calculate_shipping_estimate(ShippingEstimateRequest(city="Kathmandu", cartSubtotal=1000))
        assert res_valley["isFreeShipping"] is True
        assert res_valley["shippingFee"] == 0
        
        res_pokhara = await calculate_shipping_estimate(ShippingEstimateRequest(city="Pokhara", cartSubtotal=1000))
        assert res_pokhara["shippingFee"] == 150

        res_free_subtotal = await calculate_shipping_estimate(ShippingEstimateRequest(city="Pokhara", cartSubtotal=3500))
        assert res_free_subtotal["isFreeShipping"] is True
        assert res_free_subtotal["shippingFee"] == 0

        # Test 2: Database Cart insertion verify
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        await db.carts.update_one(
            {"user_id": "test_user_phase3"},
            {"$set": {"items": [{"id": "p1", "qty": 1}], "is_converted": False}},
            upsert=True
        )
        saved = await db.carts.find_one({"user_id": "test_user_phase3"})
        assert saved is not None
        assert len(saved["items"]) == 1
        
        client.close()

    asyncio.run(run())
