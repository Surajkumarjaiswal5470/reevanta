import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_order_management_enterprise_suite():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Unauthenticated order fetching rejection
        get_res = await ac.get("/api/orders/mine")
        assert get_res.status_code == 401

        # 2. Unauthenticated order cancellation rejection
        cancel_res = await ac.post("/api/orders/65c1a2b3c4d5e6f7a8b9c0d1/cancel")
        assert cancel_res.status_code == 401

        # 3. Unauthenticated return request rejection
        return_res = await ac.post(
            "/api/orders/65c1a2b3c4d5e6f7a8b9c0d1/return",
            json={"reason": "Defective item", "refundMethod": "eSewa"}
        )
        assert return_res.status_code == 401
