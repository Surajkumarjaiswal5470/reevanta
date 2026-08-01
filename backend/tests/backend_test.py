"""Regression tests for authentication, products, address management, orders, and authorization."""

import os
import re
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

# Load environment variables from the project's frontend .env file.
# The original absolute path "/app/frontend/.env" does not exist in the local
# development environment, causing the REACT_APP_BACKEND_URL to be missing.
# Use a path relative to the repository root instead.
frontend_env = dotenv_values("frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing")


def load_admin_credentials():
    path = Path("/app/memory/test_credentials.md")
    if not path.exists():
        pytest.skip("Missing /app/memory/test_credentials.md")
    content = path.read_text(encoding="utf-8")
    admin_section = content.split("Test User Account", 1)[0]
    email = re.search(r"Email:\s*`([^`]+)`", admin_section)
    password = re.search(r"Password:\s*`([^`]+)`", admin_section)
    if not email or not password:
        pytest.skip("Admin email/password missing from test_credentials.md")
    return email.group(1), password.group(1)


def new_session():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def register_user(label):
    session = new_session()
    email = f"testuser+{label}-{uuid.uuid4().hex[:8]}@example.com"
    response = session.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": "password123", "name": f"TEST_{label}"},
        timeout=20,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["email"] == email
    assert data["role"] == "user"
    assert isinstance(data["id"], str) and data["id"]
    return session, data


@pytest.fixture(scope="module")
def context():
    admin_email, admin_password = load_admin_credentials()
    admin = new_session()
    login = admin.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": admin_email, "password": admin_password},
        timeout=20,
    )
    assert login.status_code == 200, login.text

    user_a, user_a_data = register_user("scope-a")
    user_b, user_b_data = register_user("scope-b")
    base_address = {
        "label": "Home",
        "phone": "9876543210",
        "line2": "QA Landmark",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560001",
        "country": "India",
        "lat": 12.9716,
        "lng": 77.5946,
        "isDefault": False,
    }
    address_a_response = user_a.post(
        f"{BASE_URL}/api/addresses",
        json={**base_address, "fullName": "TEST_User A", "line1": "TEST_A Line"},
        timeout=20,
    )
    address_b_response = user_b.post(
        f"{BASE_URL}/api/addresses",
        json={**base_address, "fullName": "TEST_User B", "line1": "TEST_B Line"},
        timeout=20,
    )
    assert address_a_response.status_code == address_b_response.status_code == 200
    state = {
        "admin": admin,
        "admin_login": login,
        "user_a": user_a,
        "user_b": user_b,
        "user_a_data": user_a_data,
        "user_b_data": user_b_data,
        "address_a": address_a_response.json(),
        "address_b": address_b_response.json(),
        "address_ids": [],
        "orders": {},
    }
    yield state

    for session in (user_a, user_b):
        try:
            addresses = session.get(f"{BASE_URL}/api/addresses", timeout=20).json()
            for address in addresses:
                if str(address.get("fullName", "")).startswith("TEST_"):
                    session.delete(f"{BASE_URL}/api/addresses/{address['id']}", timeout=20)
        except Exception:
            pass
    admin.close()
    user_a.close()
    user_b.close()


