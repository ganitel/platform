from app.core.errors import ValidationError
from app.modules.payments.providers.base import PaymentProvider
from app.modules.payments.providers.noop import NoopProvider
from app.modules.payments.providers.stripe import StripeProvider
from app.modules.payments.providers.tranzak import TranzakProvider


def get_provider(name: str) -> PaymentProvider:
    name = name.lower()
    if name == "noop":
        return NoopProvider()
    if name == "tranzak":
        return TranzakProvider()
    if name == "stripe":
        return StripeProvider()
    raise ValidationError(f"unknown payment provider: {name}", extra={"field": "provider"})


__all__ = ["PaymentProvider", "get_provider"]
