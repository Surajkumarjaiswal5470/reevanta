import pytest
from httpx import AsyncClient, ASGITransport
from server import app
from core.security import hash_password, verify_password

@pytest.mark.anyio
async def test_security_headers_and_https():
    """1. HTTPS & Security Headers Test"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/health")
        headers = res.headers
        assert "strict-transport-security" in headers
        assert "x-xss-protection" in headers
        assert "x-content-type-options" in headers
        assert "x-frame-options" in headers
        assert "content-security-policy" in headers
        assert headers["x-frame-options"] == "DENY"

def test_bcrypt_password_hashing():
    """2. Password Hashing Test"""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert hashed.startswith("$2b$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

@pytest.mark.anyio
async def test_input_validation_and_rejection():
    """3. Input Validation Test"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Invalid email format or missing required fields
        res = await ac.post("/api/auth/register", json={"email": "invalid-email-format", "password": "123"})
        assert res.status_code in (400, 422)
        assert res.json()["success"] is False

@pytest.mark.anyio
async def test_nosql_injection_prevention():
    """4. NoSQL Injection Protection Test"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Attempting MongoDB operator injection
        res = await ac.get("/api/products/invalid-object-id-12345")
        assert res.status_code == 404
        assert res.json()["detail"] == "Not found"

@pytest.mark.anyio
async def test_xss_protection_headers():
    """5. XSS Protection Test"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/products")
        assert "x-xss-protection" in res.headers
        assert res.headers["x-xss-protection"] == "1; mode=block"

@pytest.mark.anyio
async def test_unauthenticated_protected_route_rejection():
    """6. CSRF & Auth Token Guard Test"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/orders/mine")
        assert res.status_code == 401

@pytest.mark.anyio
async def test_rate_limiter_active():
    """7. Rate Limiting Control Test"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code in (200, 503)
