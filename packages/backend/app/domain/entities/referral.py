"""
Ganitel V2 Backend - Referral Entity
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class Referral(AuditableEntity):
    """
    Referral entity for referral program
    """

    __tablename__ = "referrals"

    # Relationships
    referrer_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    referred_user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Referral Information
    total_earned: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )
    total_converted: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Referral(id={self.id}, referrer_id={self.referrer_id}, referred_user_id={self.referred_user_id})>"
