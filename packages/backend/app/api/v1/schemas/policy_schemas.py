"""
Ganitel V2 Backend - Policy API Schemas
"""

from datetime import datetime

from pydantic import BaseModel, Field


class PolicyCreateRequest(BaseModel):
    """Create policy request schema"""

    title: str = Field(..., max_length=200, description="Policy title")
    content: str = Field(..., description="Policy content")
    policy_type: str = Field(..., description="Policy type")
    slug: str | None = Field(
        None, description="URL slug (auto-generated if not provided)"
    )
    display_order: int = Field(0, description="Display order")


class PolicyResponse(BaseModel):
    """Policy response schema"""

    id: str
    title: str
    content: str
    policy_type: str
    slug: str | None
    is_active: bool
    display_order: int
    version: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
