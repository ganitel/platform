"""
Ganitel V2 Backend - Complaint API Schemas
"""

from datetime import datetime

from pydantic import BaseModel, Field


class ComplaintCreateRequest(BaseModel):
    """Create complaint request schema"""

    subject: str = Field(..., max_length=200, description="Complaint subject")
    description: str = Field(..., description="Complaint description")
    category: str | None = Field(None, description="Complaint category")
    booking_id: str | None = Field(None, description="Related booking ID")
    service_id: str | None = Field(None, description="Related service ID")
    priority: str = Field("medium", description="Complaint priority")


class ComplaintResponse(BaseModel):
    """Complaint response schema"""

    id: str
    user_id: str
    subject: str
    description: str
    category: str | None
    booking_id: str | None
    service_id: str | None
    status: str
    priority: str
    resolution: str | None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
