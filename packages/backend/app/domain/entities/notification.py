"""
Ganitel V2 Backend - Notification Entity
"""

from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class NotificationType(StrEnum):
    """Notification type enumeration"""

    BOOKING = "booking"
    PAYMENT = "payment"
    REVIEW = "review"
    MESSAGE = "message"
    SYSTEM = "system"
    PROMOTION = "promotion"
    REMINDER = "reminder"


class NotificationChannel(StrEnum):
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
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    related_entity_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # booking, payment, etc.
    related_entity_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), nullable=True
    )

    # Notification Information
    notification_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    channel: Mapped[str] = mapped_column(
        String(20), default=NotificationChannel.IN_APP.value, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Additional data

    # Status
    is_read: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Action
    action_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    action_label: Mapped[str | None] = mapped_column(String(100), nullable=True)

    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.read_at = datetime.now(UTC)

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.notification_type})>"
