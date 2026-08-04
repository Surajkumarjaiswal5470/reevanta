"""
Backend Test Suite for Notifications & Operational Alerts Suite
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_notifications_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch admin notifications feed
        res = await ac.get("/api/admin/notifications")
        assert res.status_code == 200
        data = res.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)

        # 2. Test Mark as Read
        res_mark = await ac.post("/api/admin/notifications/mark-read", json={
            "mark_all": True
        })
        assert res_mark.status_code == 200
