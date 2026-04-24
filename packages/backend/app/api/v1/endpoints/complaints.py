"""
Ganitel V2 Backend - Complaint Endpoints
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.complaint_schemas import (
    ComplaintCreateRequest,
    ComplaintResponse,
)
from app.application.use_cases.complaints.create_complaint import CreateComplaintUseCase
from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.exceptions import NotFoundError, ValidationError
from app.infrastructure.repositories.complaint_repository import ComplaintRepository
from app.infrastructure.repositories.user_repository import UserRepository

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    request: ComplaintCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a complaint"""
    try:
        complaint_repository = ComplaintRepository(db)
        user_repository = UserRepository(db)
        use_case = CreateComplaintUseCase(complaint_repository, user_repository)

        complaint = use_case.execute(
            user_id=current_user.id,
            subject=request.subject,
            description=request.description,
            category=request.category,
            booking_id=UUID(request.booking_id) if request.booking_id else None,
            service_id=UUID(request.service_id) if request.service_id else None,
            priority=request.priority
        )

        return ComplaintResponse(
            id=str(complaint.id),
            user_id=str(complaint.user_id),
            subject=complaint.subject,
            description=complaint.description,
            category=complaint.category,
            booking_id=str(complaint.booking_id) if complaint.booking_id else None,
            service_id=str(complaint.service_id) if complaint.service_id else None,
            status=complaint.status,
            priority=complaint.priority,
            resolution=complaint.resolution,
            resolved_at=complaint.resolved_at,
            created_at=complaint.created_at,
            updated_at=complaint.updated_at
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create complaint"
        )


@router.get("/me", response_model=list[ComplaintResponse])
async def get_my_complaints(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's complaints"""
    try:
        repository = ComplaintRepository(db)
        complaints = repository.get_by_user_id(current_user.id, skip, limit)

        return [
            ComplaintResponse(
                id=str(c.id),
                user_id=str(c.user_id),
                subject=c.subject,
                description=c.description,
                category=c.category,
                booking_id=str(c.booking_id) if c.booking_id else None,
                service_id=str(c.service_id) if c.service_id else None,
                status=c.status,
                priority=c.priority,
                resolution=c.resolution,
                resolved_at=c.resolved_at,
                created_at=c.created_at,
                updated_at=c.updated_at
            )
            for c in complaints
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get complaints"
        )

