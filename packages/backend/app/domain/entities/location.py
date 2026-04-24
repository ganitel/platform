"""
Ganitel V2 Backend - Location Entity
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class Location(AuditableEntity, SoftDeleteEntity):
    """
    Location entity for normalized geographic data
    """

    __tablename__ = "locations"

    name: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True, unique=True
    )
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)

    def __repr__(self):
        return f"<Location(id={self.id}, name={self.name})>"
