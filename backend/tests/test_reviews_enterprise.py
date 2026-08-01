import pytest
from httpx import AsyncClient, ASGITransport
from server import app
from core.database import db

@pytest.mark.anyio
async def test_enterprise_reviews_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create test review for product
        product_id = "65c1a2b3c4d5e6f7a8b9c0d1"
        review_payload = {
            "userName": "Aarav Mehta",
            "rating": 5,
            "fitRating": 3,
            "qualityRating": 5,
            "valueRating": 5,
            "title": "Exquisite Quality & Fast Shipping!",
            "comment": "The fabric and detailing are phenomenal. Fits true to size and looks even better in person.",
            "photos": ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"]
        }
        
        # 1. Get Reviews with Histogram & Metrics
        get_res = await ac.get(f"/api/products/{product_id}/reviews")
        assert get_res.status_code == 200
        rev_hub = get_res.json()
        assert "reviews" in rev_hub
        assert "avg_rating" in rev_hub
        assert "breakdown" in rev_hub
        assert "feature_ratings" in rev_hub

        # 2. Filter Reviews by Rating
        filter_res = await ac.get(f"/api/products/{product_id}/reviews?rating_filter=5")
        assert filter_res.status_code == 200
        filtered = filter_res.json()
        assert "reviews" in filtered
