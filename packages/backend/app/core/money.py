"""Money value object and ISO 4217 currency registry.

Storage convention: every money column is split into `<name>_amount NUMERIC(19,4)`
plus `<name>_currency CHAR(3)`. The Python layer composes them back into Money.
Floats are forbidden — Decimal end-to-end.
"""

from decimal import ROUND_HALF_UP, Decimal
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Currency(StrEnum):
    # West & Central Africa CFA
    XAF = "XAF"
    XOF = "XOF"
    # Other African
    NGN = "NGN"
    GHS = "GHS"
    KES = "KES"
    UGX = "UGX"
    TZS = "TZS"
    RWF = "RWF"
    ETB = "ETB"
    ZAR = "ZAR"
    MAD = "MAD"
    EGP = "EGP"
    DZD = "DZD"
    TND = "TND"
    # Reserve / cards
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"


# ISO 4217 currency exponent: fractional digits for the major unit (0 = whole units only).
# XAF/XOF/RWF/UGX: no subdivision — "100 XAF" not "100.00 XAF".
CURRENCY_EXPONENT: dict[Currency, int] = {
    Currency.XAF: 0,
    Currency.XOF: 0,
    Currency.RWF: 0,
    Currency.UGX: 0,
    Currency.NGN: 2,
    Currency.GHS: 2,
    Currency.KES: 2,
    Currency.TZS: 2,
    Currency.ETB: 2,
    Currency.ZAR: 2,
    Currency.MAD: 2,
    Currency.EGP: 2,
    Currency.DZD: 2,
    Currency.TND: 3,
    Currency.USD: 2,
    Currency.EUR: 2,
    Currency.GBP: 2,
}


class Money(BaseModel):
    model_config = ConfigDict(frozen=True)

    amount: Decimal = Field(...)
    currency: Currency

    @field_validator("amount", mode="before")
    @classmethod
    def _coerce(cls, v: object) -> Decimal:
        if isinstance(v, Decimal):
            return v
        if isinstance(v, int | str):
            return Decimal(v)
        raise TypeError("amount must be Decimal, int, or str — never float")

    def quantize(self) -> Self:
        exp = Decimal(10) ** -CURRENCY_EXPONENT[self.currency]
        return self.__class__(
            amount=self.amount.quantize(exp, rounding=ROUND_HALF_UP), currency=self.currency
        )

    def _check_same_currency(self, other: "Money") -> None:
        if self.currency != other.currency:
            raise ValueError(f"currency mismatch: {self.currency} vs {other.currency}")

    def __add__(self, other: "Money") -> "Money":
        self._check_same_currency(other)
        return Money(amount=self.amount + other.amount, currency=self.currency)

    def __sub__(self, other: "Money") -> "Money":
        self._check_same_currency(other)
        return Money(amount=self.amount - other.amount, currency=self.currency)

    def __mul__(self, factor: Decimal | int) -> "Money":
        return Money(amount=self.amount * Decimal(factor), currency=self.currency)


def zero(currency: Currency) -> Money:
    return Money(amount=Decimal(0), currency=currency)
