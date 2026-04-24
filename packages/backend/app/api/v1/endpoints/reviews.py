"""
Ganitel V2 Backend - Review Endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.review_schemas import ReviewCreateRequest, ReviewResponse
from app.application.use_cases.reviews.create_review import CreateReviewUseCase
from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.exceptions import (
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.infrastructure.repositories.review_repository import ReviewRepository
from app.infrastructure.repositories.service_repository import ServiceRepository

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    request: ReviewCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a review for a service"""
    try:
        review_repository = ReviewRepository(db)
        service_repository = ServiceRepository(db)
        use_case = CreateReviewUseCase(review_repository, service_repository)

        review = use_case.execute(
            service_id=UUID(request.service_id),
            user_id=current_user.id,
            overall_rating=request.overall_rating,
            title=request.title,
            comment=request.comment,
            cleanliness_rating=request.cleanliness_rating,
            communication_rating=request.communication_rating,
            checkin_rating=request.checkin_rating,
            accuracy_rating=request.accuracy_rating,
            location_rating=request.location_rating,
            value_rating=request.value_rating,
        )

        return ReviewResponse(
            id=str(review.id),
            service_id=str(review.service_id),
            user_id=str(review.user_id),
            booking_id=str(review.booking_id) if review.booking_id else None,
            overall_rating=review.overall_rating,
            cleanliness_rating=review.cleanliness_rating,
            communication_rating=review.communication_rating,
            checkin_rating=review.checkin_rating,
            accuracy_rating=review.accuracy_rating,
            location_rating=review.location_rating,
            value_rating=review.value_rating,
            title=review.title,
            comment=review.comment,
            status=review.status,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except ConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create review",
        ) from None


@router.get("/services/{service_id}", response_model=list[ReviewResponse])
async def get_service_reviews(
    service_id: UUID, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    """Get reviews for a service"""
    try:
        review_repository = ReviewRepository(db)
        reviews = review_repository.get_by_service_id(service_id, skip, limit)

        return [
            ReviewResponse(
                id=str(review.id),
                service_id=str(review.service_id),
                user_id=str(review.user_id),
                booking_id=str(review.booking_id) if review.booking_id else None,
                overall_rating=review.overall_rating,
                cleanliness_rating=review.cleanliness_rating,
                communication_rating=review.communication_rating,
                checkin_rating=review.checkin_rating,
                accuracy_rating=review.accuracy_rating,
                location_rating=review.location_rating,
                value_rating=review.value_rating,
                title=review.title,
                comment=review.comment,
                status=review.status,
                created_at=review.created_at,
                updated_at=review.updated_at,
            )
            for review in reviews
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get reviews",
        ) from None
