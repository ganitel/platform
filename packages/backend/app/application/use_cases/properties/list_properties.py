"""
Ganitel V2 Backend - List Properties Use Case
"""

from typing import Any
from uuid import UUID


class ListPropertiesUseCase:
    """List properties use case"""

    def __init__(self, property_repository):
        self.property_repository = property_repository

    def execute(
        self,
        skip: int = 0,
        limit: int = 20,
        provider_id: UUID | None = None,
        location_id: UUID | None = None,
        property_type_id: UUID | None = None,
    ) -> dict[str, Any]:
        """
        List properties with optional filters
        """
        criteria = {}

        if provider_id:
            criteria["provider_id"] = provider_id
        if location_id:
            criteria["location_id"] = location_id
        if property_type_id:
            criteria["property_type_id"] = property_type_id

        # Get properties
        properties = self.property_repository.find_by_criteria(
            criteria, skip=skip, limit=limit
        )

        # Count total
        total = self.property_repository.count(criteria)

        return {
            "properties": properties,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
