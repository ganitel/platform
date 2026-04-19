"""
Ganitel V2 Backend - Complete Booking Use Case
"""
from uuid import UUID
from typing import Optional

from app.domain.entities.booking import Booking, BookingStatus
from app.domain.repositories.booking_repository import IBookingRepository
from app.exceptions import BookingNotFoundError, ValidationError


class CompleteBookingUseCase:
    """
    Use case for marking a booking as completed
    """
    
    def __init__(self, booking_repository: IBookingRepository):
        self.booking_repository = booking_repository
    
    def execute(
        self,
        booking_id: UUID,
        completed_by: Optional[UUID] = None
    ) -> Booking:
        """
        Mark booking as completed
        
        Valid transition: confirmed → completed
        
        Args:
            booking_id: Booking ID
            completed_by: ID of user completing (for audit)
            
        Returns:
            Booking: Completed booking entity
            
        Raises:
            BookingNotFoundError: If booking not found
            ValidationError: If booking cannot be completed
        """
        booking = self.booking_repository.get_by_id(booking_id)
        
        if not booking:
            raise BookingNotFoundError(f"Booking with ID {booking_id} not found")
        
        # Check current status
        if booking.status != BookingStatus.CONFIRMED.value:
            raise ValidationError(
                f"Cannot complete booking with status {booking.status}. "
                f"Only confirmed bookings can be completed."
            )
        
        # Mark as completed
        booking.mark_completed()
        
        # Set updated_by for audit
        if completed_by:
            booking.updated_by = completed_by
        
        # Save changes
        updated_booking = self.booking_repository.update(booking)
        
        return updated_booking

