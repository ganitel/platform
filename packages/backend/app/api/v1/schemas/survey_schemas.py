"""
Ganitel V2 Backend - Survey API Schemas
"""

from datetime import datetime

from pydantic import BaseModel, Field


class SurveyCreateRequest(BaseModel):
    """Create survey request schema"""

    title: str = Field(..., max_length=200, description="Survey title")
    description: str | None = Field(None, description="Survey description")
    category: str | None = Field(None, description="Survey category")
    start_date: datetime | None = Field(None, description="Survey start date")
    end_date: datetime | None = Field(None, description="Survey end date")
    is_anonymous: bool = Field(False, description="Whether survey is anonymous")
    allow_multiple_responses: bool = Field(
        False, description="Allow multiple responses"
    )


class SurveyResponse(BaseModel):
    """Survey response schema"""

    id: str
    title: str
    description: str | None
    category: str | None
    status: str
    start_date: datetime | None
    end_date: datetime | None
    is_anonymous: bool
    allow_multiple_responses: bool
    response_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
