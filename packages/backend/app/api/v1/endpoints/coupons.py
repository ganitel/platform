"""
Ganitel V2 Backend - Coupon Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.coupon_schemas import (
    ApplyCouponRequest,
    ApplyCouponResponse,
    CouponResponse,
)
from app.application.use_cases.coupons.apply_coupon import ApplyCouponUseCase
from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.exceptions import NotFoundError, ValidationError
from app.infrastructure.repositories.coupon_repository import CouponRepository

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.post("/apply", response_model=ApplyCouponResponse)
async def apply_coupon(
    request: ApplyCouponRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Apply a coupon code"""
    try:
        coupon_repository = CouponRepository(db)
        use_case = ApplyCouponUseCase(coupon_repository)

        result = use_case.execute(
            coupon_code=request.coupon_code,
            amount=request.amount,
            user_id=current_user.id
        )

        coupon = result["coupon"]
        return ApplyCouponResponse(
            coupon=CouponResponse(
                id=str(coupon.id),
                code=coupon.code,
                name=coupon.name,
                description=coupon.description,
                coupon_type=coupon.coupon_type,
                discount_value=coupon.discount_value,
                minimum_amount=coupon.minimum_amount,
                maximum_discount=coupon.maximum_discount,
                currency=coupon.currency,
                usage_limit=coupon.usage_limit,
                usage_limit_per_user=coupon.usage_limit_per_user,
                used_count=coupon.used_count,
                valid_from=coupon.valid_from,
                valid_until=coupon.valid_until,
                status=coupon.status,
                applicable_to_all_services=coupon.applicable_to_all_services,
                created_at=coupon.created_at
            ),
            original_amount=result["original_amount"],
            discount=result["discount"],
            final_amount=result["final_amount"],
            currency=result["currency"]
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply coupon"
        )


@router.get("/active", response_model=list[CouponResponse])
async def get_active_coupons(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get active coupons"""
    try:
        repository = CouponRepository(db)
        coupons = repository.get_active_coupons(skip, limit)

        return [
            CouponResponse(
                id=str(c.id),
                code=c.code,
                name=c.name,
                description=c.description,
                coupon_type=c.coupon_type,
                discount_value=c.discount_value,
                minimum_amount=c.minimum_amount,
                maximum_discount=c.maximum_discount,
                currency=c.currency,
                usage_limit=c.usage_limit,
                usage_limit_per_user=c.usage_limit_per_user,
                used_count=c.used_count,
                valid_from=c.valid_from,
                valid_until=c.valid_until,
                status=c.status,
                applicable_to_all_services=c.applicable_to_all_services,
                created_at=c.created_at
            )
            for c in coupons
        ]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get active coupons"
        )

