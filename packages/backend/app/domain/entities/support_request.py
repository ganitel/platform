"""
Ganitel V2 Backend - Support Request Entity
"""
from enum import Enum

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.domain.entities.base import AuditableEntity


class SupportRequestStatus(str, Enum):
    """Support request status enumeration"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SupportRequestPriority(str, Enum):
    """Support request priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class SupportRequest(AuditableEntity):
    """
    Support Request entity for customer support
    """
    __tablename__ = "support_requests"

    # Relationships
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Request Information
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)

    # Status
    status = Column(String(20), default=SupportRequestStatus.OPEN.value, nullable=False, index=True)
    priority = Column(String(20), default=SupportRequestPriority.MEDIUM.value, nullable=False)

    # Resolution
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    def __repr__(self):
        return f"<SupportRequest(id={self.id}, subject={self.subject}, status={self.status})>"

