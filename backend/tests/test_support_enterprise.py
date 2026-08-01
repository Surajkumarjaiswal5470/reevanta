import pytest
from httpx import AsyncClient, ASGITransport
from server import app

@pytest.mark.anyio
async def test_customer_support_enterprise_suite():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Contact Us Submission
        contact_res = await ac.post(
            "/api/support/contact",
            json={
                "name": "Anjali Shrestha",
                "email": "anjali@example.com",
                "phone": "+977 9801234567",
                "subject": "Custom Bridal Sizing Inquiry",
                "message": "Hi, I would like to inquire about custom organza saree fittings for my wedding in Kathmandu."
            }
        )
        assert contact_res.status_code == 200
        assert "ticket_id" in contact_res.json()

        # 2. FAQs Fetching
        faq_res = await ac.get("/api/support/faqs")
        assert faq_res.status_code == 200
        faqs = faq_res.json()
        assert isinstance(faqs, list)
        assert len(faqs) >= 5

        # 3. Unauthenticated Ticket Raising Rejection
        ticket_res = await ac.post(
            "/api/support/tickets",
            json={
                "category": "Order Status",
                "subject": "Delay in delivery",
                "description": "My order was supposed to arrive yesterday."
            }
        )
        assert ticket_res.status_code == 401

        # 4. Unauthenticated User Tickets Fetching Rejection
        my_tickets = await ac.get("/api/support/tickets/mine")
        assert my_tickets.status_code == 401
