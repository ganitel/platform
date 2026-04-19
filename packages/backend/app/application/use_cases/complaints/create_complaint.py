"""
Ganitel V2 Backend - Create Complaint Use Case
"""
from uuid import UUID
from typing import Optional

from app.domain.repositories.complaint_repository import IComplaintRepository
from app.domain.repositories.user_repository import IUserRepository
from app.domain.entities.complaint import Complaint, ComplaintStatus, ComplaintPriority
from app.exceptions import ValidationError, NotFoundError

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
        category: Optional[str] = None,
        booking_id: Optional[UUID] = None,
        service_id: Optional[UUID] = None,
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

