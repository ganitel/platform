from app.core.config import get_settings
from app.core.errors import ValidationError
from app.modules.payments.providers.base import PaymentProvider
from app.modules.payments.providers.noop import NoopProvider
from app.modules.payments.providers.stripe import StripeProvider
from app.modules.payments.providers.tranzak import TranzakProvider


def get_provider(name: str) -> PaymentProvider:
    name = name.lower()
    if name == "noop":
        if get_settings().ENVIRONMENT == "production":
            raise ValidationError(
                code="payment.provider_disabled", extra={"field": "provider"}
            )
        return NoopProvider()
    if name == "tranzak":
        return TranzakProvider()
    if name == "stripe":
        return StripeProvider()
    raise ValidationError(code="payment.unknown_provider", extra={"field": "provider"})


__all__ = ["PaymentProvider", "get_provider"]
