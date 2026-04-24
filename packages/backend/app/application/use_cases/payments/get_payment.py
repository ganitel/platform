"""
Ganitel V2 Backend - Get Payment Use Case
"""

from uuid import UUID

from app.domain.entities.payment import Payment
from app.domain.repositories.payment_repository import IPaymentRepository
from app.exceptions import AuthorizationError, PaymentError


class GetPaymentUseCase:
    """Handles retrieving payment details"""

    def __init__(self, payment_repository: IPaymentRepository):
        self.payment_repository = payment_repository

    def execute(
        self, payment_id: UUID, requester_id: UUID, is_admin: bool = False
    ) -> Payment:
        """
        Get payment details

        Args:
            payment_id: Payment ID
            requester_id: User requesting the payment
            is_admin: Whether requester is admin

        Returns:
            Payment entity
        """
        payment = self.payment_repository.get_by_id(payment_id)
        if not payment:
            raise PaymentError("Payment not found")

        # Check authorization (only payment owner or admin can view)
        if not is_admin:
            # Get booking to check ownership
            from app.database import SessionLocal
            from app.infrastructure.repositories.booking_repository import (
                BookingRepository,
            )

            db = SessionLocal()
            try:
                booking_repo = BookingRepository(db)
                booking = booking_repo.get_by_id(payment.booking_id)

                if not booking or booking.user_id != requester_id:
                    raise AuthorizationError("Not authorized to view this payment")
            finally:
                db.close()

        return payment
