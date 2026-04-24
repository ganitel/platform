"""
Ganitel V2 Backend - Review Entity
"""

from sqlalchemy import Column, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

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
    service_id = Column(
        UUID(as_uuid=True), ForeignKey("services.id"), nullable=False, index=True
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    booking_id = Column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True, index=True
    )
    property_id = Column(
        UUID(as_uuid=True), ForeignKey("properties.id"), nullable=True, index=True
    )

    # Rating (1-5 scale)
    overall_rating = Column(Numeric(3, 2), nullable=False)  # Overall rating
    cleanliness_rating = Column(Numeric(3, 2), nullable=True)
    communication_rating = Column(Numeric(3, 2), nullable=True)
    checkin_rating = Column(Numeric(3, 2), nullable=True)
    accuracy_rating = Column(Numeric(3, 2), nullable=True)
    location_rating = Column(Numeric(3, 2), nullable=True)
    value_rating = Column(Numeric(3, 2), nullable=True)

    # V1 Rating fields
    comfort_rating = Column(Numeric(3, 2), nullable=True)
    security_rating = Column(Numeric(3, 2), nullable=True)
    accessibility_rating = Column(Numeric(3, 2), nullable=True)
    host_response_rating = Column(Numeric(3, 2), nullable=True)

    # Review Content
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=True)

    # Status
    status = Column(
        String(20), default="published", nullable=False
    )  # published, hidden, pending

    def __repr__(self):
        return f"<Review(id={self.id}, service_id={self.service_id}, rating={self.overall_rating})>"
