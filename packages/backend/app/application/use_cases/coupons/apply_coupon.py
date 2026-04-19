"""
Ganitel V2 Backend - Apply Coupon Use Case
"""
from uuid import UUID
from decimal import Decimal

from app.domain.repositories.coupon_repository import ICouponRepository
from app.exceptions import ValidationError, NotFoundError

class ApplyCouponUseCase:
    """Use case for applying a coupon"""
    
    def __init__(self, coupon_repository: ICouponRepository):
        self.coupon_repository = coupon_repository
    
    def execute(self, coupon_code: str, amount: Decimal, user_id: UUID = None) -> dict:
        """
        Apply coupon to amount
        
        Args:
            coupon_code: Coupon code
            amount: Amount to apply coupon to
            user_id: User ID (for usage tracking)
            
        Returns:
            dict: Discount information
        """
        # Get coupon
        coupon = self.coupon_repository.get_by_code(coupon_code.upper())
        if not coupon:
            raise NotFoundError("Coupon not found")
        
        # Validate coupon
        if not coupon.is_valid():
            raise ValidationError("Coupon is not valid or has expired")
        
        # Check minimum amount
        if coupon.minimum_amount and amount < coupon.minimum_amount:
            raise ValidationError(f"Minimum amount of {coupon.minimum_amount} required")
        
        # Calculate discount
        discount = coupon.calculate_discount(float(amount))
        final_amount = float(amount) - discount
        
        # Increment usage if user provided
        if user_id:
            self.coupon_repository.increment_usage(coupon.id)
        
        return {
            "coupon": coupon,
            "original_amount": float(amount),
            "discount": discount,
            "final_amount": final_amount,
            "currency": coupon.currency
        }

