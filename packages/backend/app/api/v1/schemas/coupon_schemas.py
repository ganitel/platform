"""
Ganitel V2 Backend - Coupon API Schemas
"""
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class CouponResponse(BaseModel):
    """Coupon response schema"""
    id: str
    code: str
    name: str
    description: Optional[str]
    coupon_type: str
    discount_value: Decimal
    minimum_amount: Optional[Decimal]
    maximum_discount: Optional[Decimal]
    currency: str
    usage_limit: Optional[int]
    usage_limit_per_user: int
    used_count: int
    valid_from: datetime
    valid_until: datetime
    status: str
    applicable_to_all_services: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApplyCouponRequest(BaseModel):
    """Apply coupon request schema"""
    coupon_code: str = Field(..., description="Coupon code")
    amount: Decimal = Field(..., gt=0, description="Amount to apply coupon to")

class ApplyCouponResponse(BaseModel):
    """Apply coupon response schema"""
    coupon: CouponResponse
    original_amount: float
    discount: float
    final_amount: float
    currency: str

