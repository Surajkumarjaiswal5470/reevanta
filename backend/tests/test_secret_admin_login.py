import asyncio
from fastapi import Response
from models.auth import AdminSecretLoginRequest
from routers.auth import admin_secret_login
from pytest import raises
from fastapi import HTTPException

def test_admin_secret_login():
    async def run():
        res_mock = Response()
        
        # Test 1: Valid Secret Login (Name = spk, Secret Key = PHOENIX)
        succ = await admin_secret_login(AdminSecretLoginRequest(name="spk", secretKey="PHOENIX"), res_mock)
        assert succ["name"] == "spk"
        assert succ["role"] == "admin"
        assert "authenticated" in succ["message"].lower()

        # Test 2: Invalid Secret Key
        with raises(HTTPException) as exc:
            await admin_secret_login(AdminSecretLoginRequest(name="spk", secretKey="WRONG_KEY"), res_mock)
        assert exc.value.status_code == 401

        # Test 3: Invalid Admin Name
        with raises(HTTPException) as exc2:
            await admin_secret_login(AdminSecretLoginRequest(name="wrong_name", secretKey="PHOENIX"), res_mock)
        assert exc2.value.status_code == 401

    asyncio.run(run())
