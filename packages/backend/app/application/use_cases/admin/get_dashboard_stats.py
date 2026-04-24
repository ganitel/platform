"""
Ganitel V2 Backend - Get Admin Dashboard Stats Use Case
"""

from app.domain.repositories.booking_repository import IBookingRepository
from app.domain.repositories.payment_repository import IPaymentRepository
from app.domain.repositories.review_repository import IReviewRepository
from app.domain.repositories.service_repository import IServiceRepository
from app.domain.repositories.user_repository import IUserRepository
from app.domain.repositories.wallet_repository import IWalletRepository


class GetDashboardStatsUseCase:
    """Use case for getting admin dashboard statistics"""

    def __init__(
        self,
        user_repository: IUserRepository,
        service_repository: IServiceRepository,
        booking_repository: IBookingRepository,
        payment_repository: IPaymentRepository,
        review_repository: IReviewRepository,
        wallet_repository: IWalletRepository,
    ):
        self.user_repository = user_repository
        self.service_repository = service_repository
        self.booking_repository = booking_repository
        self.payment_repository = payment_repository
        self.review_repository = review_repository
        self.wallet_repository = wallet_repository

    def execute(self) -> dict:
        """
        Get dashboard statistics

        Returns:
            dict: Dashboard statistics
        """
        # User statistics
        total_users = self.user_repository.count()
        active_users = self.user_repository.count({"status": "active"})
        travelers = self.user_repository.count({"user_type": "traveler"})
        providers = self.user_repository.count({"user_type": "provider"})

        # Service statistics
        total_services = self.service_repository.count()
        active_services = self.service_repository.count({"status": "active"})
        pending_services = self.service_repository.count({"status": "pending_review"})

        # Booking statistics
        total_bookings = self.booking_repository.count()
        confirmed_bookings = self.booking_repository.count({"status": "confirmed"})
        completed_bookings = self.booking_repository.count({"status": "completed"})

        # Payment statistics
        total_payments = self.payment_repository.count()
        completed_payments = self.payment_repository.count({"status": "completed"})

        # Review statistics
        total_reviews = self.review_repository.count()

        # Wallet statistics
        total_wallets = self.wallet_repository.count()

        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "travelers": travelers,
                "providers": providers,
            },
            "services": {
                "total": total_services,
                "active": active_services,
                "pending_review": pending_services,
            },
            "bookings": {
                "total": total_bookings,
                "confirmed": confirmed_bookings,
                "completed": completed_bookings,
            },
            "payments": {"total": total_payments, "completed": completed_payments},
            "reviews": {"total": total_reviews},
            "wallets": {"total": total_wallets},
        }
