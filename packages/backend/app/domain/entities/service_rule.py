"""
Ganitel V2 Backend - Service Rule Entity
"""
from sqlalchemy import Column, String, Text
from enum import Enum

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class RuleType(str, Enum):
    """Rule type enumeration"""
    ALLOWED = "allowed"
    FORBIDDEN = "forbidden"
    RESTRICTED = "restricted"


class ServiceRule(AuditableEntity, SoftDeleteEntity):
    """
    Service Rule entity for house rules and policies
    """
    __tablename__ = "service_rules"
    
    # Basic Information
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=True)
    description = Column(Text, nullable=True)
    rule_type = Column(String(20), default=RuleType.ALLOWED.value, nullable=False, index=True)
    icon = Column(String(100), nullable=True)
    
    def __repr__(self):
        return f"<ServiceRule(id={self.id}, name={self.name}, type={self.rule_type})>"

