"""
Ganitel V2 Backend - Support Request API Schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class SupportRequestCreateRequest(BaseModel):
    """Create support request schema"""
    subject: str = Field(..., max_length=200, description="Request subject")
    description: str = Field(..., description="Request description")
    category: Optional[str] = Field(None, description="Request category")
    priority: str = Field("medium", description="Request priority")

class SupportRequestResponse(BaseModel):
    """Support request response schema"""
    id: str
    user_id: str
    subject: str
    description: str
    category: Optional[str]
    status: str
    priority: str
    assigned_to_id: Optional[str]
    resolution: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

