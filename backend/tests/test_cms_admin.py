"""
Backend Test Suite for Promotions & CMS Campaign Suite
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


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
        assert len(cms["hero_slides"]) >= 1

        # 2. Fetch admin homepage CMS
        res_admin = await ac.get("/api/admin/cms/homepage")
        assert res_admin.status_code == 200
        admin_cms = res_admin.json()
        assert "hero_slides" in admin_cms
