"""
Backend Test Suite for Notifications & Operational Alerts Suite
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from httpx import AsyncClient, ASGITransport
from server import app
from core.security import get_current_admin, get_current_user


@pytest.fixture(autouse=True)
def override_admin():
    app.dependency_overrides[get_current_admin] = lambda: {"_id": "admin123", "email": "admin@therivaanta.com", "role": "admin"}
    app.dependency_overrides[get_current_user] = lambda: {"_id": "admin123", "email": "admin@therivaanta.com", "role": "admin"}
    yield
    app.dependency_overrides.clear()


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
