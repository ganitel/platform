"""
Ganitel V2 Backend - Survey Entity
"""
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class SurveyStatus(str, Enum):
    """Survey status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"


class Survey(AuditableEntity, SoftDeleteEntity):
    """
    Survey entity for user surveys
    """
    __tablename__ = "surveys"

    # Basic Information
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)

    # Status
    status = Column(String(20), default=SurveyStatus.DRAFT.value, nullable=False, index=True)

    # Validity
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    # Settings
    is_anonymous = Column(Boolean, default=False, nullable=False)
    allow_multiple_responses = Column(Boolean, default=False, nullable=False)

    # Statistics
    response_count = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<Survey(id={self.id}, title={self.title}, status={self.status})>"

