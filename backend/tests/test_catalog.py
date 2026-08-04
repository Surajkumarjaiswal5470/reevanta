"""
Backend Test Suite for Brands, Collections, Catalog Attributes & SKU Management
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_catalog_brands_and_collections():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch public brands
        res_pub_brands = await ac.get("/api/brands")
        assert res_pub_brands.status_code == 200
        pub_brands = res_pub_brands.json()
        assert isinstance(pub_brands, list)
        assert len(pub_brands) >= 1

        # 2. Fetch specific brand profile by slug
        first_slug = pub_brands[0].get("slug", "rivaanta-luxury")
        res_single_brand = await ac.get(f"/api/brands/{first_slug}")
        assert res_single_brand.status_code == 200
        b_data = res_single_brand.json()
        assert b_data["slug"] == first_slug
        assert "products" in b_data

        # 3. Fetch admin brands
        res_brands = await ac.get("/api/admin/catalog/brands")
        assert res_brands.status_code == 200
        brands = res_brands.json()
        assert isinstance(brands, list)
        assert len(brands) >= 1

        # 4. Fetch collections
        res_collections = await ac.get("/api/admin/catalog/collections")
        assert res_collections.status_code == 200
        collections = res_collections.json()
        assert isinstance(collections, list)
        assert len(collections) >= 1

        # 5. Verify public product list accepts catalog parameters
        res_prod = await ac.get("/api/products?brand=RIVAANTA&is_featured=true")
        assert res_prod.status_code == 200
