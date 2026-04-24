"""
Ganitel V2 Backend - Coupon Entity
"""
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class CouponType(str, Enum):
    """Coupon type enumeration"""
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_SHIPPING = "free_shipping"


class CouponStatus(str, Enum):
    """Coupon status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"


class Coupon(AuditableEntity, SoftDeleteEntity):
    """
    Coupon entity for discount coupons
    """
    __tablename__ = "coupons"

    # Basic Information
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Discount Information
    coupon_type = Column(String(20), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    minimum_amount = Column(Numeric(10, 2), nullable=True)
    maximum_discount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(10), default="XAF", nullable=False)

    # Usage Limits
    usage_limit = Column(Integer, nullable=True)  # Total usage limit
    usage_limit_per_user = Column(Integer, default=1, nullable=False)
    used_count = Column(Integer, default=0, nullable=False)

    # Validity
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    status = Column(String(20), default=CouponStatus.ACTIVE.value, nullable=False, index=True)

    # Applicability
    applicable_to_all_services = Column(Boolean, default=True, nullable=False)
    applicable_service_ids = Column(ARRAY(UUID), nullable=True)
    applicable_user_types = Column(ARRAY(String), nullable=True)

    def is_valid(self):
        """Check if coupon is valid"""
        from datetime import datetime
        now = datetime.utcnow()
        return (
            self.status == CouponStatus.ACTIVE.value and
            self.valid_from <= now <= self.valid_until and
            (self.usage_limit is None or self.used_count < self.usage_limit)
        )

    def calculate_discount(self, amount: float) -> float:
        """Calculate discount amount"""
        if self.coupon_type == CouponType.PERCENTAGE.value:
            discount = amount * (self.discount_value / 100)
            if self.maximum_discount:
                discount = min(discount, float(self.maximum_discount))
        elif self.coupon_type == CouponType.FIXED_AMOUNT.value:
            discount = min(float(self.discount_value), amount)
        else:
            discount = 0
        return discount

    def __repr__(self):
        return f"<Coupon(id={self.id}, code={self.code}, type={self.coupon_type})>"

