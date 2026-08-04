"""
Backend Test Suite for Admin User & Customer Account Blocking APIs
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_admin_users_api_structure():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Unauthenticated request to /api/admin/users → 401
        res = await ac.get("/api/admin/users")
        assert res.status_code == 401

        # 2. Unauthenticated stats request → 401
        stats_res = await ac.get("/api/admin/users/stats/summary")
        assert stats_res.status_code == 401

        # 3. Unauthenticated block request → 401
        block_res = await ac.post("/api/admin/users/65c1a2b3c4d5e6f7a8b9c0d1/block", json={"reason": "test block"})
        assert block_res.status_code == 401
