"""
Ganitel V2 Backend - Get Property Use Case
"""
from uuid import UUID
from app.domain.entities.property import Property
from app.exceptions import GanitelException


class GetPropertyUseCase:
    """Get property use case"""

    def __init__(self, property_repository):
        self.property_repository = property_repository

    def execute(self, property_id: UUID) -> Property:
        """
        Get a property by ID
        """
        property = self.property_repository.get_by_id(property_id)
        
        if not property or property.deleted_at is not None:
            raise GanitelException(
                message="Property not found",
                status_code=404
            )
        
        return property
