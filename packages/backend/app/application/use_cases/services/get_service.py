"""
Ganitel V2 Backend - Get Service Details Use Case
"""
from uuid import UUID

from app.domain.repositories.service_repository import IServiceRepository
from app.exceptions import ServiceNotFoundError


class GetServiceUseCase:
    """Retrieve a single service/listing"""

    def __init__(self, service_repository: IServiceRepository):
        self.service_repository = service_repository

    def execute(self, service_id: UUID):
        service = self.service_repository.get_by_id(service_id)
        if not service:
            raise ServiceNotFoundError()
        return service

