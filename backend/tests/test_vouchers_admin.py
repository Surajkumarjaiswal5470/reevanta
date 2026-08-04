"""
Backend Test Suite for Enterprise Coupons & Discounts Engine
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_vouchers_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch public active vouchers
        res_active = await ac.get("/api/vouchers/active")
        assert res_active.status_code == 200
        vouchers = res_active.json()
        assert isinstance(vouchers, list)

        # 2. Fetch admin vouchers
        res_admin = await ac.get("/api/admin/vouchers")
        assert res_admin.status_code == 200
        admin_vouchers = res_admin.json()
        assert isinstance(admin_vouchers, list)
        assert len(admin_vouchers) >= 1

        # 3. Fetch voucher analytics
        res_analytics = await ac.get("/api/admin/vouchers/analytics")
        assert res_analytics.status_code == 200
        an_data = res_analytics.json()
        assert "total_vouchers" in an_data
        assert "total_revenue_generated" in an_data

        # 4. Test apply voucher endpoint (percentage)
        res_apply = await ac.post("/api/vouchers/apply", json={
            "code": "ROYAL20",
            "cartTotal": 5000.0,
            "items": [{"productId": "p1", "category": "sarees", "price": 5000.0, "qty": 1}]
        })
        assert res_apply.status_code == 200
        app_data = res_apply.json()
        assert app_data["code"] == "ROYAL20"
        assert app_data["discountAmount"] > 0
