"""
Ganitel V2 Backend - Negotiation Entity
"""
from sqlalchemy import Column, String, Numeric, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum

from app.domain.entities.base import AuditableEntity


class NegotiationStatus(str, Enum):
    """Negotiation status enumeration"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COUNTERED = "countered"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Negotiation(AuditableEntity):
    """
    Negotiation entity for booking price negotiations
    """
    __tablename__ = "negotiations"
    
    # Relationships
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)  # Traveler
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)  # Provider
    
    # Negotiation Information
    original_price = Column(Numeric(10, 2), nullable=False)
    proposed_price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="XAF", nullable=False)
    status = Column(String(20), default=NegotiationStatus.PENDING.value, nullable=False, index=True)
    message = Column(Text, nullable=True)
    
    # Counter offer
    counter_price = Column(Numeric(10, 2), nullable=True)
    counter_message = Column(Text, nullable=True)
    
    # Expiry
    expires_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Negotiation(id={self.id}, booking_id={self.booking_id}, status={self.status})>"

