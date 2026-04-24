"""
Ganitel V2 Backend - Review Entity
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class Review(AuditableEntity, SoftDeleteEntity):
    """
    Review entity for service reviews and ratings
    """

    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("service_id", "user_id", name="uq_review_one_per_user"),
    )

    # Relationships
    service_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    booking_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True, index=True
    )
    property_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("properties.id"), nullable=True, index=True
    )

    # Rating (1-5 scale)
    overall_rating: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), nullable=False
    )  # Overall rating
    cleanliness_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    communication_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    checkin_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)
    accuracy_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    location_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    value_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)

    # V1 Rating fields
    comfort_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)
    security_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    accessibility_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    host_response_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )

    # Review Content
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default="published", nullable=False
    )  # published, hidden, pending

    def __repr__(self):
        return f"<Review(id={self.id}, service_id={self.service_id}, rating={self.overall_rating})>"
