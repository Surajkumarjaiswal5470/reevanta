"""
Backend Test Suite for Enterprise Customer Management System (CRM)
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_admin_users_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch admin users list
        res = await ac.get("/api/admin/users")
        assert res.status_code == 200
        data = res.json()
        assert "users" in data
        assert isinstance(data["users"], list)
