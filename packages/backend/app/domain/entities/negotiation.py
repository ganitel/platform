"""
Ganitel V2 Backend - Negotiation Entity
"""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class NegotiationStatus(StrEnum):
    """Negotiation status enumeration"""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COUNTERED = "countered"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Negotiation(AuditableEntity):
    """
    Negotiation entity for booking price negotiations
    """

    __tablename__ = "negotiations"

    # Relationships
    booking_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, index=True
    )
    service_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )  # Traveler
    provider_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )  # Provider

    # Negotiation Information
    original_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    proposed_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="XAF", nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=NegotiationStatus.PENDING.value, nullable=False, index=True
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Counter offer
    counter_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    counter_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Expiry
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Negotiation(id={self.id}, booking_id={self.booking_id}, status={self.status})>"
