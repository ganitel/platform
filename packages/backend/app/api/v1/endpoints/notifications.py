"""
Ganitel V2 Backend - Notification Endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.notification_schemas import (
    NotificationResponse,
)
from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.infrastructure.repositories.notification_repository import (
    NotificationRepository,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=list[NotificationResponse])
async def get_my_notifications(
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get current user's notifications"""
    try:
        repository = NotificationRepository(db)
        notifications = repository.get_by_user_id(
            current_user.id, skip, limit, unread_only
        )

        return [
            NotificationResponse(
                id=str(n.id),
                user_id=str(n.user_id),
                notification_type=n.notification_type,
                channel=n.channel,
                title=n.title,
                message=n.message,
                data=n.data,
                is_read=n.is_read,
                read_at=n.read_at,
                sent_at=n.sent_at,
                action_url=n.action_url,
                action_label=n.action_label,
                related_entity_type=n.related_entity_type,
                related_entity_id=str(n.related_entity_id)
                if n.related_entity_id
                else None,
                created_at=n.created_at,
            )
            for n in notifications
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get notifications",
        ) from None


@router.get("/me/unread-count", response_model=dict)
async def get_unread_count(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Get unread notification count"""
    try:
        repository = NotificationRepository(db)
        count = repository.get_unread_count(current_user.id)
        return {"unread_count": count}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get unread count",
        ) from None


@router.post("/{notification_id}/read", response_model=dict)
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark notification as read"""
    try:
        repository = NotificationRepository(db)
        success = repository.mark_as_read(notification_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
            )
        return {"message": "Notification marked as read", "success": True}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read",
        ) from None


@router.post("/me/read-all", response_model=dict)
async def mark_all_as_read(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    try:
        repository = NotificationRepository(db)
        success = repository.mark_all_as_read(current_user.id)
        return {"message": "All notifications marked as read", "success": success}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all as read",
        ) from None
