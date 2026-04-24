"""
Ganitel V2 Backend - Complaint Entity
"""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class ComplaintStatus(StrEnum):
    """Complaint status enumeration"""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REJECTED = "rejected"


class ComplaintPriority(StrEnum):
    """Complaint priority enumeration"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Complaint(AuditableEntity):
    """
    Complaint entity for user complaints
    """

    __tablename__ = "complaints"

    # Relationships
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    booking_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True, index=True
    )
    service_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("services.id"), nullable=True, index=True
    )
    assigned_to_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )

    # Complaint Information
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # booking, payment, service, other

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default=ComplaintStatus.PENDING.value, nullable=False, index=True
    )
    priority: Mapped[str] = mapped_column(
        String(20), default=ComplaintPriority.MEDIUM.value, nullable=False
    )

    # Resolution
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolved_by_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    def __repr__(self):
        return (
            f"<Complaint(id={self.id}, user_id={self.user_id}, status={self.status})>"
        )
