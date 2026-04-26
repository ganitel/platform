from dataclasses import dataclass
from typing import Any, Literal, Protocol

from app.modules.payments.models import Payment, PaymentStatus


@dataclass(frozen=True)
class PaymentIntent:
    """Result of creating an intent at a provider."""

    provider_intent_id: str
    client_action: dict[str, Any]  # what the frontend should do (redirect URL, USSD prompt, client_secret, etc.)
    raw: dict[str, Any]


@dataclass(frozen=True)
class PaymentEvent:
    """Verified, parsed webhook event from a provider."""

    provider_intent_id: str
    status: Literal["pending", "captured", "failed"]
    raw: dict[str, Any]


class PaymentProvider(Protocol):
    name: str

    async def create_intent(self, *, payment: Payment, return_url: str | None = None) -> PaymentIntent: ...

    async def parse_webhook(self, *, headers: dict[str, str], body: bytes) -> PaymentEvent: ...


def status_from_str(s: str) -> PaymentStatus:
    return PaymentStatus(s)
