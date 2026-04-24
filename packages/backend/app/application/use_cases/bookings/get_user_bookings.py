"""
Ganitel V2 Backend - Get User Bookings Use Case
"""
from uuid import UUID

from app.domain.entities.booking import Booking
from app.domain.repositories.booking_repository import IBookingRepository


class GetUserBookingsUseCase:
    """Return bookings made by a given traveler"""

    def __init__(self, booking_repository: IBookingRepository):
        self.booking_repository = booking_repository

    def execute(self, user_id: UUID, skip: int = 0, limit: int = 50) -> list[Booking]:
        return self.booking_repository.get_by_user(user_id, skip=skip, limit=limit)

