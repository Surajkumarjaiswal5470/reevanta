"""
Backend Test Suite for Returns, Refunds & Exchanges Operations Suite
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
async def test_returns_and_refunds_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch admin returns list
        res_returns = await ac.get("/api/admin/returns")
        assert res_returns.status_code == 200
        returns_list = res_returns.json()
        assert isinstance(returns_list, list)

        # 2. Fetch returns analytics
        res_analytics = await ac.get("/api/admin/returns/analytics")
        assert res_analytics.status_code == 200
        an_data = res_analytics.json()
        assert "total_returns_count" in an_data
        assert "approval_rate_percent" in an_data
