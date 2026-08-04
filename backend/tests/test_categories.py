"""
Backend Test Suite for Categories, Subcategories, SEO, Icons, Banners & Reordering
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_categories_extended_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch public categories
        res = await ac.get("/api/categories")
        assert res.status_code == 200
        cats = res.json()
        assert isinstance(cats, list)
        assert len(cats) >= 1

        # Check fields
        first = cats[0]
        assert "sort_order" in first
        assert "subcategories" in first

        # 2. Fetch admin categories
        admin_res = await ac.get("/api/admin/categories")
        assert admin_res.status_code == 200
        admin_cats = admin_res.json()
        assert isinstance(admin_cats, list)
