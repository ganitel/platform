"""
Ganitel V2 Backend - Create Complaint Use Case
"""
from uuid import UUID

from app.domain.entities.complaint import Complaint, ComplaintPriority, ComplaintStatus
from app.domain.repositories.complaint_repository import IComplaintRepository
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import NotFoundError, ValidationError


class CreateComplaintUseCase:
    """Use case for creating a complaint"""

    def __init__(
        self,
        complaint_repository: IComplaintRepository,
        user_repository: IUserRepository
    ):
        self.complaint_repository = complaint_repository
        self.user_repository = user_repository

    def execute(
        self,
        user_id: UUID,
        subject: str,
        description: str,
        category: str | None = None,
        booking_id: UUID | None = None,
        service_id: UUID | None = None,
        priority: str = ComplaintPriority.MEDIUM.value
    ) -> Complaint:
        """
        Create a complaint

        Args:
            user_id: User ID
            subject: Complaint subject
            description: Complaint description
            category: Complaint category
            booking_id: Related booking ID
            service_id: Related service ID
            priority: Complaint priority

        Returns:
            Complaint: Created complaint
        """
        if not subject or not description:
            raise ValidationError("Subject and description are required")

        # Check if user exists
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        # Create complaint
        complaint = Complaint(
            user_id=user_id,
            subject=subject,
            description=description,
            category=category,
            booking_id=booking_id,
            service_id=service_id,
            priority=priority,
            status=ComplaintStatus.PENDING.value
        )

        return self.complaint_repository.create(complaint)

