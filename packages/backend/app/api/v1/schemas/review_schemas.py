"""
Ganitel V2 Backend - Review API Schemas
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class ReviewCreateRequest(BaseModel):
    """Create review request schema"""
    service_id: str = Field(..., description="Service ID")
    overall_rating: Decimal = Field(..., ge=1, le=5, description="Overall rating (1-5)")
    title: Optional[str] = Field(None, max_length=200, description="Review title")
    comment: Optional[str] = Field(None, description="Review comment")
    cleanliness_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    communication_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    checkin_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    accuracy_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    location_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    value_rating: Optional[Decimal] = Field(None, ge=1, le=5)
    property_id: Optional[str] = Field(None, description="Property ID (optional)")
    comfort_rating: Optional[Decimal] = Field(None, ge=1, le=5, description="Comfort rating")
    security_rating: Optional[Decimal] = Field(None, ge=1, le=5, description="Security rating")
    accessibility_rating: Optional[Decimal] = Field(None, ge=1, le=5, description="Accessibility rating")
    host_response_rating: Optional[Decimal] = Field(None, ge=1, le=5, description="Host response rating")

class ReviewResponse(BaseModel):
    """Review response schema"""
    id: str
    service_id: str
    user_id: str
    booking_id: Optional[str]
    property_id: Optional[str]
    overall_rating: Decimal
    cleanliness_rating: Optional[Decimal]
    communication_rating: Optional[Decimal]
    checkin_rating: Optional[Decimal]
    accuracy_rating: Optional[Decimal]
    location_rating: Optional[Decimal]
    value_rating: Optional[Decimal]
    comfort_rating: Optional[Decimal]
    security_rating: Optional[Decimal]
    accessibility_rating: Optional[Decimal]
    host_response_rating: Optional[Decimal]
    title: Optional[str]
    comment: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

