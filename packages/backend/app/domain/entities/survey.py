"""
Ganitel V2 Backend - Survey Entity
"""

from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class SurveyStatus(StrEnum):
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
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default=SurveyStatus.DRAFT.value, nullable=False, index=True
    )

    # Validity
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Settings
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_multiple_responses: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Statistics
    response_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<Survey(id={self.id}, title={self.title}, status={self.status})>"
