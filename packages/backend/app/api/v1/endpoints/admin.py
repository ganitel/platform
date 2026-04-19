"""
Ganitel V2 Backend - Admin Endpoints
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.infrastructure.repositories.user_repository import UserRepository
from app.infrastructure.repositories.service_repository import ServiceRepository
from app.infrastructure.repositories.booking_repository import BookingRepository
from app.infrastructure.repositories.payment_repository import PaymentRepository
from app.infrastructure.repositories.review_repository import ReviewRepository
from app.infrastructure.repositories.wallet_repository import WalletRepository
from app.application.use_cases.admin.get_dashboard_stats import GetDashboardStatsUseCase
from app.domain.entities.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    try:
        user_repository = UserRepository(db)
        service_repository = ServiceRepository(db)
        booking_repository = BookingRepository(db)
        payment_repository = PaymentRepository(db)
        review_repository = ReviewRepository(db)
        wallet_repository = WalletRepository(db)
        
        use_case = GetDashboardStatsUseCase(
            user_repository=user_repository,
            service_repository=service_repository,
            booking_repository=booking_repository,
            payment_repository=payment_repository,
            review_repository=review_repository,
            wallet_repository=wallet_repository
        )
        
        stats = use_case.execute()
        return stats
    except Exception:
        logger.exception("Failed to get admin dashboard statistics")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics"
        )

