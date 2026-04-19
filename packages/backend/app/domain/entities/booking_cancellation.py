"""
Ganitel V2 Backend - Booking Cancellation Entity
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum

from app.domain.entities.base import AuditableEntity


class CancellationReason(str, Enum):
    """Cancellation reason enumeration"""
    USER_REQUEST = "user_request"
    PROVIDER_REQUEST = "provider_request"
    PAYMENT_FAILED = "payment_failed"
    NO_SHOW = "no_show"
    EMERGENCY = "emergency"
    WEATHER = "weather"
    OTHER = "other"


class CancellationStatus(str, Enum):
    """Cancellation status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSED = "processed"


class BookingCancellation(AuditableEntity):
    """
    Booking Cancellation entity for detailed cancellation tracking
    """
    __tablename__ = "booking_cancellations"
    
    # Relationships
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    cancelled_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Cancellation Information
    reason = Column(String(50), nullable=False, index=True)
    status = Column(String(20), default=CancellationStatus.PENDING.value, nullable=False, index=True)
    cancellation_message = Column(Text, nullable=True)
    
    # Refund Information
    refund_amount = Column(Numeric(10, 2), nullable=True)
    refund_percentage = Column(Numeric(5, 2), nullable=True)
    refund_status = Column(String(20), nullable=True)  # pending, processed, failed
    
    # Processing
    processed_at = Column(DateTime, nullable=True)
    processed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    def __repr__(self):
        return f"<BookingCancellation(id={self.id}, booking_id={self.booking_id}, reason={self.reason})>"

