"""
Ganitel V2 Backend - Update Service Status Use Case
"""
from uuid import UUID

from app.domain.entities.service import Service, ServiceStatus
from app.domain.repositories.service_repository import IServiceRepository
from app.exceptions import AuthorizationError, ServiceNotFoundError, ValidationError


class UpdateServiceStatusUseCase:
    """
    Use case for updating service status with transition validation
    """

    # Valid status transitions according to architecture
    VALID_TRANSITIONS = {
        ServiceStatus.DRAFT: [ServiceStatus.PENDING_REVIEW, ServiceStatus.ARCHIVED],
        ServiceStatus.PENDING_REVIEW: [ServiceStatus.ACTIVE, ServiceStatus.REJECTED],
        ServiceStatus.ACTIVE: [ServiceStatus.INACTIVE, ServiceStatus.ARCHIVED],
        ServiceStatus.INACTIVE: [ServiceStatus.ACTIVE],
        ServiceStatus.REJECTED: [ServiceStatus.DRAFT, ServiceStatus.ARCHIVED],
    }

    def __init__(self, service_repository: IServiceRepository):
        self.service_repository = service_repository

    def execute(
        self,
        service_id: UUID,
        new_status: ServiceStatus,
        updated_by: UUID | None = None,
        provider_id: UUID | None = None,
        is_admin: bool = False
    ) -> Service:
        """
        Update service status with transition validation

        Valid transitions:
        - draft → pending_review (submission)
        - pending_review → active (admin approval)
        - pending_review → rejected (admin rejection)
        - active → inactive (deactivation)
        - inactive → active (reactivation)
        - active → archived (archiving)
        - rejected → draft (modification)

        Args:
            service_id: Service ID
            new_status: New status
            updated_by: ID of user making the update (for audit)
            provider_id: Provider ID (for authorization check)
            is_admin: Whether the user is an admin

        Returns:
            Service: Updated service entity

        Raises:
            ServiceNotFoundError: If service not found
            ValidationError: If transition is invalid
            AuthorizationError: If user is not authorized
        """
        service = self.service_repository.get_by_id(service_id)

        if not service:
            raise ServiceNotFoundError(f"Service with ID {service_id} not found")

        # Authorization check
        if not is_admin:
            if not provider_id or service.provider_id != provider_id:
                raise AuthorizationError("Only the service provider or admin can update service status")

        # Admin-only transitions
        admin_only_transitions = [
            (ServiceStatus.PENDING_REVIEW, ServiceStatus.ACTIVE),
            (ServiceStatus.PENDING_REVIEW, ServiceStatus.REJECTED),
        ]

        try:
            current_status = ServiceStatus(service.status)
        except ValueError:
            raise ValidationError(f"Invalid current status: {service.status}")

        transition = (current_status, new_status)
        if transition in admin_only_transitions and not is_admin:
            raise AuthorizationError("Only administrators can approve or reject services")

        # Check if transition is valid
        if current_status in self.VALID_TRANSITIONS:
            if new_status not in self.VALID_TRANSITIONS[current_status]:
                raise ValidationError(
                    f"Cannot transition from {current_status.value} to {new_status.value}. "
                    f"Valid transitions: {[s.value for s in self.VALID_TRANSITIONS[current_status]]}"
                )
        elif current_status != new_status:
            raise ValidationError(f"Invalid status transition from {current_status.value}")

        # Update status
        service.status = new_status.value

        # Set updated_by for audit
        if updated_by:
            service.updated_by = updated_by

        # Save changes
        updated_service = self.service_repository.update(service)

        return updated_service

