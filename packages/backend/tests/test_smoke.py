from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.core.money import Currency, Money


@pytest.fixture
def client():
    from app.main import app

    return TestClient(app)


def test_health_ok(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_health_returns_request_id(client):
    r = client.get("/api/health")
    assert r.headers.get("x-request-id")


def test_me_unauthenticated_returns_401(client):
    r = client.get("/api/me")
    assert r.status_code == 401
    assert r.json()["title"] == "auth.invalid"


def test_me_with_garbage_token_returns_401(client):
    r = client.get("/api/me", headers={"Authorization": "Bearer not-a-token"})
    assert r.status_code == 401


def test_money_addition_same_currency():
    a = Money(amount=Decimal("100"), currency=Currency.XAF)
    b = Money(amount=Decimal("50"), currency=Currency.XAF)
    assert (a + b).amount == Decimal("150")


def test_money_rejects_currency_mismatch():
    with pytest.raises(ValueError, match="currency mismatch"):
        Money(amount=Decimal("1"), currency=Currency.XAF) + Money(
            amount=Decimal("1"), currency=Currency.USD
        )


def test_money_rejects_float():
    with pytest.raises(TypeError, match="never float"):
        Money.model_validate({"amount": 1.5, "currency": Currency.USD})
