"""
Backend Test Suite for Brands, Collections, Catalog Attributes & SKU Management
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_catalog_brands_and_collections():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch brands (unauthenticated or admin)
        res_brands = await ac.get("/api/admin/catalog/brands")
        assert res_brands.status_code == 200
        brands = res_brands.json()
        assert isinstance(brands, list)
        assert len(brands) >= 1

        # 2. Fetch collections
        res_collections = await ac.get("/api/admin/catalog/collections")
        assert res_collections.status_code == 200
        collections = res_collections.json()
        assert isinstance(collections, list)
        assert len(collections) >= 1

        # 3. Verify public product list accepts new catalog parameters
        res_prod = await ac.get("/api/products?brand=RIVAANTA&is_featured=true")
        assert res_prod.status_code == 200
