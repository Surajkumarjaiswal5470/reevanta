import pytest
import requests
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL') or "http://localhost:8001").rstrip('/')

class TestAuthEndpoints:
    """Authentication endpoint tests for Lumière & Bazar"""

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
        # Check cookie was set
        assert "access_token" in api_client.cookies or "access_token" in response.cookies

    def test_login_invalid_credentials(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    def test_register_new_user(self, api_client):
        test_email = f"testuser_{os.urandom(4).hex()}@example.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "securepassword123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        assert data["name"] == "Test User"
        assert data["role"] == "user"
        assert "id" in data

    def test_get_me_authenticated(self, authenticated_client):
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "id" in data
        assert "password_hash" not in data

    def test_logout(self, authenticated_client):
        response = authenticated_client.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def auth_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.cookies.get("access_token")
    pytest.skip("Auth failed")

@pytest.fixture
def authenticated_client(api_client):
    # Login first
    res = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    assert res.status_code == 200
    return api_client
