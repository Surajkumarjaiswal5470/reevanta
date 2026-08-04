"""
Notification & Operational Alerts Pydantic Schemas
Covers Order Notifications, Low Stock Alerts, Customer Messages, Return Requests, and Product Reviews.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict


class NotificationSchema(BaseModel):
    id: str
    type: str = Field("ORDER", pattern="^(ORDER|LOW_STOCK|CUSTOMER_MESSAGE|RETURN_REQUEST|REVIEW)$")
    title: str
    message: str
    resource_id: Optional[str] = None
    target_tab: Optional[str] = "orders"
    severity: str = Field("info", pattern="^(info|warning|error|success)$")
    is_read: bool = False
    created_at: str


class MarkReadRequest(BaseModel):
    notification_ids: Optional[List[str]] = Field(default_factory=list)
    mark_all: bool = False
