"""
Ganitel V2 Backend - Cancel Booking Use Case
"""
from uuid import UUID

from app.domain.entities.booking import BookingStatus
from app.domain.repositories.booking_repository import IBookingRepository
from app.exceptions import (
    AuthorizationError,
    BookingNotFoundError,
    InvalidBookingStatusError,
)


class CancelBookingUseCase:
    """Handles cancellation logic for traveler bookings"""

    def __init__(self, booking_repository: IBookingRepository):
        self.booking_repository = booking_repository

    def execute(self, booking_id: UUID, requester_id: UUID, is_admin: bool = False):
        booking = self.booking_repository.get_by_id(booking_id)
        if not booking:
            raise BookingNotFoundError()

        if booking.user_id != requester_id and not is_admin:
            raise AuthorizationError("You are not allowed to cancel this booking")

        if booking.status not in [BookingStatus.PENDING.value, BookingStatus.NEGOTIATING.value, BookingStatus.CONFIRMED.value]:
            raise InvalidBookingStatusError("Booking cannot be cancelled in its current status")

        booking.status = BookingStatus.CANCELLED.value
        updated = self.booking_repository.update(booking)
        return updated

