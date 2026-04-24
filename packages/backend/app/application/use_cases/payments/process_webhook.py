"""
Ganitel V2 Backend - Process Payment Webhook Use Case
"""

import logging
from uuid import UUID

from app.domain.entities.payment import PaymentStatus
from app.domain.repositories.booking_repository import IBookingRepository
from app.domain.repositories.payment_repository import IPaymentRepository
from app.exceptions import BookingNotFoundError, PaymentError

logger = logging.getLogger(__name__)


class ProcessWebhookUseCase:
    """Handles Tranzak webhook notifications"""

    def __init__(
        self,
        payment_repository: IPaymentRepository,
        booking_repository: IBookingRepository,
    ):
        self.payment_repository = payment_repository
        self.booking_repository = booking_repository

    def execute(
        self,
        transaction_id: str,
        status: str,
        merchant_transaction_id: str,
        payment_method: str | None = None,
    ) -> dict:
        """
        Process webhook notification from Tranzak

        Args:
            transaction_id: Tranzak transaction ID
            status: Payment status from Tranzak
            merchant_transaction_id: Our booking ID
            payment_method: Payment method used

        Returns:
            Dict with processing result
        """
        try:
            # Get payment by transaction ID
            payment = self.payment_repository.get_by_transaction_id(transaction_id)

            if not payment:
                # Try to find by booking ID
                try:
                    booking_id = UUID(merchant_transaction_id)
                    payment = self.payment_repository.get_by_booking_id(booking_id)
                except ValueError:
                    raise PaymentError(
                        f"Invalid booking ID: {merchant_transaction_id}"
                    ) from None

            if not payment:
                raise PaymentError(
                    f"Payment not found for transaction: {transaction_id}"
                )

            # Idempotency: ignore duplicate notifications for finalized payments
            if payment.status in [
                PaymentStatus.COMPLETED.value,
                PaymentStatus.FAILED.value,
                PaymentStatus.REFUNDED.value,
            ]:
                return {
                    "success": True,
                    "message": "Duplicate webhook ignored",
                    "payment_id": str(payment.id),
                    "status": payment.status,
                }

            # Get associated booking
            booking = self.booking_repository.get_by_id(payment.booking_id)
            if not booking:
                raise BookingNotFoundError("Booking not found for payment")

            # Update payment method if provided
            if payment_method:
                payment.payment_method = payment_method

            if transaction_id and not payment.transaction_id:
                payment.transaction_id = transaction_id

            # Process based on status
            normalized_status = status.strip().upper()

            if normalized_status in ["SUCCESSFUL", "SUCCESS", "COMPLETED"]:
                # Mark payment as completed
                payment.mark_completed(transaction_id)
                self.payment_repository.update(payment)

                # Confirm booking
                booking.confirm()
                self.booking_repository.update(booking)

                logger.info(
                    f"Payment completed: {payment.id}, Booking confirmed: {booking.id}"
                )

                return {
                    "success": True,
                    "message": "Payment processed successfully",
                    "payment_id": str(payment.id),
                    "booking_id": str(booking.id),
                    "status": "completed",
                }

            elif normalized_status in [
                "FAILED",
                "CANCELLED",
                "CANCELLED_BY_PAYER",
                "REJECTED",
            ]:
                # Mark payment as failed
                payment.mark_failed(f"Payment {normalized_status.lower()}")
                self.payment_repository.update(payment)

                # Mark booking as failed
                booking.mark_failed()
                self.booking_repository.update(booking)

                logger.warning(
                    f"Payment failed: {payment.id}, Booking failed: {booking.id}"
                )

                return {
                    "success": True,
                    "message": f"Payment {status.lower()}",
                    "payment_id": str(payment.id),
                    "booking_id": str(booking.id),
                    "status": "failed",
                }

            else:
                # Unknown status, log and keep as pending
                logger.warning(
                    f"Unknown payment status: {status} for payment {payment.id}"
                )
                return {
                    "success": True,
                    "message": f"Payment status: {status}",
                    "payment_id": str(payment.id),
                    "status": "pending",
                }

        except Exception as e:
            logger.error(f"Webhook processing error: {e!s}")
            raise PaymentError(f"Webhook processing failed: {e!s}") from e
