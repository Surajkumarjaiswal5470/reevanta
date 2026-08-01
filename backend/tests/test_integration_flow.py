import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_end_to_end_customer_shopping_integration():
    """Full End-to-End Integration Flow Test."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        # Step 1: Health check
        health = await ac.get("/api/health")
        assert health.status_code in [200, 503]

        # Step 2: Browse catalog & filter by category
        catalog = await ac.get("/api/products?category=Sarees")
        assert catalog.status_code == 200
        products = catalog.json()
        assert "products" in products or isinstance(products, list)

        # Step 3: Fetch FAQs from customer support
        faqs = await ac.get("/api/support/faqs")
        assert faqs.status_code == 200
        assert len(faqs.json()) >= 5

        # Step 4: Submit Contact Query
        contact = await ac.post(
            "/api/support/contact",
            json={
                "name": "Riya Sharma",
                "email": "riya@example.com",
                "subject": "Bridal Lehenga Sizing",
                "message": "Interested in custom fittings."
            }
        )
        assert contact.status_code == 200
        assert "ticket_id" in contact.json()

        # Step 5: Unauthenticated invoice fetch returns 401
        order_id = "65c1a2b3c4d5e6f7a8b9c0d1"
        invoice = await ac.get(f"/api/orders/{order_id}/invoice")
        assert invoice.status_code == 401
