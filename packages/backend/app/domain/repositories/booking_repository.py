"""
Ganitel V2 Backend - Booking Repository Interface
"""
from abc import abstractmethod
from datetime import date
from uuid import UUID

from app.domain.entities.booking import Booking, BookingStatus
from app.domain.repositories.base_repository import BaseRepository


class IBookingRepository(BaseRepository[Booking]):
    """
    Booking repository interface defining booking-specific operations
    """

    @abstractmethod
    def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> list[Booking]:
        """Get bookings by user"""
        raise NotImplementedError

    @abstractmethod
    def get_by_service(self, service_id: UUID, skip: int = 0, limit: int = 100) -> list[Booking]:
        """Get bookings by service/listing"""
        raise NotImplementedError

    @abstractmethod
    def has_conflict(self, service_id: UUID, start_date: date, end_date: date) -> bool:
        """Return True if there is a booking overlap for same service and dates"""
        raise NotImplementedError

    @abstractmethod
    def update_status(self, booking_id: UUID, status: BookingStatus) -> bool:
        """Update booking status"""
        raise NotImplementedError

    @abstractmethod
    def find_by_status(self, status: BookingStatus, skip: int = 0, limit: int = 100) -> list[Booking]:
        """Find bookings by status"""
        raise NotImplementedError

    @abstractmethod
    def find_user_booking(self, user_id: UUID, booking_id: UUID) -> Booking | None:
        """Get booking by id ensuring ownership"""
        raise NotImplementedError


