"""
Ganitel V2 Backend - Support Request Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.infrastructure.repositories.support_request_repository import SupportRequestRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.application.use_cases.support_requests.create_support_request import CreateSupportRequestUseCase
from app.api.v1.schemas.support_request_schemas import (
    SupportRequestCreateRequest,
    SupportRequestResponse
)
from app.exceptions import ValidationError, NotFoundError

router = APIRouter(prefix="/support-requests", tags=["support-requests"])


@router.post("/", response_model=SupportRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_support_request(
    request: SupportRequestCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a support request"""
    try:
        support_repository = SupportRequestRepository(db)
        user_repository = UserRepository(db)
        use_case = CreateSupportRequestUseCase(support_repository, user_repository)
        
        support_request = use_case.execute(
            user_id=current_user.id,
            subject=request.subject,
            description=request.description,
            category=request.category,
            priority=request.priority
        )
        
        return SupportRequestResponse(
            id=str(support_request.id),
            user_id=str(support_request.user_id),
            subject=support_request.subject,
            description=support_request.description,
            category=support_request.category,
            status=support_request.status,
            priority=support_request.priority,
            assigned_to_id=str(support_request.assigned_to_id) if support_request.assigned_to_id else None,
            resolution=support_request.resolution,
            resolved_at=support_request.resolved_at,
            created_at=support_request.created_at,
            updated_at=support_request.updated_at
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create support request"
        )


@router.get("/me", response_model=list[SupportRequestResponse])
async def get_my_support_requests(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's support requests"""
    try:
        repository = SupportRequestRepository(db)
        requests = repository.get_by_user_id(current_user.id, skip, limit)
        
        return [
            SupportRequestResponse(
                id=str(r.id),
                user_id=str(r.user_id),
                subject=r.subject,
                description=r.description,
                category=r.category,
                status=r.status,
                priority=r.priority,
                assigned_to_id=str(r.assigned_to_id) if r.assigned_to_id else None,
                resolution=r.resolution,
                resolved_at=r.resolved_at,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
            for r in requests
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get support requests"
        )

