import asyncio
import os
import pytest

# Skip this entire test module if a MongoDB server is not available. This
# prevents connection errors during local development where the external
# database is unreachable.
if os.getenv("SKIP_DB_TESTS") == "1":
    pytest.skip("Skipping DB-dependent tests", allow_module_level=True)

import asyncio
from fastapi import Response
from models.auth import AdminSecretLoginRequest
from routers.auth import admin_secret_login
from pytest import raises
from fastapi import HTTPException

from fastapi import HTTPException
from fastapi import Response
from fastapi import status
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
from backend.core.config import MONGO_URL, DB_NAME
from backend.routers.auth import admin_secret_login, AdminSecretLoginRequest
from backend.core.security import create_access_token
from backend.core.security import create_refresh_token
from backend.core.security import get_password_hash
from backend.core.security import verify_password
from backend.core.security import verify_token
from backend.core.security import get_current_user
from backend.core.security import get_current_admin
from backend.core.security import get_current_user_or_admin
from backend.core.security import get_current_user_or_admin_or_none
from backend.core.security import get_current_user_or_none
from backend.core.security import get_current_admin_or_none

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
