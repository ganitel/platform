"""
Ganitel V2 Backend - Update Property Use Case
"""
from uuid import UUID
from typing import Optional, Dict, Any
from app.domain.entities.property import Property
from app.exceptions import GanitelException


class UpdatePropertyUseCase:
    """Update property use case"""

    def __init__(self, property_repository, location_repository, property_type_repository):
        self.property_repository = property_repository
        self.location_repository = location_repository
        self.property_type_repository = property_type_repository

    def execute(
        self,
        property_id: UUID,
        provider_id: UUID,
        updates: Dict[str, Any]
    ) -> Property:
        """
        Update a property
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

        # Validate location if provided
        if "location_id" in updates:
            location = self.location_repository.get_by_id(updates["location_id"])
            if not location or location.deleted_at is not None:
                raise GanitelException(
                    message="Invalid location",
                    status_code=400
                )

        # Validate property type if provided
        if "property_type_id" in updates:
            property_type = self.property_type_repository.get_by_id(updates["property_type_id"])
            if not property_type or property_type.deleted_at is not None:
                raise GanitelException(
                    message="Invalid property type",
                    status_code=400
                )

        # Update property
        return self.property_repository.update(property_id, updates)
