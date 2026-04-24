"""
Ganitel V2 Backend - Initiate Payment Use Case
"""

from typing import Any
from uuid import UUID, uuid4

from app.domain.entities.payment import Payment, PaymentProvider, PaymentStatus
from app.domain.repositories.booking_repository import IBookingRepository
from app.domain.repositories.payment_repository import IPaymentRepository
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import (
    BookingNotFoundError,
    ConflictError,
    PaymentError,
    ValidationError,
)
from app.infrastructure.external_apis.tranzak_client import TranzakClient


class InitiatePaymentUseCase:
    """Handles payment initiation for bookings"""

    def __init__(
        self,
        payment_repository: IPaymentRepository,
        booking_repository: IBookingRepository,
        user_repository: IUserRepository,
        tranzak_client: TranzakClient,
    ):
        self.payment_repository = payment_repository
        self.booking_repository = booking_repository
        self.user_repository = user_repository
        self.tranzak_client = tranzak_client

    async def execute(
        self,
        booking_id: UUID,
        user_id: UUID,
        payment_method: str | None = None,
        callback_url: str | None = None,
        return_url: str | None = None,
    ) -> dict[str, Any]:
        """
        Initiate payment for a booking

        Args:
            booking_id: Booking to pay for
            user_id: User making the payment
            payment_method: Payment method (optional)
            callback_url: Webhook URL for payment updates
            return_url: URL to redirect after payment

        Returns:
            Dict containing payment details and payment URL
        """
        # Get booking
        booking = self.booking_repository.get_by_id(booking_id)
        if not booking:
            raise BookingNotFoundError("Booking not found")

        # Verify booking belongs to user
        if booking.user_id != user_id:
            raise ValidationError("Booking does not belong to this user")

        # Check if booking is in pending status
        if booking.status != "pending":
            raise ValidationError(
                f"Cannot pay for booking with status: {booking.status}"
            )

        # Check if payment already exists
        existing_payment = self.payment_repository.get_by_booking_id(booking_id)
        if (
            existing_payment
            and existing_payment.status == PaymentStatus.COMPLETED.value
        ):
            raise ConflictError("Payment already completed for this booking")

        # Get user details
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise ValidationError("User not found")

        # Create or update payment record
        if existing_payment:
            payment = existing_payment

            # Reuse existing record for retries to avoid duplicate booking_id violations
            payment.amount = booking.total_amount
            payment.currency = booking.currency
            payment.provider = PaymentProvider.TRANZAK.value
            payment.payment_method = payment_method
            payment.status = PaymentStatus.PENDING.value
            payment.error_message = None
            payment.provider_response = None

            payment = self.payment_repository.update(payment)
        else:
            payment = Payment(
                id=uuid4(),
                booking_id=booking_id,
                amount=booking.total_amount,
                currency=booking.currency,
                provider=PaymentProvider.TRANZAK.value,
                payment_method=payment_method,
                status=PaymentStatus.PENDING.value,
                is_active=True,
            )
            payment = self.payment_repository.create(payment)

        # Initiate payment with Tranzak
        try:
            tranzak_response = await self.tranzak_client.initiate_payment(
                amount=float(booking.total_amount),
                currency=booking.currency,
                description=f"Booking payment for {booking_id}",
                customer_email=user.email or f"{user.id}@ganitel.com",
                customer_phone=user.phone or "+237600000000",
                customer_name=user.full_name,
                reference=str(booking_id),
                callback_url=callback_url or "",
                return_url=return_url or "",
            )

            if not tranzak_response.get("success"):
                payment.mark_failed(
                    tranzak_response.get("error", "Payment initiation failed")
                )
                self.payment_repository.update(payment)
                raise PaymentError(
                    tranzak_response.get("error", "Payment initiation failed")
                )

            # Update payment with transaction ID
            payment.transaction_id = tranzak_response.get("transaction_id")
            payment.provider_response = str(tranzak_response.get("data"))
            self.payment_repository.update(payment)

            return {
                "payment_id": str(payment.id),
                "transaction_id": payment.transaction_id,
                "payment_url": tranzak_response.get("payment_url"),
                "amount": float(payment.amount),
                "currency": payment.currency,
                "status": payment.status,
            }

        except Exception as e:
            payment.mark_failed(str(e))
            self.payment_repository.update(payment)
            raise PaymentError(f"Payment initiation failed: {e!s}") from e
