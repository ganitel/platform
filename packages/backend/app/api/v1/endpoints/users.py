"""
Ganitel V2 Backend - User Management Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.booking_schemas import BookingListResponse, BookingResponse
from app.api.v1.schemas.user_schemas import (
    ChangePasswordRequest,
    MessageResponse,
    UserListResponse,
    UserPublicResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.application.use_cases.bookings.get_user_bookings import GetUserBookingsUseCase
from app.database import get_db
from app.dependencies import get_current_active_user, get_current_admin
from app.domain.entities.user import User
from app.infrastructure.repositories.booking_repository import BookingRepository
from app.infrastructure.repositories.user_repository import UserRepository

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user's profile
    """
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        phone=current_user.phone,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        full_name=current_user.full_name,
        user_type=current_user.user_type,
        status=current_user.status,
        is_verified=current_user.is_verified,
        profile_picture=current_user.profile_picture,
        bio=current_user.bio,
        country=current_user.country,
        city=current_user.city,
        language=current_user.language,
        currency=current_user.currency,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's profile
    """
    try:
        user_repository = UserRepository(db)

        # Update user fields
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)

        # Save changes
        updated_user = user_repository.update(current_user)

        return UserResponse(
            id=str(updated_user.id),
            email=updated_user.email,
            phone=updated_user.phone,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            full_name=updated_user.full_name,
            user_type=updated_user.user_type,
            status=updated_user.status,
            is_verified=updated_user.is_verified,
            profile_picture=updated_user.profile_picture,
            bio=updated_user.bio,
            country=updated_user.country,
            city=updated_user.city,
            language=updated_user.language,
            currency=updated_user.currency,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed. Please try again.",
        ) from None


@router.get("/me/bookings", response_model=BookingListResponse)
async def get_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve bookings for the current user
    """
    try:
        booking_repository = BookingRepository(db)
        use_case = GetUserBookingsUseCase(booking_repository)
        bookings = use_case.execute(current_user.id, skip=skip, limit=limit)
        total = booking_repository.count({"user_id": current_user.id})
        return BookingListResponse(
            bookings=[BookingResponse.model_validate(booking) for booking in bookings],
            total=total,
            page=skip // limit + 1,
            per_page=limit,
            pages=(total + limit - 1) // limit,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bookings",
        ) from None


@router.post("/me/change-password", response_model=MessageResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Change current user's password
    """
    try:
        from passlib.context import CryptContext

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        user_repository = UserRepository(db)

        # Verify current password
        if not pwd_context.verify(
            password_data.current_password, current_user.hashed_password
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        # Hash new password
        new_hashed_password = pwd_context.hash(password_data.new_password)

        # Update password
        success = user_repository.change_password(current_user.id, new_hashed_password)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password change failed",
            )

        return MessageResponse(message="Password changed successfully")

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed. Please try again.",
        ) from None


@router.get("/{user_id}", response_model=UserPublicResponse)
async def get_user_public_profile(user_id: str, db: Session = Depends(get_db)):
    """
    Get user's public profile
    """
    try:
        from uuid import UUID

        user_repository = UserRepository(db)
        user = user_repository.get_by_id(UUID(user_id))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return UserPublicResponse(
            id=str(user.id),
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            profile_picture=user.profile_picture,
            bio=user.bio,
            country=user.country,
            city=user.city,
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        ) from None
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile",
        ) from None


# Admin endpoints
@router.get("/", response_model=UserListResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    user_type: str | None = Query(None),
    user_status: str | None = Query(None),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    List users (Admin only)
    """
    try:
        user_repository = UserRepository(db)

        if search:
            users = user_repository.search_users(search, skip=skip, limit=limit)
            total = len(users)  # Simplified for now
        else:
            filters = {}
            if user_type:
                filters["user_type"] = user_type
            if user_status:
                filters["status"] = user_status

            users = user_repository.find_by_criteria(filters, skip=skip, limit=limit)
            total = user_repository.count(filters)

        return UserListResponse(
            users=[
                UserResponse(
                    id=str(user.id),
                    email=user.email,
                    phone=user.phone,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    full_name=user.full_name,
                    user_type=user.user_type,
                    status=user.status,
                    is_verified=user.is_verified,
                    profile_picture=user.profile_picture,
                    bio=user.bio,
                    country=user.country,
                    city=user.city,
                    language=user.language,
                    currency=user.currency,
                    created_at=user.created_at,
                    updated_at=user.updated_at,
                )
                for user in users
            ],
            total=total,
            page=skip // limit + 1,
            per_page=limit,
            pages=(total + limit - 1) // limit,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users",
        ) from None


@router.put("/{user_id}/status", response_model=MessageResponse)
async def update_user_status(
    user_id: str,
    new_status: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Update user status (Admin only)
    """
    try:
        from uuid import UUID

        from app.domain.entities.user import UserStatus

        user_repository = UserRepository(db)

        # Validate status
        try:
            status_enum = UserStatus(new_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status value"
            ) from None

        # Update status
        success = user_repository.update_status(UUID(user_id), status_enum)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return MessageResponse(message=f"User status updated to {new_status}")

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID format"
        ) from None
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Status update failed",
        ) from None
