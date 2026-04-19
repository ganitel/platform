"""
Ganitel V2 Backend - Wishlist Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.infrastructure.repositories.wishlist_repository import WishlistRepository
from app.infrastructure.repositories.service_repository import ServiceRepository
from app.application.use_cases.wishlists.toggle_wishlist import ToggleWishlistUseCase
from app.api.v1.schemas.user_schemas import MessageResponse
from app.exceptions import NotFoundError

router = APIRouter(prefix="/wishlists", tags=["wishlists"])


@router.post("/services/{service_id}/toggle", response_model=MessageResponse)
async def toggle_wishlist(
    service_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add or remove service from wishlist"""
    try:
        wishlist_repository = WishlistRepository(db)
        service_repository = ServiceRepository(db)
        use_case = ToggleWishlistUseCase(wishlist_repository, service_repository)
        
        result = use_case.execute(current_user.id, service_id)
        
        return MessageResponse(
            message=result["message"],
            success=True
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle wishlist"
        )


@router.get("/me", response_model=list[dict])
async def get_my_wishlist(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's wishlist"""
    try:
        wishlist_repository = WishlistRepository(db)
        wishlist_items = wishlist_repository.get_by_user_id(current_user.id, skip, limit)
        
        return [
            {
                "id": str(item.id),
                "service_id": str(item.service_id),
                "created_at": item.created_at.isoformat()
            }
            for item in wishlist_items
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get wishlist"
        )

