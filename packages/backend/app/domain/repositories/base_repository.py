"""
Ganitel V2 Backend - Base Repository Interface
"""

from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar
from uuid import UUID

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Base repository interface defining common CRUD operations
    """

    @abstractmethod
    def create(self, entity: T) -> T:
        """Create a new entity"""
        pass

    @abstractmethod
    def get_by_id(self, entity_id: UUID) -> T | None:
        """Get entity by ID"""
        pass

    @abstractmethod
    def get_all(self, skip: int = 0, limit: int = 100) -> list[T]:
        """Get all entities with pagination"""
        pass

    @abstractmethod
    def update(self, entity: T) -> T:
        """Update an existing entity"""
        pass

    @abstractmethod
    def delete(self, entity_id: UUID) -> bool:
        """Delete an entity (hard delete)"""
        pass

    @abstractmethod
    def soft_delete(self, entity_id: UUID) -> bool:
        """Soft delete an entity"""
        pass

    @abstractmethod
    def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count entities with optional filters"""
        pass

    @abstractmethod
    def exists(self, entity_id: UUID) -> bool:
        """Check if entity exists"""
        pass

    @abstractmethod
    def find_by_criteria(
        self, criteria: dict[str, Any], skip: int = 0, limit: int = 100
    ) -> list[T]:
        """Find entities by criteria"""
        pass
