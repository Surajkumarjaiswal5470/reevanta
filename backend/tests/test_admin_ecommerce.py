import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestAdminEcommerce:
    """Test Suite for Admin Panel, Products CRUD, and Orders status updates"""

    def test_admin_login(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@example.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@example.com"
        assert data["role"] == "admin"
        assert "id" in data

    def test_non_admin_cannot_create_product(self, api_client):
        # Login as regular user first or create one
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": "TEST_reg_user@example.com",
            "password": "password123",
            "name": "Regular User"
        })
        # If user already registered, login
        if reg_response.status_code == 400:
            login_res = api_client.post(f"{BASE_URL}/api/auth/login", json={
                "email": "TEST_reg_user@example.com",
                "password": "password123"
            })
            assert login_res.status_code == 200

        # Try to create product as non-admin
        prod_payload = {
            "name": "TEST_Hacked Product",
            "category": "clothes",
            "brand": "TestBrand",
            "price": 500,
            "originalPrice": 1000,
            "image": "https://images.pexels.com/photos/1066171/pexels-photo-1066171.jpeg",
            "sizes": ["S", "M"],
            "colors": ["#000"],
            "description": "Unauthorized product creation test"
        }
        res = api_client.post(f"{BASE_URL}/api/products", json=prod_payload)
        assert res.status_code == 403

    def test_admin_product_crud_and_order_status(self, api_client):
        # 1. Login as admin
        login_res = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@example.com",
            "password": "admin123"
        })
        assert login_res.status_code == 200

        # 2. Create Product as Admin
        prod_payload = {
            "name": "TEST_Admin Jacket",
            "category": "clothes",
            "brand": "Lumiere Luxe",
            "price": 1499,
            "originalPrice": 2999,
            "image": "https://images.pexels.com/photos/1066171/pexels-photo-1066171.jpeg",
            "sizes": ["S", "M", "L"],
            "colors": ["#282C3F"],
            "description": "Luxury tested jacket"
        }
        create_res = api_client.post(f"{BASE_URL}/api/products", json=prod_payload)
        assert create_res.status_code == 200
        created_prod = create_res.json()
        assert created_prod["name"] == "TEST_Admin Jacket"
        assert "id" in created_prod
        prod_id = created_prod["id"]

        # 3. Get products and verify persistence
        get_prod_res = api_client.get(f"{BASE_URL}/api/products")
        assert get_prod_res.status_code == 200
        products = get_prod_res.json()
        assert any(p["id"] == prod_id for p in products)

        # 4. Create an order as regular user or admin
        order_payload = {
            "items": [{"name": "TEST_Admin Jacket", "qty": 1, "price": 1499}],
            "total": 1499,
            "shippingDetails": {"name": "Test Buyer", "address": "123 Main St"},
            "payment": "COD"
        }
        order_res = api_client.post(f"{BASE_URL}/api/orders", json=order_payload)
        assert order_res.status_code == 200
        order_data = order_res.json()
        assert "id" in order_data
        order_id = order_data["id"]

        # 5. Get orders as admin
        orders_get_res = api_client.get(f"{BASE_URL}/api/orders")
        assert orders_get_res.status_code == 200
        orders_list = orders_get_res.json()
        assert any(o["id"] == order_id for o in orders_list)

        # 6. Update order status as admin
        status_res = api_client.patch(f"{BASE_URL}/api/orders/{order_id}/status", json={"status": "Out for Delivery"})
        assert status_res.status_code == 200

        # 7. Delete test product as admin
        del_res = api_client.delete(f"{BASE_URL}/api/products/{prod_id}")
        assert del_res.status_code == 200

@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session
