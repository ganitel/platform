"""
Ganitel V2 Backend - Create Support Request Use Case
"""
from uuid import UUID

from app.domain.entities.support_request import (
    SupportRequest,
    SupportRequestPriority,
    SupportRequestStatus,
)
from app.domain.repositories.support_request_repository import ISupportRequestRepository
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import NotFoundError, ValidationError


class CreateSupportRequestUseCase:
    """Use case for creating a support request"""

    def __init__(
        self,
        support_request_repository: ISupportRequestRepository,
        user_repository: IUserRepository
    ):
        self.support_request_repository = support_request_repository
        self.user_repository = user_repository

    def execute(
        self,
        user_id: UUID,
        subject: str,
        description: str,
        category: str | None = None,
        priority: str = SupportRequestPriority.MEDIUM.value
    ) -> SupportRequest:
        """
        Create a support request

        Args:
            user_id: User ID
            subject: Request subject
            description: Request description
            category: Request category
            priority: Request priority

        Returns:
            SupportRequest: Created support request
        """
        if not subject or not description:
            raise ValidationError("Subject and description are required")

        # Check if user exists
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        support_request = SupportRequest(
            user_id=user_id,
            subject=subject,
            description=description,
            category=category,
            priority=priority,
            status=SupportRequestStatus.OPEN.value
        )

        return self.support_request_repository.create(support_request)

