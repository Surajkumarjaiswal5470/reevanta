"""
Security, Compliance & Audit Control Pydantic Schemas
Covers Admin Login Logs, Failed Login Attempts, IP Whitelisting, Database Backups, System Audit Logs, Active Sessions, and API Keys.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict


class LoginLogSchema(BaseModel):
    id: Optional[str] = None
    email: str
    ip_address: str
    user_agent: Optional[str] = ""
    status: str = Field("SUCCESS", pattern="^(SUCCESS|FAILED_PASSWORD|FAILED_OTP|BLOCKED_IP)$")
    reason: Optional[str] = ""
    timestamp: str


class IPWhitelistCreate(BaseModel):
    ip_address: str = Field(..., examples=["103.10.28.15", "192.168.1.0/24"])
    label: str = Field("Kathmandu HQ Studio IP", examples=["Kathmandu HQ Studio IP"])
    is_active: bool = True


class BackupCreateRequest(BaseModel):
    backup_name: Optional[str] = "Manual System Snapshot"
    include_collections: List[str] = Field(default_factory=lambda: ["products", "orders", "users", "vouchers", "cms", "shipping_zones"])


class APIKeyCreate(BaseModel):
    key_name: str = Field(..., min_length=2, max_length=100, examples=["ERP Sync Service Key"])
    permissions: List[str] = Field(default_factory=lambda: ["read_products", "manage_orders"])
