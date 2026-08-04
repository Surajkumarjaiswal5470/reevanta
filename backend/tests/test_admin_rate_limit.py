"""
Backend Test Suite for Secret Admin Gateway & IP Rate Limiting Engine
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_admin_secret_login_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Valid Admin Secret Login
        res_valid = await ac.post("/api/auth/admin-secret-login", json={
            "name": "spk",
            "secretKey": "PHOENIX",
            "gatewayKey": "vault-spk-9981"
        })
        assert res_valid.status_code == 200
        data = res_valid.json()
        assert "token" in data
        assert data["name"] == "spk"

        # 2. Invalid Gateway Key Rejection
        res_invalid_gw = await ac.post("/api/auth/admin-secret-login", json={
            "name": "spk",
            "secretKey": "PHOENIX",
            "gatewayKey": "wrong-gateway-key"
        })
        assert res_invalid_gw.status_code == 401

        # 3. Test Invalid Credentials Rejection
        res_invalid_cred = await ac.post("/api/auth/admin-secret-login", json={
            "name": "spk",
            "secretKey": "WRONG_SECRET",
            "gatewayKey": "vault-spk-9981"
        })
        assert res_invalid_cred.status_code == 401
