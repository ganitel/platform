"""
Ganitel V2 Backend - View Tracking Entity
"""

from enum import StrEnum
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class ViewType(StrEnum):
    """View type enumeration"""

    SERVICE = "service"
    PROFILE = "profile"
    POST = "post"
    PAGE = "page"


class ViewTracking(AuditableEntity):
    """
    View Tracking entity for analytics
    """

    __tablename__ = "view_trackings"

    # Relationships
    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )  # Nullable for anonymous views
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), nullable=False, index=True
    )

    # View Information
    view_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Duration (in seconds, if tracked)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)

    def __repr__(self):
        return f"<ViewTracking(id={self.id}, entity_type={self.entity_type}, view_type={self.view_type})>"
