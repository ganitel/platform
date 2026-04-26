"""Unit tests for the Money value object — no I/O, no DB, no app boot."""

from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.core.money import CURRENCY_EXPONENT, Currency, Money, zero


def test_constructs_from_str() -> None:
    m = Money(amount="100", currency=Currency.XAF)
    assert m.amount == Decimal("100")


def test_constructs_from_int() -> None:
    m = Money(amount=100, currency=Currency.XAF)
    assert m.amount == Decimal("100")


def test_rejects_float() -> None:
    with pytest.raises(TypeError, match="never float"):
        Money.model_validate({"amount": 1.5, "currency": Currency.USD})


def test_addition_same_currency() -> None:
    a = Money(amount=Decimal("100"), currency=Currency.XAF)
    b = Money(amount=Decimal("50"), currency=Currency.XAF)
    assert (a + b) == Money(amount=Decimal("150"), currency=Currency.XAF)


def test_subtraction_same_currency() -> None:
    a = Money(amount=Decimal("100"), currency=Currency.XAF)
    b = Money(amount=Decimal("30"), currency=Currency.XAF)
    assert (a - b) == Money(amount=Decimal("70"), currency=Currency.XAF)


def test_multiplication_by_scalar() -> None:
    a = Money(amount=Decimal("100"), currency=Currency.XAF)
    assert a * 3 == Money(amount=Decimal("300"), currency=Currency.XAF)


@pytest.mark.parametrize("op", ["__add__", "__sub__"])
def test_currency_mismatch_rejected(op: str) -> None:
    a = Money(amount=Decimal("1"), currency=Currency.XAF)
    b = Money(amount=Decimal("1"), currency=Currency.USD)
    with pytest.raises(ValueError, match="currency mismatch"):
        getattr(a, op)(b)


def test_quantize_no_minor_unit_currencies() -> None:
    # XAF/XOF/RWF/UGX have exponent=0 — no fractional part.
    for ccy in (Currency.XAF, Currency.XOF, Currency.RWF, Currency.UGX):
        m = Money(amount=Decimal("123.567"), currency=ccy)
        assert m.quantize().amount == Decimal("124")


def test_quantize_two_decimal_currencies() -> None:
    m = Money(amount=Decimal("123.567"), currency=Currency.USD)
    assert m.quantize().amount == Decimal("123.57")


def test_quantize_three_decimal_currency() -> None:
    # TND has exponent=3 (millimes).
    m = Money(amount=Decimal("123.5678"), currency=Currency.TND)
    assert m.quantize().amount == Decimal("123.568")


def test_zero_helper() -> None:
    z = zero(Currency.XAF)
    assert z.amount == Decimal("0")
    assert z.currency == Currency.XAF


def test_frozen_immutable() -> None:
    m = Money(amount=Decimal("100"), currency=Currency.XAF)
    with pytest.raises(ValidationError):
        m.amount = Decimal("200")  # type: ignore[misc]


def test_currency_registry_complete() -> None:
    """Every Currency variant must be in the exponent map; otherwise quantize() blows up at runtime."""
    assert set(Currency) == set(CURRENCY_EXPONENT.keys())
