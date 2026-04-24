"""
Ganitel V2 Backend - Review API Schemas
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    """Create review request schema"""

    service_id: str = Field(..., description="Service ID")
    overall_rating: Decimal = Field(..., ge=1, le=5, description="Overall rating (1-5)")
    title: str | None = Field(None, max_length=200, description="Review title")
    comment: str | None = Field(None, description="Review comment")
    cleanliness_rating: Decimal | None = Field(None, ge=1, le=5)
    communication_rating: Decimal | None = Field(None, ge=1, le=5)
    checkin_rating: Decimal | None = Field(None, ge=1, le=5)
    accuracy_rating: Decimal | None = Field(None, ge=1, le=5)
    location_rating: Decimal | None = Field(None, ge=1, le=5)
    value_rating: Decimal | None = Field(None, ge=1, le=5)
    property_id: str | None = Field(None, description="Property ID (optional)")
    comfort_rating: Decimal | None = Field(
        None, ge=1, le=5, description="Comfort rating"
    )
    security_rating: Decimal | None = Field(
        None, ge=1, le=5, description="Security rating"
    )
    accessibility_rating: Decimal | None = Field(
        None, ge=1, le=5, description="Accessibility rating"
    )
    host_response_rating: Decimal | None = Field(
        None, ge=1, le=5, description="Host response rating"
    )


class ReviewResponse(BaseModel):
    """Review response schema"""

    id: str
    service_id: str
    user_id: str
    booking_id: str | None
    property_id: str | None
    overall_rating: Decimal
    cleanliness_rating: Decimal | None
    communication_rating: Decimal | None
    checkin_rating: Decimal | None
    accuracy_rating: Decimal | None
    location_rating: Decimal | None
    value_rating: Decimal | None
    comfort_rating: Decimal | None
    security_rating: Decimal | None
    accessibility_rating: Decimal | None
    host_response_rating: Decimal | None
    title: str | None
    comment: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
