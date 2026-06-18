from types import SimpleNamespace
from typing import cast

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ValidationError
from app.modules.payments import service as payment_service
from app.modules.payments.providers import default_provider_name, get_provider
from app.modules.payments.providers.base import PaymentEvent, PaymentIntent
from app.modules.payments.providers.noop import NoopProvider


def test_default_provider_name_prefers_explicit_provider() -> None:
    assert default_provider_name("stripe") == "stripe"
    assert default_provider_name(" tranzak ") == "tranzak"


def test_default_provider_name_uses_configured_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.modules.payments.providers.get_settings",
        lambda: SimpleNamespace(ENVIRONMENT="production", PAYMENT_PROVIDER="stripe"),
    )

    assert default_provider_name() == "stripe"


def test_default_provider_name_uses_real_provider_in_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.modules.payments.providers.get_settings",
        lambda: SimpleNamespace(ENVIRONMENT="production", PAYMENT_PROVIDER=None),
    )

    assert default_provider_name() == "tranzak"


def test_default_provider_name_keeps_noop_default_outside_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "app.modules.payments.providers.get_settings",
        lambda: SimpleNamespace(ENVIRONMENT="development", PAYMENT_PROVIDER=None),
    )

    assert default_provider_name() == "noop"


def test_get_provider_rejects_noop_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.modules.payments.providers.get_settings",
        lambda: SimpleNamespace(ENVIRONMENT="production"),
    )

    with pytest.raises(ValidationError) as exc:
        get_provider("noop")

    assert exc.value.code == "payment.noop_disabled"


def test_get_provider_allows_noop_outside_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.modules.payments.providers.get_settings",
        lambda: SimpleNamespace(ENVIRONMENT="test"),
    )

    assert isinstance(get_provider("noop"), NoopProvider)


def test_stored_init_response_keeps_client_action() -> None:
    intent = PaymentIntent(
        provider_intent_id="noop-123",
        client_action={"kind": "auto_capture", "intent_id": "noop-123"},
        raw={"intent_id": "noop-123"},
    )

    stored = payment_service._stored_init_response(intent)

    assert stored["client_action"] == intent.client_action
    assert stored["provider_raw"] == intent.raw


@pytest.mark.asyncio
async def test_apply_webhook_event_matches_payment_provider() -> None:
    class Result:
        def scalar_one_or_none(self) -> None:
            return None

    class Session:
        statement = None

        async def execute(self, statement):
            self.statement = statement
            return Result()

    session = Session()

    payment = await payment_service.apply_webhook_event(
        cast(AsyncSession, session),
        provider_name="STRIPE",
        event=PaymentEvent(
            provider_intent_id="pi_123",
            status="captured",
            raw={},
        ),
    )

    assert payment is None
    assert session.statement is not None
    compiled = session.statement.compile()
    assert "stripe" in compiled.params.values()
    assert "pi_123" in compiled.params.values()
