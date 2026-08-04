"""
Backend Test Suite for Shipping & Logistics Management Suite
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from httpx import AsyncClient, ASGITransport
from server import app
from core.security import get_current_admin, get_current_user


@pytest.fixture(autouse=True)
def override_admin():
    app.dependency_overrides[get_current_admin] = lambda: {"_id": "admin123", "email": "admin@therivaanta.com", "role": "admin"}
    app.dependency_overrides[get_current_user] = lambda: {"_id": "admin123", "email": "admin@therivaanta.com", "role": "admin"}
    yield
    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_shipping_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Test public rate calculation endpoint
        res_calc = await ac.post("/api/shipping/calculate", json={
            "destination_city": "Kathmandu",
            "destination_country": "Nepal",
            "cart_total": 2000.0,
            "total_weight_kg": 1.5
        })
        assert res_calc.status_code == 200
        calc_data = res_calc.json()
        assert "available_methods" in calc_data
        assert calc_data["is_free_shipping_applied"] is True

        # 2. Test admin shipping zones listing
        res_zones = await ac.get("/api/admin/shipping/zones")
        assert res_zones.status_code == 200
        zones = res_zones.json()
        assert isinstance(zones, list)
        assert len(zones) >= 1

        # 3. Test admin couriers listing
        res_couriers = await ac.get("/api/admin/shipping/couriers")
        assert res_couriers.status_code == 200
        couriers = res_couriers.json()
        assert isinstance(couriers, list)
        assert len(couriers) >= 1
