"""
Ganitel V2 Backend - Delete Property Use Case
"""
from uuid import UUID
from app.exceptions import GanitelException


class DeletePropertyUseCase:
    """Delete property use case"""

    def __init__(self, property_repository):
        self.property_repository = property_repository

    def execute(self, property_id: UUID, provider_id: UUID) -> None:
        """
        Delete a property (soft delete)
        """
        property = self.property_repository.get_by_id(property_id)
        
        if not property or property.deleted_at is not None:
            raise GanitelException(
                message="Property not found",
                status_code=404
            )
        
        # Check authorization
        if property.provider_id != provider_id:
            raise GanitelException(
                message="Unauthorized",
                status_code=403
            )
        
        # Delete property
        self.property_repository.delete(property_id)
