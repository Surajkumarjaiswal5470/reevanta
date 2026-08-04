"""
Backend Test Suite for Enterprise Order Management System (OMS)
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_admin_orders_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch admin orders list
        res = await ac.get("/api/admin/orders")
        assert res.status_code == 200
        orders = res.json()
        assert isinstance(orders, list)
