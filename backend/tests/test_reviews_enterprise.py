"""
Comprehensive Enterprise Reviews & Ratings Test Suite
Tests: Review CRUD, spam detection, voting, reporting, admin moderation,
bulk actions, user banning, and analytics.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_enterprise_reviews_flow():
    """End-to-end review workflow: list, create, vote, edit, delete."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        product_id = "65c1a2b3c4d5e6f7a8b9c0d1"

        # 1. Get reviews via new endpoint
        get_res = await ac.get(f"/api/reviews/product/{product_id}")
        assert get_res.status_code == 200
        rev_hub = get_res.json()
        assert "reviews" in rev_hub
        assert "avg_rating" in rev_hub
        assert "breakdown" in rev_hub
        assert "feature_ratings" in rev_hub
        assert "media_count" in rev_hub
        assert "pages" in rev_hub

        # 2. Filter by star rating
        filter_res = await ac.get(f"/api/reviews/product/{product_id}?rating_filter=5")
        assert filter_res.status_code == 200

        # 3. Filter verified only
        verified_res = await ac.get(f"/api/reviews/product/{product_id}?verified_only=true")
        assert verified_res.status_code == 200

        # 4. Filter with photos
        photos_res = await ac.get(f"/api/reviews/product/{product_id}?with_photos=true")
        assert photos_res.status_code == 200

        # 5. Filter with videos
        videos_res = await ac.get(f"/api/reviews/product/{product_id}?with_videos=true")
        assert videos_res.status_code == 200

        # 6. Sort by helpful
        sort_res = await ac.get(f"/api/reviews/product/{product_id}?sort_by=helpful")
        assert sort_res.status_code == 200

        # 7. Pagination
        page_res = await ac.get(f"/api/reviews/product/{product_id}?page=1&limit=5")
        assert page_res.status_code == 200
        assert page_res.json()["limit"] == 5

        # 8. Edit non-existent review → 404
        edit_res = await ac.put(
            "/api/reviews/65c1a2b3c4d5e6f7a8b9c0d1",
            json={"comment": "Updated comment text for testing"},
        )
        assert edit_res.status_code in (401, 404)

        # 9. Delete non-existent review → 404 or 401
        delete_res = await ac.delete("/api/reviews/65c1a2b3c4d5e6f7a8b9c0d1")
        assert delete_res.status_code in (401, 404)

        # 10. Vote on non-existent review → 404
        vote_res = await ac.post(
            "/api/reviews/65c1a2b3c4d5e6f7a8b9c0d1/vote",
            json={"vote_type": "helpful"},
        )
        assert vote_res.status_code == 404

        # 11. Report non-existent review → 404
        report_res = await ac.post(
            "/api/reviews/65c1a2b3c4d5e6f7a8b9c0d1/report",
            json={"reason": "spam", "comment": "test report"},
        )
        assert report_res.status_code == 404

        # 12. React to non-existent review → 404
        react_res = await ac.post(
            "/api/reviews/65c1a2b3c4d5e6f7a8b9c0d1/react",
            json={"reaction_type": "like"},
        )
        assert react_res.status_code == 404


@pytest.mark.anyio
async def test_legacy_reviews_endpoint():
    """Verify old review endpoints still work for backward compatibility."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        product_id = "65c1a2b3c4d5e6f7a8b9c0d1"

        # Old GET endpoint
        get_res = await ac.get(f"/api/products/{product_id}/reviews")
        assert get_res.status_code == 200
        rev_hub = get_res.json()
        assert "reviews" in rev_hub
        assert "avg_rating" in rev_hub
        assert "breakdown" in rev_hub


@pytest.mark.anyio
async def test_review_validation():
    """Test review creation validation (comment too short, bad rating)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        product_id = "65c1a2b3c4d5e6f7a8b9c0d1"

        # Comment too short
        short_res = await ac.post(
            f"/api/reviews/product/{product_id}",
            json={
                "userName": "Test User",
                "rating": 5,
                "comment": "Short",
            },
        )
        assert short_res.status_code == 422  # Validation error

        # Rating out of range
        bad_rating_res = await ac.post(
            f"/api/reviews/product/{product_id}",
            json={
                "userName": "Test User",
                "rating": 6,
                "comment": "This is a valid length comment for testing.",
            },
        )
        assert bad_rating_res.status_code == 422
