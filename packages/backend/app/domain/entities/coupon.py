"""
Ganitel V2 Backend - Coupon Entity
"""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class CouponType(StrEnum):
    """Coupon type enumeration"""

    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_SHIPPING = "free_shipping"


class CouponStatus(StrEnum):
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
    code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Discount Information
    coupon_type: Mapped[str] = mapped_column(String(20), nullable=False)
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    minimum_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    maximum_discount: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    currency: Mapped[str] = mapped_column(String(10), default="XAF", nullable=False)

    # Usage Limits
    usage_limit: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )  # Total usage limit
    usage_limit_per_user: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )
    used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Validity
    valid_from: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=CouponStatus.ACTIVE.value, nullable=False, index=True
    )

    # Applicability
    applicable_to_all_services: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    applicable_service_ids: Mapped[list | None] = mapped_column(
        ARRAY(PGUUID), nullable=True
    )
    applicable_user_types: Mapped[list | None] = mapped_column(
        ARRAY(String), nullable=True
    )

    def is_valid(self):
        """Check if coupon is valid"""
        now = datetime.utcnow()
        return (
            self.status == CouponStatus.ACTIVE.value
            and self.valid_from <= now <= self.valid_until
            and (self.usage_limit is None or self.used_count < self.usage_limit)
        )

    def calculate_discount(self, amount: float) -> float:
        """Calculate discount amount"""
        if self.coupon_type == CouponType.PERCENTAGE.value:
            discount = amount * (float(self.discount_value) / 100)
            if self.maximum_discount:
                discount = min(discount, float(self.maximum_discount))
        elif self.coupon_type == CouponType.FIXED_AMOUNT.value:
            discount = min(float(self.discount_value), amount)
        else:
            discount = 0
        return discount

    def __repr__(self):
        return f"<Coupon(id={self.id}, code={self.code}, type={self.coupon_type})>"
