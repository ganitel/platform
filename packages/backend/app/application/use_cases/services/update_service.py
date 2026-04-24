"""
Ganitel V2 Backend - Update Service Use Case
"""
from uuid import UUID

from app.domain.entities.service import Service, ServiceStatus
from app.domain.repositories.service_repository import IServiceRepository
from app.exceptions import AuthorizationError, ServiceNotFoundError, ValidationError


class UpdateServiceUseCase:
    """Use case responsible for updating listing/service details"""

    def __init__(self, service_repository: IServiceRepository):
        self.service_repository = service_repository

    def execute(
        self,
        service_id: UUID,
        provider_id: UUID,
        updates: dict,
    ) -> Service:
        service = self.service_repository.get_by_id(service_id)
        if not service:
            raise ServiceNotFoundError()

        if service.provider_id != provider_id:
            raise AuthorizationError("You can only update your own listings")

        self._validate_updates(updates, service)

        for key, value in updates.items():
            if hasattr(service, key) and value is not None:
                setattr(service, key, value)

        if "title" in updates and updates["title"]:
            service.generate_slug()
            if self.service_repository.slug_exists(service.slug, exclude_service_id=service.id):
                service.slug = f"{service.slug}-{str(service.id)[:8]}"

        updated = self.service_repository.update(service)
        return updated

    def _validate_updates(self, updates: dict, service: Service):
        if "base_price" in updates and updates["base_price"] is not None:
            price = updates["base_price"]
            if price <= 0:
                raise ValidationError("Base price must be greater than zero")

        capacity_keys = ["max_guests", "bedrooms", "bathrooms", "beds"]
        for key in capacity_keys:
            if key in updates and updates[key] is not None and updates[key] < 0:
                raise ValidationError(f"{key} cannot be negative")

        if "status" in updates and updates["status"] not in [status.value for status in ServiceStatus]:
            raise ValidationError("Invalid service status provided")

