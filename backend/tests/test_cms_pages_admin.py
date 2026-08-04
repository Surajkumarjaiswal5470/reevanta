"""
Backend Test Suite for Content Management System (CMS) & Dynamic Pages Engine
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_cms_pages_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch public About Us page
        res_about = await ac.get("/api/cms/pages/about-us")
        assert res_about.status_code == 200
        about_data = res_about.json()
        assert about_data["slug"] == "about-us"
        assert "content" in about_data

        # 2. Fetch public Privacy Policy
        res_privacy = await ac.get("/api/cms/pages/privacy-policy")
        assert res_privacy.status_code == 200
        privacy_data = res_privacy.json()
        assert privacy_data["slug"] == "privacy-policy"

        # 3. Fetch admin pages listing
        res_pages = await ac.get("/api/admin/cms/pages")
        assert res_pages.status_code == 200
        pages = res_pages.json()
        assert isinstance(pages, list)
        assert len(pages) >= 1

        # 4. Fetch admin blogs listing
        res_blogs = await ac.get("/api/admin/cms/blogs")
        assert res_blogs.status_code == 200
        blogs = res_blogs.json()
        assert isinstance(blogs, list)

        # 5. Fetch public FAQs
        res_faqs = await ac.get("/api/cms/faqs")
        assert res_faqs.status_code == 200
        faqs = res_faqs.json()
        assert isinstance(faqs, list)
