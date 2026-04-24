"""
Ganitel V2 Backend - View Tracking Entity
"""

from enum import StrEnum

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

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
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )  # Nullable for anonymous views
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # View Information
    view_type = Column(String(20), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    referrer = Column(String(500), nullable=True)

    # Duration (in seconds, if tracked)
    duration = Column(Integer, nullable=True)

    def __repr__(self):
        return f"<ViewTracking(id={self.id}, entity_type={self.entity_type}, view_type={self.view_type})>"
