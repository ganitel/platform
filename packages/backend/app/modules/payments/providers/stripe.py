from app.core.errors import AppError
from app.modules.payments.models import Payment
from app.modules.payments.providers.base import PaymentEvent, PaymentIntent


class StripeProvider:
    name = "stripe"

    async def create_intent(
        self, *, payment: Payment, return_url: str | None = None
    ) -> PaymentIntent:
        raise AppError(code="stripe.not_implemented", extra={"status_code": 501})

    async def parse_webhook(self, *, headers: dict[str, str], body: bytes) -> PaymentEvent:
        raise AppError(code="stripe.not_implemented", extra={"status_code": 501})
