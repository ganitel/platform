"""
Ganitel V2 Backend - Booking Data Entity
"""
from sqlalchemy import Column, String, JSON, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.domain.entities.base import AuditableEntity


class BookingData(AuditableEntity):
    """
    Booking Data entity for additional booking information
    """
    __tablename__ = "booking_data"
    
    # Relationships
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    
    # Guest Information
    guest_name = Column(String(200), nullable=True)
    guest_email = Column(String(255), nullable=True)
    guest_phone = Column(String(20), nullable=True)
    guest_special_requests = Column(Text, nullable=True)
    
    # Check-in/Check-out Details
    check_in_time = Column(String(10), nullable=True)
    check_out_time = Column(String(10), nullable=True)
    early_check_in = Column(Boolean, default=False, nullable=False)
    late_check_out = Column(Boolean, default=False, nullable=False)
    
    # Additional Information
    additional_guests = Column(Integer, default=0, nullable=False)
    special_requirements = Column(JSON, nullable=True)  # Dietary, accessibility, etc.
    emergency_contact = Column(JSON, nullable=True)
    
    # Travel Information
    arrival_method = Column(String(50), nullable=True)  # flight, car, bus, etc.
    arrival_details = Column(JSON, nullable=True)
    
    # Notes
    internal_notes = Column(Text, nullable=True)  # For provider/admin
    guest_notes = Column(Text, nullable=True)  # For guest
    
    def __repr__(self):
        return f"<BookingData(id={self.id}, booking_id={self.booking_id})>"

