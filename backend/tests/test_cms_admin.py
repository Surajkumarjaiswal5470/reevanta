"""
Backend Test Suite for Promotions & CMS Campaign Suite
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
async def test_cms_promotions_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch public homepage CMS
        res = await ac.get("/api/cms/homepage")
        assert res.status_code == 200
        cms = res.json()
        assert "hero_slides" in cms
        assert "announcement_bar" in cms
        assert "countdown_timer" in cms
        assert "promo_popup" in cms
        assert isinstance(cms["hero_slides"], list)

        # 2. Fetch admin homepage CMS
        res_admin = await ac.get("/api/admin/cms/homepage")
        assert res_admin.status_code == 200
        admin_cms = res_admin.json()
        assert "hero_slides" in admin_cms