class TestAuthenticationAndSecurity:
    def test_admin_login_sets_secure_httponly_cookies(self, context):
        response = context["admin_login"]
        data = response.json()
        assert data["email"] == load_admin_credentials()[0]
        assert data["role"] == "admin"
        assert isinstance(data["id"], str) and data["id"]
        cookie_header = response.headers.get("set-cookie", "").lower()
        assert "access_token=" in cookie_header
        assert "refresh_token=" in cookie_header
        assert "httponly" in cookie_header
        assert "secure" in cookie_header
        assert "samesite=none" in cookie_header

    def test_auth_me_works_with_cookie(self, context):
        response = context["admin"].get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == load_admin_credentials()[0]
        assert data["role"] == "admin"
        assert "password_hash" not in data

    @pytest.mark.parametrize(
        ("method", "path", "payload"),
        [
            ("get", "/api/addresses", None),
            ("post", "/api/addresses", {"fullName": "TEST_X", "phone": "1", "line1": "x", "city": "x", "pincode": "1"}),
            ("get", "/api/orders/mine", None),
            ("get", "/api/orders", None),
            ("post", "/api/orders", {"items": [], "subtotal": 0, "total": 0, "address": {}}),
            ("post", "/api/products", {}),
        ],
    )
    def test_protected_endpoints_reject_unauthenticated(self, method, path, payload):
        response = requests.request(method, f"{BASE_URL}{path}", json=payload, timeout=20)
        assert response.status_code == 401, response.text
        assert response.json()["detail"] == "Not authenticated"

    def test_credentialed_cors_uses_explicit_origin(self):
        origin = "https://qa-client.example.com"
        email, password = load_admin_credentials()
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            headers={"Origin": origin, "Content-Type": "application/json"},
            json={"email": email, "password": password},
            timeout=20,
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-credentials") == "true"
        assert response.headers.get("access-control-allow-origin") == origin

    def test_brute_force_lockout_after_five_failures(self):
        session, data = register_user("lockout")
        statuses = []
        for _ in range(6):
            response = session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": data["email"], "password": "definitely-wrong"},
                timeout=20,
            )
            statuses.append(response.status_code)
        assert statuses[4] == 429 or statuses[5] == 429, f"No lockout after six attempts: {statuses}"


class TestProducts:
    def test_products_are_seeded_with_required_fields(self):
        response = requests.get(f"{BASE_URL}/api/products", timeout=20)
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list) and len(products) >= 12
        for product in products[:12]:
            assert isinstance(product["id"], str) and product["id"]
            assert product["name"]
            assert product["category"] in {"clothes", "shoes", "makeup", "accessories"}
            assert isinstance(product["image"], str) and product["image"].startswith("http")
            assert isinstance(product["tags"], list) and product["tags"]
            assert "_id" not in product

    def test_category_filter(self):
        response = requests.get(f"{BASE_URL}/api/products", params={"category": "makeup"}, timeout=20)
        assert response.status_code == 200
        products = response.json()
        assert products and all(p["category"] == "makeup" for p in products)

    def test_query_search(self):
        response = requests.get(f"{BASE_URL}/api/products", params={"q": "lipstick"}, timeout=20)
        assert response.status_code == 200
        products = response.json()
        assert products
        assert all("lipstick" in " ".join([p["name"], p.get("brand", ""), p.get("description", ""), *p.get("tags", [])]).lower() for p in products)

    def test_search_suggestions_are_limited_and_matching(self):
        response = requests.get(f"{BASE_URL}/api/products/search-suggest", params={"q": "hoodie"}, timeout=20)
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list) and 1 <= len(products) <= 6
        assert any("hoodie" in (p["name"] + " " + " ".join(p.get("tags", []))).lower() for p in products)

    def test_invalid_product_id_returns_404_not_server_error(self):
        response = requests.get(f"{BASE_URL}/api/products/not-an-object-id", timeout=20)
        assert response.status_code == 404, response.text
        assert response.json()["detail"] == "Not found"

    def test_malformed_product_delete_returns_404(self, context):
        response = context["admin"].delete(f"{BASE_URL}/api/products/not-an-object-id", timeout=20)
        assert response.status_code == 404, response.text
        assert response.json()["detail"] == "Not found"


