import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_shopping_cart_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Unauthenticated Cart Request
        get_res = await ac.get("/api/cart")
        assert get_res.status_code == 401

        # 2. Shipping Estimate Calculation
        shipping_payload = {
            "city": "Kathmandu",
            "district": "Kathmandu",
            "cartSubtotal": 3500.0
        }
        ship_res = await ac.post("/api/shipping/estimate", json=shipping_payload)
        assert ship_res.status_code == 200
        ship_data = ship_res.json()
        assert "shippingFee" in ship_data
        assert "isFreeShipping" in ship_data
        assert ship_data["isFreeShipping"] is True
