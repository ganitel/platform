"""
Ganitel V2 Backend - Notification Entity
"""
from enum import Enum

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.domain.entities.base import AuditableEntity


class NotificationType(str, Enum):
    """Notification type enumeration"""
    BOOKING = "booking"
    PAYMENT = "payment"
    REVIEW = "review"
    MESSAGE = "message"
    SYSTEM = "system"
    PROMOTION = "promotion"
    REMINDER = "reminder"


class NotificationChannel(str, Enum):
    """Notification channel enumeration"""
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    IN_APP = "in_app"


class Notification(AuditableEntity):
    """
    Notification entity for user notifications
    """
    __tablename__ = "notifications"

    # Relationships
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    related_entity_type = Column(String(50), nullable=True)  # booking, payment, etc.
    related_entity_id = Column(UUID(as_uuid=True), nullable=True)

    # Notification Information
    notification_type = Column(String(50), nullable=False, index=True)
    channel = Column(String(20), default=NotificationChannel.IN_APP.value, nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)  # Additional data

    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)

    # Action
    action_url = Column(String(500), nullable=True)
    action_label = Column(String(100), nullable=True)

    def mark_as_read(self):
        """Mark notification as read"""
        from datetime import datetime
        self.is_read = True
        self.read_at = datetime.utcnow()

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.notification_type})>"