class TestAddresses:
    @staticmethod
    def payload(name, line, default=False):
        return {
            "label": "Home",
            "fullName": name,
            "phone": "9876543210",
            "line1": line,
            "line2": "QA Landmark",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001",
            "country": "India",
            "lat": 12.9716,
            "lng": 77.5946,
            "isDefault": default,
        }

    def test_first_address_auto_default_and_user_scope(self, context):
        address_a, address_b = context["address_a"], context["address_b"]
        assert address_a["isDefault"] is True
        assert address_b["isDefault"] is True

        list_a = context["user_a"].get(f"{BASE_URL}/api/addresses", timeout=20).json()
        list_b = context["user_b"].get(f"{BASE_URL}/api/addresses", timeout=20).json()
        assert address_a["id"] in {a["id"] for a in list_a}
        assert address_b["id"] not in {a["id"] for a in list_a}
        assert address_b["id"] in {a["id"] for a in list_b}
        assert all(a["user_id"] == context["user_a_data"]["id"] for a in list_a)

    def test_set_default_unsets_other_address(self, context):
        response = context["user_a"].post(
            f"{BASE_URL}/api/addresses", json=self.payload("TEST_User A Second", "TEST_A2 Line"), timeout=20
        )
        assert response.status_code == 200
        second = response.json()
        context["address_a_second"] = second
        assert second["isDefault"] is False

        updated = context["user_a"].patch(f"{BASE_URL}/api/addresses/{second['id']}/default", timeout=20)
        assert updated.status_code == 200
        addresses = context["user_a"].get(f"{BASE_URL}/api/addresses", timeout=20).json()
        defaults = [a for a in addresses if a["isDefault"]]
        assert len(defaults) == 1
        assert defaults[0]["id"] == second["id"]

    def test_foreign_default_request_does_not_clear_own_default(self, context):
        response = context["user_b"].patch(
            f"{BASE_URL}/api/addresses/{context['address_a']['id']}/default", timeout=20
        )
        assert response.status_code == 404
        addresses = context["user_b"].get(f"{BASE_URL}/api/addresses", timeout=20).json()
        own_default_preserved = any(a["id"] == context["address_b"]["id"] and a["isDefault"] for a in addresses)
        if not own_default_preserved:
            context["user_b"].patch(f"{BASE_URL}/api/addresses/{context['address_b']['id']}/default", timeout=20)
        assert own_default_preserved, "A failed foreign-ID request cleared the current user's default address"

    def test_nonexistent_default_request_does_not_clear_own_default(self, context):
        missing_id = "000000000000000000000000"
        before = context["user_b"].get(f"{BASE_URL}/api/addresses", timeout=20).json()
        default_before = next(a for a in before if a["isDefault"])

        response = context["user_b"].patch(f"{BASE_URL}/api/addresses/{missing_id}/default", timeout=20)
        assert response.status_code == 404, response.text
        assert response.json()["detail"] == "Address not found"

        after = context["user_b"].get(f"{BASE_URL}/api/addresses", timeout=20).json()
        defaults_after = [a for a in after if a["isDefault"]]
        assert len(defaults_after) == 1
        assert defaults_after[0]["id"] == default_before["id"]

    @pytest.mark.parametrize("operation", ["delete", "default"])
    def test_malformed_address_id_returns_404(self, context, operation):
        path = f"/api/addresses/not-an-object-id" + ("/default" if operation == "default" else "")
        method = context["user_a"].patch if operation == "default" else context["user_a"].delete
        response = method(f"{BASE_URL}{path}", timeout=20)
        assert response.status_code == 404, response.text
        assert response.json()["detail"] == "Not found"

    def test_delete_address_and_verify_removal(self, context):
        second_id = context["address_a_second"]["id"]
        response = context["user_a"].delete(f"{BASE_URL}/api/addresses/{second_id}", timeout=20)
        assert response.status_code == 200
        assert response.json()["message"] == "Address deleted"
        addresses = context["user_a"].get(f"{BASE_URL}/api/addresses", timeout=20).json()
        assert second_id not in {a["id"] for a in addresses}


