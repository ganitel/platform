"""
Ganitel V2 Backend - Notification API Schemas
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class NotificationResponse(BaseModel):
    """Notification response schema"""
    id: str
    user_id: str
    notification_type: str
    channel: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    read_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
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
    data: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None

