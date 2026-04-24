"""
Ganitel V2 Backend - Bookings Endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.booking_schemas import (
    BookingCancelResponse,
    BookingCreateRequest,
    BookingListResponse,
    BookingResponse,
)
from app.application.use_cases.bookings import (
    CancelBookingUseCase,
    CreateBookingUseCase,
    GetBookingUseCase,
    GetUserBookingsUseCase,
)
from app.database import get_db
from app.dependencies import get_current_active_user, get_current_traveler
from app.domain.entities.user import User, UserType
from app.exceptions import GanitelError
from app.infrastructure.repositories.booking_repository import BookingRepository
from app.infrastructure.repositories.service_repository import ServiceRepository
from app.infrastructure.repositories.user_repository import UserRepository

router = APIRouter()


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: BookingCreateRequest,
    current_user: User = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    """Create booking for traveler"""
    booking_repository = BookingRepository(db)
    service_repository = ServiceRepository(db)
    user_repository = UserRepository(db)
    use_case = CreateBookingUseCase(
        booking_repository, service_repository, user_repository
    )
    try:
        booking = use_case.execute(
            traveler_id=current_user.id,
            service_id=UUID(payload.service_id),
            start_date=payload.start_date,
            end_date=payload.end_date,
            guests=payload.guests,
            notes=payload.notes,
        )
        return BookingResponse.from_orm(booking)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid identifier format"
        ) from None
    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Booking creation failed",
        ) from None


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_details(
    booking_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    booking_repository = BookingRepository(db)
    use_case = GetBookingUseCase(booking_repository)
    try:
        booking = use_case.execute(
            booking_id=UUID(booking_id),
            requester_id=current_user.id,
            is_admin=current_user.user_type == UserType.ADMIN.value,
        )
        return BookingResponse.from_orm(booking)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid booking id"
        ) from None
    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch booking",
        ) from None


@router.get("/users/me/", response_model=BookingListResponse)
async def get_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    booking_repository = BookingRepository(db)
    use_case = GetUserBookingsUseCase(booking_repository)
    bookings = use_case.execute(current_user.id, skip=skip, limit=limit)
    total = booking_repository.count({"user_id": current_user.id})
    return BookingListResponse(
        bookings=[BookingResponse.from_orm(b) for b in bookings],
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        pages=(total + limit - 1) // limit,
    )


@router.put("/{booking_id}/cancel", response_model=BookingCancelResponse)
async def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_traveler),
    db: Session = Depends(get_db),
):
    booking_repository = BookingRepository(db)
    use_case = CancelBookingUseCase(booking_repository)
    try:
        booking = use_case.execute(
            booking_id=UUID(booking_id),
            requester_id=current_user.id,
            is_admin=current_user.user_type == UserType.ADMIN.value,
        )
        return BookingCancelResponse(
            message="Booking cancelled successfully",
            booking=BookingResponse.from_orm(booking),
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid booking id"
        ) from None
    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to cancel booking",
        ) from None
