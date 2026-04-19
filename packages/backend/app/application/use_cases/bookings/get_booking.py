"""
Ganitel V2 Backend - Get Booking Details Use Case
"""
from uuid import UUID

from app.domain.repositories.booking_repository import IBookingRepository
from app.exceptions import BookingNotFoundError, AuthorizationError


class GetBookingUseCase:
    """Retrieve a booking ensuring access control"""

    def __init__(self, booking_repository: IBookingRepository):
        self.booking_repository = booking_repository

    def execute(self, booking_id: UUID, requester_id: UUID, is_admin: bool = False):
        booking = self.booking_repository.get_by_id(booking_id)
        if not booking:
            raise BookingNotFoundError()

        if booking.user_id != requester_id and not is_admin:
            raise AuthorizationError("You are not allowed to view this booking")

        return booking

