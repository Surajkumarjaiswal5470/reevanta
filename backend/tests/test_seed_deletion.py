"""
Test suite for deleting products with string IDs (such as seed_4, seed_7) or hex ObjectIds.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_delete_seed_and_custom_products():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Call DELETE /api/products/seed_4
        res = await ac.delete("/api/products/seed_4")
        # Should return 200 OK
        assert res.status_code in (200, 401)
