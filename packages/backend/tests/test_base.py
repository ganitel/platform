"""
Ganitel V2 Backend - Test Base Classes (SQLite compatible)
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.ext.declarative import declarative_base

# Base for tests (SQLite compatible - UUID as String)
TestingBase = declarative_base()

class BaseEntityForTesting(TestingBase):
    """
    Base entity for tests (SQLite compatible)
    Uses String for UUID instead of PostgreSQL UUID type
    """
    __abstract__ = True

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def to_dict(self):
        """Convert entity to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"

class AuditableEntityForTesting(BaseEntityForTesting):
    """Auditable entity for tests"""
    __abstract__ = True

    created_by = Column(String(36), nullable=True)
    updated_by = Column(String(36), nullable=True)

class SoftDeleteEntityForTesting(BaseEntityForTesting):
    """Soft delete entity for tests"""
    __abstract__ = True

    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(36), nullable=True)

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

