"""Dev-only payment provider — captures immediately, no external calls.

Use it from a frontend in dev to walk through the booking flow without
real money. Do not enable in production.
"""

from typing import Any
from uuid import uuid4

from app.modules.payments.models import Payment
from app.modules.payments.providers.base import PaymentEvent, PaymentIntent


class NoopProvider:
    name = "noop"

    async def create_intent(self, *, payment: Payment, return_url: str | None = None) -> PaymentIntent:
        intent_id = f"noop-{uuid4().hex}"
        return PaymentIntent(
            provider_intent_id=intent_id,
            client_action={
                "kind": "auto_capture",
                "note": "noop provider — call POST /api/webhooks/noop with this intent_id to confirm",
                "intent_id": intent_id,
            },
            raw={"intent_id": intent_id},
        )

    async def parse_webhook(self, *, headers: dict[str, str], body: bytes) -> PaymentEvent:
        import json

        data: dict[str, Any] = json.loads(body)
        return PaymentEvent(
            provider_intent_id=data["intent_id"],
            status=data.get("status", "captured"),
            raw=data,
        )
