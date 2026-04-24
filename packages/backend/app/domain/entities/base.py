"""
Ganitel V2 Backend - Base Entity Classes
"""

import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, mapped_column

Base = declarative_base()


class BaseEntity(Base):
    """
    Base entity class with common fields
    """

    __abstract__ = True

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def to_dict(self):
        """Convert entity to dictionary"""
        return {
            column.name: getattr(self, column.name) for column in self.__table__.columns
        }

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"


class AuditableEntity(BaseEntity):
    """
    Auditable entity with created_by and updated_by fields
    """

    __abstract__ = True

    created_by: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    updated_by: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)


class SoftDeleteEntity:
    """
    Soft delete mixin (not inheriting from BaseEntity to avoid diamond inheritance)
    """

    __abstract__ = True

    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    deleted_by: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self, deleted_by_id=None):
        """Mark entity as deleted"""
        self.deleted_at = datetime.utcnow()
        self.deleted_by = deleted_by_id
        self.is_active = False

    def restore(self):
        """Restore soft deleted entity"""
        self.deleted_at = None
        self.deleted_by = None
        self.is_active = True
