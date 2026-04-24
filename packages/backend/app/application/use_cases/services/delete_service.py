"""
Ganitel V2 Backend - Delete Service Use Case
"""

from uuid import UUID

from app.domain.repositories.service_repository import IServiceRepository
from app.exceptions import AuthorizationError, ServiceNotFoundError


class DeleteServiceUseCase:
    """Soft delete a service/listing ensuring ownership"""

    def __init__(self, service_repository: IServiceRepository):
        self.service_repository = service_repository

    def execute(self, service_id: UUID, provider_id: UUID) -> None:
        service = self.service_repository.get_by_id(service_id)
        if not service:
            raise ServiceNotFoundError()

        if service.provider_id != provider_id:
            raise AuthorizationError("You can only delete your own listings")

        self.service_repository.soft_delete(service_id)
