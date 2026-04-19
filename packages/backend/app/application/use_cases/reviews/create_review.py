"""
Ganitel V2 Backend - Create Review Use Case
"""
from uuid import UUID
from decimal import Decimal

from app.domain.repositories.review_repository import IReviewRepository
from app.domain.repositories.service_repository import IServiceRepository
from app.domain.entities.review import Review
from app.exceptions import ValidationError, ConflictError, NotFoundError
from sqlalchemy import func

class CreateReviewUseCase:
    """Use case for creating a review"""
    
    def __init__(
        self,
        review_repository: IReviewRepository,
        service_repository: IServiceRepository
    ):
        self.review_repository = review_repository
        self.service_repository = service_repository
    
    def execute(
        self,
        service_id: UUID,
        user_id: UUID,
        overall_rating: Decimal,
        title: str = None,
        comment: str = None,
        cleanliness_rating: Decimal = None,
        communication_rating: Decimal = None,
        checkin_rating: Decimal = None,
        accuracy_rating: Decimal = None,
        location_rating: Decimal = None,
        value_rating: Decimal = None
    ) -> Review:
        """
        Create a review
        
        Args:
            service_id: Service ID
            user_id: User ID
            overall_rating: Overall rating (1-5)
            title: Review title
            comment: Review comment
            cleanliness_rating: Cleanliness rating
            communication_rating: Communication rating
            checkin_rating: Check-in rating
            accuracy_rating: Accuracy rating
            location_rating: Location rating
            value_rating: Value rating
            
        Returns:
            Review: Created review
        """
        # Validate rating
        if overall_rating < 1 or overall_rating > 5:
            raise ValidationError("Rating must be between 1 and 5")
        
        # Check if service exists
        service = self.service_repository.get_by_id(service_id)
        if not service:
            raise NotFoundError("Service not found")
        
        # Check if review already exists
        existing_review = self.review_repository.get_by_service_and_user(service_id, user_id)
        if existing_review:
            raise ConflictError("Review already exists for this service")
        
        # Create review
        review = Review(
            service_id=service_id,
            user_id=user_id,
            overall_rating=overall_rating,
            title=title,
            comment=comment,
            cleanliness_rating=cleanliness_rating,
            communication_rating=communication_rating,
            checkin_rating=checkin_rating,
            accuracy_rating=accuracy_rating,
            location_rating=location_rating,
            value_rating=value_rating,
            status="published"
        )
        
        review = self.review_repository.create(review)
        
        # Update service average rating
        avg_rating = self.review_repository.get_average_rating(service_id)
        service.average_rating = Decimal(str(avg_rating))
        # Count reviews - get all reviews and count
        all_reviews = self.review_repository.get_by_service_id(service_id, skip=0, limit=10000)
        service.review_count = len(all_reviews)
        self.service_repository.update(service)
        
        return review

