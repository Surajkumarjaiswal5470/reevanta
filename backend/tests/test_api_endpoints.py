import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_api_contract_and_security_headers():
    """API Endpoint Contracts, Validation Errors, and Headers Test."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        # 1. Verify Security Response Headers
        res = await ac.get("/api/health")
        assert res.status_code in [200, 503]
        assert "X-Frame-Options" in res.headers
        assert "X-Content-Type-Options" in res.headers
        assert "X-XSS-Protection" in res.headers
        assert res.headers["X-Frame-Options"] == "DENY"

        # 2. Verify 404 Handling for Invalid API Routes
        not_found = await ac.get("/api/non-existent-endpoint-123")
        assert not_found.status_code == 404

        # 3. Verify Pydantic Validation Errors (422) for invalid payloads
        bad_auth = await ac.post("/api/auth/login", json={"invalid_field": True})
        assert bad_auth.status_code == 422

        # 4. Verify Admin Categories API Response Structure
        cat_res = await ac.get("/api/admin/categories")
        assert cat_res.status_code == 200
        assert isinstance(cat_res.json(), list)
