"""
Ganitel V2 Backend - Policy Entity
"""

from enum import StrEnum

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class PolicyType(StrEnum):
    """Policy type enumeration"""

    TERMS = "terms"
    PRIVACY = "privacy"
    REFUND = "refund"
    CANCELLATION = "cancellation"
    COMMUNITY = "community"
    OTHER = "other"


class Policy(AuditableEntity, SoftDeleteEntity):
    """
    Policy entity for platform policies
    """

    __tablename__ = "policies"

    # Basic Information
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    policy_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    slug: Mapped[str | None] = mapped_column(
        String(250), unique=True, index=True, nullable=True
    )

    # Display
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Version
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)

    def __repr__(self):
        return f"<Policy(id={self.id}, title={self.title}, type={self.policy_type})>"
