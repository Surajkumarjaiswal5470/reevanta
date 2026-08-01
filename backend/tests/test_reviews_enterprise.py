import pytest
from httpx import AsyncClient, ASGITransport
from server import app
from core.database import db

@pytest.mark.anyio
async def test_enterprise_reviews_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch products to get a target product_id
        res = await ac.get("/api/products")
        assert res.status_code == 200
        products = res.json()
        assert len(products) > 0
        target_product = products[0]
        product_id = target_product["id"]

        # 2. Add an Enterprise Review
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
        create_res = await ac.post(f"/api/products/{product_id}/reviews", json=review_payload)
        assert create_res.status_code == 200
        review_data = create_res.json()
        assert review_data["userName"] == "Aarav Mehta"
        assert review_data["rating"] == 5
        assert review_data["fitRating"] == 3
        assert "id" in review_data
        review_id = review_data["id"]

        # 3. Get Reviews with Histogram & Metrics
        get_res = await ac.get(f"/api/products/{product_id}/reviews")
        assert get_res.status_code == 200
        rev_hub = get_res.json()
        assert "reviews" in rev_hub
        assert "avg_rating" in rev_hub
        assert "breakdown" in rev_hub
        assert "feature_ratings" in rev_hub
        assert rev_hub["breakdown"]["5"] >= 1
        assert rev_hub["feature_ratings"]["avg_quality"] >= 4.0

        # 4. Filter Reviews by Rating (5 stars only)
        filter_res = await ac.get(f"/api/products/{product_id}/reviews?rating_filter=5")
        assert filter_res.status_code == 200
        filtered = filter_res.json()
        assert all(r["rating"] == 5 for r in filtered["reviews"])

        # 5. Upvote Review as Helpful
        vote_res = await ac.post(f"/api/products/reviews/{review_id}/vote")
        assert vote_res.status_code == 200
        assert vote_res.json()["helpfulVotes"] == 1
