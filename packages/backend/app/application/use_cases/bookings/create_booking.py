"""
Ganitel V2 Backend - Create Booking Use Case
"""

from datetime import date
from uuid import UUID, uuid4

from app.domain.entities.booking import Booking, BookingStatus
from app.domain.entities.service import Service, ServiceStatus
from app.domain.repositories.booking_repository import IBookingRepository
from app.domain.repositories.service_repository import IServiceRepository
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import (
    AuthorizationError,
    BookingConflictError,
    ServiceNotFoundError,
    UserNotFoundError,
    ValidationError,
)


class CreateBookingUseCase:
    """Handles booking creation with validation and availability checks"""

    def __init__(
        self,
        booking_repository: IBookingRepository,
        service_repository: IServiceRepository,
        user_repository: IUserRepository,
    ):
        self.booking_repository = booking_repository
        self.service_repository = service_repository
        self.user_repository = user_repository

    def execute(
        self,
        traveler_id: UUID,
        service_id: UUID,
        start_date: date,
        end_date: date,
        guests: int,
        notes: str | None = None,
    ) -> Booking:
        """Create booking after validating inputs"""

        traveler = self.user_repository.get_by_id(traveler_id)
        if not traveler:
            raise UserNotFoundError("Traveler not found")

        if traveler.user_type != "traveler":
            raise AuthorizationError("Only travelers can create bookings")

        listing = self.service_repository.get_by_id(service_id)
        if not listing:
            raise ServiceNotFoundError("Listing not found")

        if listing.status != ServiceStatus.ACTIVE.value or not listing.is_active:
            raise ValidationError("Listing is not available for booking")

        self._validate_dates(start_date, end_date, listing)
        self._validate_guests(guests, listing)

        if self.booking_repository.has_conflict(service_id, start_date, end_date):
            raise BookingConflictError("Listing already booked for selected dates")

        duration = (end_date - start_date).days
        total_amount = float(listing.base_price) * duration

        booking = Booking(
            id=uuid4(),
            user_id=traveler_id,
            service_id=service_id,
            start_date=start_date,
            end_date=end_date,
            guests=guests,
            status=BookingStatus.PENDING.value,
            total_amount=total_amount,
            currency=listing.currency,
            notes=notes,
            is_active=True,
        )

        created_booking = self.booking_repository.create(booking)
        self.service_repository.update_booking_count(service_id)
        return created_booking

    @staticmethod
    def _validate_dates(start_date: date, end_date: date, listing: Service):
        if start_date >= end_date:
            raise ValidationError("End date must be after start date")

        minimum_days = listing.min_stay or 1
        duration = (end_date - start_date).days
        if duration < minimum_days:
            raise ValidationError(f"Stay must be at least {minimum_days} nights")

        if listing.max_stay and duration > listing.max_stay:
            raise ValidationError(f"Stay cannot exceed {listing.max_stay} nights")

    @staticmethod
    def _validate_guests(guests: int, listing: Service):
        if guests <= 0:
            raise ValidationError("Guests must be greater than zero")

        if listing.max_guests and guests > listing.max_guests:
            raise ValidationError("Number of guests exceeds listing capacity")
