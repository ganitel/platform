"""
Ganitel V2 Backend - Coupon Repository Implementation
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.coupon import Coupon, CouponStatus
from app.domain.repositories.coupon_repository import ICouponRepository


class CouponRepository(ICouponRepository):
    """SQLAlchemy implementation of Coupon Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, coupon: Coupon) -> Coupon:
        """Create a new coupon"""
        self.db.add(coupon)
        self.db.commit()
        self.db.refresh(coupon)
        return coupon

    def get_by_id(self, coupon_id: UUID) -> Coupon | None:
        """Get coupon by ID"""
        return (
            self.db.query(Coupon)
            .filter(Coupon.id == coupon_id, Coupon.deleted_at.is_(None))
            .first()
        )

    def get_by_code(self, code: str) -> Coupon | None:
        """Get coupon by code"""
        return (
            self.db.query(Coupon)
            .filter(Coupon.code == code.upper(), Coupon.deleted_at.is_(None))
            .first()
        )

    def get_active_coupons(self, skip: int = 0, limit: int = 100) -> list[Coupon]:
        """Get active coupons"""
        now = datetime.utcnow()
        return (
            self.db.query(Coupon)
            .filter(
                Coupon.status == CouponStatus.ACTIVE.value,
                Coupon.valid_from <= now,
                Coupon.valid_until >= now,
                Coupon.deleted_at.is_(None),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def increment_usage(self, coupon_id: UUID) -> bool:
        """Increment coupon usage count"""
        coupon = self.get_by_id(coupon_id)
        if coupon:
            coupon.used_count += 1
            self.db.commit()
            return True
        return False

    def update(self, coupon: Coupon) -> Coupon:
        """Update coupon"""
        from datetime import datetime

        coupon.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(coupon)
        return coupon

    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all coupons"""
        return (
            self.db.query(Coupon)
            .filter(Coupon.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def delete(self, coupon_id: UUID) -> bool:
        """Delete coupon"""
        coupon = self.get_by_id(coupon_id)
        if coupon:
            self.db.delete(coupon)
            self.db.commit()
            return True
        return False
