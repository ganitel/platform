"""
Ganitel V2 Backend - Referral Entity
"""

from sqlalchemy import Boolean, Column, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID

from app.domain.entities.base import AuditableEntity


class Referral(AuditableEntity):
    """
    Referral entity for referral program
    """

    __tablename__ = "referrals"

    # Relationships
    referrer_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    referred_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Referral Information
    total_earned = Column(Numeric(10, 2), default=0.0, nullable=False)
    total_converted = Column(Numeric(10, 2), default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Referral(id={self.id}, referrer_id={self.referrer_id}, referred_user_id={self.referred_user_id})>"
