"""
Ganitel V2 Backend - Analytics Endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.user_schemas import MessageResponse
from app.application.use_cases.analytics.track_view import TrackViewUseCase
from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.exceptions import ValidationError
from app.infrastructure.repositories.view_tracking_repository import (
    ViewTrackingRepository,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/track-view", response_model=MessageResponse)
async def track_view(
    entity_type: str,
    entity_id: UUID,
    view_type: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Track a view"""
    try:
        repository = ViewTrackingRepository(db)
        use_case = TrackViewUseCase(repository)

        # Get IP address and user agent
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        referrer = request.headers.get("referer")

        use_case.execute(
            entity_type=entity_type,
            entity_id=entity_id,
            view_type=view_type,
            user_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer,
        )

        return MessageResponse(message="View tracked successfully", success=True)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track view",
        ) from None


@router.get("/views/{entity_type}/{entity_id}/count", response_model=dict)
async def get_view_count(
    entity_type: str, entity_id: UUID, db: Session = Depends(get_db)
):
    """Get view count for an entity"""
    try:
        repository = ViewTrackingRepository(db)
        count = repository.get_view_count(entity_type, entity_id)
        return {
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "view_count": count,
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get view count",
        ) from None
