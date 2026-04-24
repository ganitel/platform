"""
Ganitel V2 Backend - Proximity Entity
"""

from uuid import UUID

from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class Proximity(AuditableEntity):
    """
    Proximity entity for accessibility information about properties.
    Stores distances to nearby destinations and how to reach them.
    """

    __tablename__ = "proximities"

    # Relationships
    property_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True
    )

    # Proximity Information
    destination_name: Mapped[str] = mapped_column(String(100), nullable=False)
    minutes_away: Mapped[int] = mapped_column(Integer, nullable=False)
    travel_mode: Mapped[str] = mapped_column(String(50), nullable=False)

    # Create composite index for queries by property_id
    __table_args__ = (Index("ix_proximity_property_id", "property_id"),)

    def __repr__(self):
        return f"<Proximity(id={self.id}, property_id={self.property_id}, destination={self.destination_name})>"
