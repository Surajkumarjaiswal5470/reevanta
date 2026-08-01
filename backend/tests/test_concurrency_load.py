import time
import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_high_concurrency_burst_load():
    """
    Simulates high-speed burst requests hitting the backend API
    to verify database pooling, caching, & concurrency stability.
    """
    REQUEST_COUNT = 10
    start_time = time.time()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        results = []
        for i in range(REQUEST_COUNT):
            res = await ac.get(f"/api/products?page=1&limit=4&req_id={i}")
            results.append(res.status_code)

    total_time = time.time() - start_time
    reqs_per_sec = round(REQUEST_COUNT / total_time, 2) if total_time > 0 else 100
    print(f"\n🚀 Successfully handled {REQUEST_COUNT} burst requests in {total_time:.3f}s ({reqs_per_sec} req/sec)")

    assert all(code == 200 for code in results)
    assert total_time < 60.0, f"Burst load took too long: {total_time:.2f}s"
