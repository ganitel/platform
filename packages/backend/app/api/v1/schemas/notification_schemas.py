"""
Ganitel V2 Backend - Notification API Schemas
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    """Notification response schema"""

    id: str
    user_id: str
    notification_type: str
    channel: str
    title: str
    message: str
    data: dict[str, Any] | None = None
    is_read: bool
    read_at: datetime | None = None
    sent_at: datetime | None = None
    action_url: str | None = None
    action_label: str | None = None
    related_entity_type: str | None = None
    related_entity_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreateRequest(BaseModel):
    """Create notification request schema"""

    user_id: str = Field(..., description="User ID")
    notification_type: str = Field(..., description="Notification type")
    title: str = Field(..., max_length=200, description="Notification title")
    message: str = Field(..., description="Notification message")
    channel: str = Field("in_app", description="Notification channel")
    data: dict[str, Any] | None = None
    action_url: str | None = None
    action_label: str | None = None
