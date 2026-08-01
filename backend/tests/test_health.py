import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_deep_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert "status" in data
        assert "timestamp" in data
        assert "uptime_seconds" in data
        assert "services" in data
        assert "mongodb" in data["services"]
        assert "redis" in data["services"]

@pytest.mark.anyio
async def test_liveness_and_readiness():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        live = await ac.get("/api/health/liveness")
        assert live.status_code == 200
        assert live.json()["status"] == "alive"

        ready = await ac.get("/api/health/readiness")
        assert ready.status_code == 200
        assert "status" in ready.json()
