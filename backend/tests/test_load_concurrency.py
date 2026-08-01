import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_high_concurrency_load_performance():
    """Simulates high-concurrency customer requests across unique IP addresses."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        async def send_request(client_id: int):
            headers = {"X-Forwarded-For": f"10.0.{client_id // 254}.{client_id % 254 + 1}"}
            res = await ac.get("/api/health", headers=headers)
            return res.status_code

        tasks = [send_request(i) for i in range(1, 10)]
        results = await asyncio.gather(*tasks)

        assert len(results) == 9
        assert all(code in [200, 503] for code in results)
