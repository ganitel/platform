"""
Ganitel V2 Backend - Wishlist Entity
"""

from uuid import UUID

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class Wishlist(AuditableEntity):
    """
    Wishlist entity for user favorite services
    """

    __tablename__ = "wishlists"
    __table_args__ = (
        UniqueConstraint("user_id", "service_id", name="uq_wishlist_one_per_user"),
    )

    # Relationships
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    service_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True
    )

    def __repr__(self):
        return f"<Wishlist(id={self.id}, user_id={self.user_id}, service_id={self.service_id})>"
