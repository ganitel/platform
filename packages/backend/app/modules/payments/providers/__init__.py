from app.core.config import get_settings
from app.core.errors import ValidationError
from app.modules.payments.providers.base import PaymentProvider
from app.modules.payments.providers.noop import NoopProvider
from app.modules.payments.providers.stripe import StripeProvider
from app.modules.payments.providers.tranzak import TranzakProvider


def default_provider_name(explicit_name: str | None = None) -> str:
    name = explicit_name.strip() if explicit_name else None
    if name:
        return name

    settings = get_settings()
    if settings.PAYMENT_PROVIDER:
        return settings.PAYMENT_PROVIDER
    return "tranzak" if settings.ENVIRONMENT == "production" else "noop"


def get_provider(name: str) -> PaymentProvider:
    name = name.lower()
    if name == "noop":
        if get_settings().ENVIRONMENT == "production":
            raise ValidationError(code="payment.noop_disabled", extra={"field": "provider"})
        return NoopProvider()
    if name == "tranzak":
        return TranzakProvider()
    if name == "stripe":
        return StripeProvider()
    raise ValidationError(code="payment.unknown_provider", extra={"field": "provider"})


__all__ = ["PaymentProvider", "default_provider_name", "get_provider"]
