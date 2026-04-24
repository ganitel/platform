"""
Ganitel V2 Backend - Proximity Entity
"""
from sqlalchemy import Column, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as pgUUID

from app.domain.entities.base import AuditableEntity


class Proximity(AuditableEntity):
    """
    Proximity entity for accessibility information about properties.
    Stores distances to nearby destinations and how to reach them.
    """

    __tablename__ = "proximities"

    # Relationships
    property_id = Column(pgUUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True)

    # Proximity Information
    destination_name = Column(String(100), nullable=False)
    minutes_away = Column(Integer, nullable=False)
    travel_mode = Column(String(50), nullable=False)

    # Create composite index for queries by property_id
    __table_args__ = (
        Index("ix_proximity_property_id", "property_id"),
    )

    def __repr__(self):
        return f"<Proximity(id={self.id}, property_id={self.property_id}, destination={self.destination_name})>"
