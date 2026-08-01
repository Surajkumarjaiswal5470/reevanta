import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_enterprise_reviews_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        product_id = "65c1a2b3c4d5e6f7a8b9c0d1"

        # 1. Product Ratings & Reviews Breakdown
        get_res = await ac.get(f"/api/products/{product_id}/reviews")
        assert get_res.status_code == 200
        rev_hub = get_res.json()
        assert "reviews" in rev_hub
        assert "avg_rating" in rev_hub
        assert "breakdown" in rev_hub

        # 2. Filter Reviews by Star Rating
        filter_res = await ac.get(f"/api/products/{product_id}/reviews?rating_filter=5")
        assert filter_res.status_code == 200

        # 3. Edit Non-Existent Review Error handling
        edit_res = await ac.put("/api/products/reviews/65c1a2b3c4d5e6f7a8b9c0d1", json={"comment": "Updated comment"})
        assert edit_res.status_code == 404

        # 4. Delete Non-Existent Review Error handling
        delete_res = await ac.delete("/api/products/reviews/65c1a2b3c4d5e6f7a8b9c0d1")
        assert delete_res.status_code == 404
