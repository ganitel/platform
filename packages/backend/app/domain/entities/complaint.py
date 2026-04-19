"""
Ganitel V2 Backend - Complaint Entity
"""
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from enum import Enum

from app.domain.entities.base import AuditableEntity


class ComplaintStatus(str, Enum):
    """Complaint status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REJECTED = "rejected"


class ComplaintPriority(str, Enum):
    """Complaint priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Complaint(AuditableEntity):
    """
    Complaint entity for user complaints
    """
    __tablename__ = "complaints"
    
    # Relationships
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True, index=True)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id"), nullable=True, index=True)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    
    # Complaint Information
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)  # booking, payment, service, other
    
    # Status
    status = Column(String(20), default=ComplaintStatus.PENDING.value, nullable=False, index=True)
    priority = Column(String(20), default=ComplaintPriority.MEDIUM.value, nullable=False)
    
    # Resolution
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    def __repr__(self):
        return f"<Complaint(id={self.id}, user_id={self.user_id}, status={self.status})>"

