"""
Ganitel V2 Backend - Confirm Booking Use Case
"""
from uuid import UUID

from app.domain.entities.booking import Booking, BookingStatus
from app.domain.repositories.booking_repository import IBookingRepository
from app.exceptions import BookingNotFoundError, ValidationError


class ConfirmBookingUseCase:
    """
    Use case for confirming a booking (after payment)
    """

    def __init__(self, booking_repository: IBookingRepository):
        self.booking_repository = booking_repository

    def execute(
        self,
        booking_id: UUID,
        confirmed_by: UUID | None = None
    ) -> Booking:
        """
        Confirm a booking

        Valid transition: pending → confirmed

        Args:
            booking_id: Booking ID
            confirmed_by: ID of user confirming (for audit)

        Returns:
            Booking: Confirmed booking entity

        Raises:
            BookingNotFoundError: If booking not found
            ValidationError: If booking cannot be confirmed
        """
        booking = self.booking_repository.get_by_id(booking_id)

        if not booking:
            raise BookingNotFoundError(f"Booking with ID {booking_id} not found")

        # Check current status
        if booking.status != BookingStatus.PENDING.value:
            raise ValidationError(
                f"Cannot confirm booking with status {booking.status}. "
                f"Only pending bookings can be confirmed."
            )

        # Confirm booking
        booking.confirm()

        # Set updated_by for audit
        if confirmed_by:
            booking.updated_by = confirmed_by

        # Save changes
        updated_booking = self.booking_repository.update(booking)

        return updated_booking

