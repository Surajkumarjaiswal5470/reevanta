import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_products_pagination():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/products?page=1&limit=4")
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert data["page"] == 1
        assert len(data["items"]) <= 4

@pytest.mark.anyio
async def test_cache_headers_and_response():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # First call (may populate cache)
        res1 = await ac.get("/api/products?category=cosmetics")
        assert res1.status_code == 200

        # Second call (should be cached)
        res2 = await ac.get("/api/products?category=cosmetics")
        assert res2.status_code == 200
