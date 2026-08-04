"""
Backend Test Suite for Security, Compliance & Audit Control Center
"""

import pytest
from httpx import AsyncClient, ASGITransport
from server import app


@pytest.mark.anyio
async def test_security_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Fetch admin login logs
        res_logs = await ac.get("/api/admin/security/login-logs")
        assert res_logs.status_code == 200
        logs = res_logs.json()
        assert isinstance(logs, list)

        # 2. Fetch IP Whitelist
        res_ip = await ac.get("/api/admin/security/ip-whitelist")
        assert res_ip.status_code == 200
        ips = res_ip.json()
        assert isinstance(ips, list)

        # 3. Create Database Backup Snapshot
        res_backup = await ac.post("/api/admin/security/backups/create", json={
            "backup_name": "Test Instant Backup"
        })
        assert res_backup.status_code == 200
        b_data = res_backup.json()
        assert "backup_name" in b_data

        # 4. Fetch System Audit Logs Stream
        res_audit = await ac.get("/api/admin/security/audit-logs")
        assert res_audit.status_code == 200
        audit = res_audit.json()
        assert isinstance(audit, list)

        # 5. Generate API Key
        res_key = await ac.post("/api/admin/security/api-keys", json={
            "key_name": "Test Key",
            "permissions": ["read_products"]
        })
        assert res_key.status_code == 200
        k_data = res_key.json()
        assert "secret_key_full" in k_data
