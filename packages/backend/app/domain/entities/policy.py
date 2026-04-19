"""
Ganitel V2 Backend - Policy Entity
"""
from sqlalchemy import Column, String, Text, Boolean, Integer
from enum import Enum

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class PolicyType(str, Enum):
    """Policy type enumeration"""
    TERMS = "terms"
    PRIVACY = "privacy"
    REFUND = "refund"
    CANCELLATION = "cancellation"
    COMMUNITY = "community"
    OTHER = "other"


class Policy(AuditableEntity, SoftDeleteEntity):
    """
    Policy entity for platform policies
    """
    __tablename__ = "policies"
    
    # Basic Information
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    policy_type = Column(String(50), nullable=False, index=True)
    slug = Column(String(250), unique=True, index=True, nullable=True)
    
    # Display
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    
    # Version
    version = Column(String(20), default="1.0", nullable=False)
    
    def __repr__(self):
        return f"<Policy(id={self.id}, title={self.title}, type={self.policy_type})>"

