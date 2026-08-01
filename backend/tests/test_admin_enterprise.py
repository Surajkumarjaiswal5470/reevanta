import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_admin_enterprise_suite():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Analytics & Overview
        analytics_res = await ac.get("/api/admin/analytics")
        assert analytics_res.status_code in (200, 401, 403)

        # 2. Categories List
        cat_res = await ac.get("/api/admin/categories")
        assert cat_res.status_code in (200, 401, 403)
        if cat_res.status_code == 200:
            categories = cat_res.json()
            assert isinstance(categories, list)

        # 3. Vouchers List
        voucher_res = await ac.get("/api/admin/vouchers")
        assert voucher_res.status_code in (200, 401, 403)

        # 4. Homepage CMS Fetch
        cms_res = await ac.get("/api/cms/homepage")
        assert cms_res.status_code == 200
        cms_data = cms_res.json()
        assert "banners" in cms_data
        assert "heroTitle" in cms_data