class TestOrdersAndAuthorization:
    @staticmethod
    def order_payload(address, suffix):
        return {
            "items": [{"productId": None, "name": f"TEST_Order Item {suffix}", "price": 699, "qty": 1, "image": "", "selectedSize": "Standard", "selectedColor": "#000000"}],
            "subtotal": 699,
            "shipping": 0,
            "total": 699,
            "address": address,
            "paymentMethod": "COD",
            "notes": "TEST_order",
        }

    def test_create_order_and_mine_timeline(self, context):
        response = context["user_a"].post(
            f"{BASE_URL}/api/orders", json=self.order_payload(context["address_a"], "main"), timeout=20
        )
        assert response.status_code == 200, response.text
        order = response.json()
        context["orders"]["main"] = order
        assert isinstance(order["id"], str) and order["id"]
        assert order["order_number"].startswith("LB-")
        assert order["status"] == "Order Placed"
        assert order["paymentMethod"] == "COD"
        assert order["total"] == 699
        assert len(order["timeline"]) == 5
        assert [step["status"] for step in order["timeline"]] == ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered"]
        assert order["timeline"][0]["completed"] is True

        mine = context["user_a"].get(f"{BASE_URL}/api/orders/mine", timeout=20)
        assert mine.status_code == 200
        fetched = next(o for o in mine.json() if o["id"] == order["id"])
        assert fetched["user_id"] == context["user_a_data"]["id"]
        assert len(fetched["timeline"]) == 5
        other_mine = context["user_b"].get(f"{BASE_URL}/api/orders/mine", timeout=20).json()
        assert order["id"] not in {o["id"] for o in other_mine}

    def test_non_admin_forbidden_from_admin_operations(self, context):
        product_payload = {
            "name": "TEST_Unauthorized Product", "category": "clothes", "brand": "TEST", "price": 1,
            "originalPrice": 2, "image": "https://example.com/test.jpg", "sizes": ["S"], "colors": ["#000000"],
            "description": "TEST unauthorized", "tags": ["test"]
        }
        create_product = context["user_a"].post(f"{BASE_URL}/api/products", json=product_payload, timeout=20)
        admin_orders = context["user_a"].get(f"{BASE_URL}/api/orders", timeout=20)
        patch_status = context["user_a"].patch(
            f"{BASE_URL}/api/orders/{context['orders']['main']['id']}/status", json={"status": "Packed"}, timeout=20
        )
        for response in (create_product, admin_orders, patch_status):
            assert response.status_code == 403, response.text
            assert "Admin" in response.json()["detail"]

    def test_admin_status_updates_invalid_rejected_and_cancel_blocked(self, context):
        order_id = context["orders"]["main"]["id"]
        invalid = context["admin"].patch(
            f"{BASE_URL}/api/orders/{order_id}/status", json={"status": "Flying"}, timeout=20
        )
        assert invalid.status_code == 400
        assert "Status must be one of" in invalid.json()["detail"]

        for status in ("Packed", "Shipped", "Out for Delivery", "Delivered"):
            response = context["admin"].patch(
                f"{BASE_URL}/api/orders/{order_id}/status", json={"status": status}, timeout=20
            )
            assert response.status_code == 200
            assert response.json()["status"] == status
            fetched = context["user_a"].get(f"{BASE_URL}/api/orders/{order_id}", timeout=20).json()
            assert fetched["status"] == status
            assert len(fetched["timeline"]) == 5
            if status in {"Shipped", "Out for Delivery", "Delivered"}:
                cancel = context["user_a"].post(f"{BASE_URL}/api/orders/{order_id}/cancel", timeout=20)
                assert cancel.status_code == 400
                assert "already shipped" in cancel.json()["detail"]

    def test_owner_can_cancel_unshipped_order(self, context):
        created = context["user_a"].post(
            f"{BASE_URL}/api/orders", json=self.order_payload(context["address_a"], "cancel"), timeout=20
        )
        assert created.status_code == 200
        order = created.json()
        context["orders"]["cancel"] = order
        cancelled = context["user_a"].post(f"{BASE_URL}/api/orders/{order['id']}/cancel", timeout=20)
        assert cancelled.status_code == 200
        assert cancelled.json()["message"] == "Order cancelled"
        fetched = context["user_a"].get(f"{BASE_URL}/api/orders/{order['id']}", timeout=20).json()
        assert fetched["status"] == "Cancelled"

    def test_status_update_missing_order_returns_404(self, context):
        missing_id = "000000000000000000000000"
        response = context["admin"].patch(
            f"{BASE_URL}/api/orders/{missing_id}/status", json={"status": "Packed"}, timeout=20
        )
        assert response.status_code == 404, response.text
        assert response.json()["detail"] == "Order not found"

    @pytest.mark.parametrize("operation", ["get", "status", "cancel"])
    def test_malformed_order_id_returns_404(self, context, operation):
        url = f"{BASE_URL}/api/orders/not-an-object-id"
        if operation == "get":
            response = context["user_a"].get(url, timeout=20)
        elif operation == "status":
            response = context["admin"].patch(f"{url}/status", json={"status": "Packed"}, timeout=20)
        else:
            response = context["user_a"].post(f"{url}/cancel", timeout=20)
        assert response.status_code == 404, response.text
        assert response.json()["detail"] == "Not found"
