"""Tranzak driver — covers MTN MoMo, Orange Money, and local cards in CEMAC.

This file has the structure (auth token caching, intent creation, webhook
verification) but the actual API call shapes are TODO until we wire against
sandbox creds. Endpoints documented inline so it's a fill-in-the-blanks job.

Tranzak docs: https://developers.tranzak.com/
"""

import hashlib
import hmac
import json
import logging
import time
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import AppError
from app.modules.payments.models import Payment
from app.modules.payments.providers.base import PaymentEvent, PaymentIntent

logger = logging.getLogger(__name__)


class TranzakError(AppError):
    code = "payment.provider.tranzak"
    status_code = 502


class TranzakProvider:
    name = "tranzak"

    def __init__(self) -> None:
        s = get_settings()
        self._app_id = s.TRANZAK_APP_ID
        self._app_key = s.TRANZAK_APP_KEY
        self._base_url = s.TRANZAK_BASE_URL.rstrip("/")
        self._webhook_secret = s.TRANZAK_WEBHOOK_SECRET
        self._cached_token: tuple[str, float] | None = None  # (token, expires_at_epoch)

    async def _get_token(self) -> str:
        if self._app_id is None or self._app_key is None:
            raise TranzakError("tranzak not configured")
        if self._cached_token and self._cached_token[1] > time.time() + 30:
            return self._cached_token[0]
        # TODO: confirm exact path — common form is POST /xp021/v1/auth/get-app-token
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{self._base_url}/xp021/v1/auth/get-app-token",
                json={"appId": self._app_id, "appKey": self._app_key},
            )
        if r.status_code >= 400:
            raise TranzakError(f"tranzak auth failed: {r.status_code} {r.text}")
        data = r.json()
        token = data["data"]["token"]
        ttl = int(data["data"].get("expiresIn", 3600))
        self._cached_token = (token, time.time() + ttl)
        return token

    async def create_intent(
        self, *, payment: Payment, return_url: str | None = None
    ) -> PaymentIntent:
        token = await self._get_token()
        # TODO: confirm exact endpoint for collection — typically POST /xp021/v1/request/create
        body: dict[str, Any] = {
            "appId": self._app_id,
            "amount": str(payment.amount),
            "currencyCode": payment.currency,
            "description": f"Booking {payment.booking_id}",
            "mchTransactionRef": str(payment.id),
            "returnUrl": return_url,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{self._base_url}/xp021/v1/request/create",
                json=body,
                headers={"Authorization": f"Bearer {token}"},
            )
        if r.status_code >= 400:
            raise TranzakError(f"tranzak create intent failed: {r.status_code} {r.text}")
        data = r.json()
        return PaymentIntent(
            provider_intent_id=data["data"]["requestId"],
            client_action={"kind": "redirect", "url": data["data"].get("paymentAuthUrl")},
            raw=data,
        )

    async def parse_webhook(self, *, headers: dict[str, str], body: bytes) -> PaymentEvent:
        if self._webhook_secret is None:
            raise TranzakError("webhook secret not configured")
        signature = headers.get("x-tranzak-signature") or headers.get("X-Tranzak-Signature")
        if not signature:
            raise TranzakError("missing webhook signature")
        expected = hmac.new(self._webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise TranzakError("invalid webhook signature")

        data = json.loads(body)
        provider_status = (data.get("status") or data.get("data", {}).get("status") or "").lower()
        # TODO: confirm tranzak status vocabulary; typical values: "successful", "failed", "pending"
        status = (
            "captured"
            if provider_status in {"successful", "success", "captured"}
            else ("failed" if provider_status in {"failed", "cancelled", "error"} else "pending")
        )
        return PaymentEvent(
            provider_intent_id=data.get("requestId") or data.get("data", {}).get("requestId", ""),
            status=status,  # type: ignore[arg-type]
            raw=data,
        )
