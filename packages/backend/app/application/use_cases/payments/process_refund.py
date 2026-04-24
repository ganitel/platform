"""
Ganitel V2 Backend - Process Refund Use Case
"""

import logging
from uuid import UUID

from app.domain.repositories.payment_repository import IPaymentRepository
from app.exceptions import PaymentError, ValidationError
from app.infrastructure.external_apis.tranzak_client import TranzakClient

logger = logging.getLogger(__name__)


class ProcessRefundUseCase:
    """Handles payment refunds"""

    def __init__(
        self, payment_repository: IPaymentRepository, tranzak_client: TranzakClient
    ):
        self.payment_repository = payment_repository
        self.tranzak_client = tranzak_client

    async def execute(
        self,
        payment_id: UUID,
        refund_amount: float | None = None,
        reason: str = "Customer request",
    ) -> dict:
        """
        Process a refund for a payment

        Args:
            payment_id: Payment to refund
            refund_amount: Amount to refund (full refund if None)
            reason: Refund reason

        Returns:
            Dict with refund result
        """
        # Get payment
        payment = self.payment_repository.get_by_id(payment_id)
        if not payment:
            raise PaymentError("Payment not found")

        # Check if payment can be refunded
        if not payment.can_be_refunded():
            raise ValidationError("Payment cannot be refunded")

        # Determine refund amount
        if refund_amount is None:
            refund_amount = float(payment.amount)

        if refund_amount <= 0 or refund_amount > float(payment.amount):
            raise ValidationError("Invalid refund amount")

        # Process refund with Tranzak
        try:
            tranzak_response = await self.tranzak_client.process_refund(
                transaction_id=payment.transaction_id,
                amount=refund_amount,
                reason=reason,
            )

            if not tranzak_response.get("success"):
                raise PaymentError(tranzak_response.get("error", "Refund failed"))

            # Update payment record
            payment.process_refund(refund_amount, reason)
            self.payment_repository.update(payment)

            logger.info(f"Refund processed: {payment.id}, Amount: {refund_amount}")

            return {
                "success": True,
                "payment_id": str(payment.id),
                "refund_amount": refund_amount,
                "status": payment.status,
                "message": "Refund processed successfully",
            }

        except Exception as e:
            logger.error(f"Refund processing error: {e!s}")
            raise PaymentError(f"Refund failed: {e!s}") from e
