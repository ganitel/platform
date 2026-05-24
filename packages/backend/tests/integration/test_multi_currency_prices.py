"""Multi-currency pricing: a property created with two prices returns both
currencies in `to_detail`."""

from decimal import Decimal
from unittest.mock import patch

import pytest

from app.core.money import Currency, Money
from app.modules.properties import service as prop_service
from app.modules.properties.schemas import GeoPoint, PropertyCreateIn
from tests.integration.test_listing_media_flow import _seed_user


@pytest.mark.asyncio
async def test_property_with_two_currencies_returns_both_in_detail(db_session):
    user = await _seed_user(db_session)

    payload = PropertyCreateIn(
        title="Multi-currency villa",
        property_type="villa",
        city="Yaoundé",
        country_code="CM",
        location=GeoPoint(lat=3.86, lng=11.52),
        capacity=3,
        prices=[
            Money(amount=Decimal("38000"), currency=Currency.XAF),
            Money(amount=Decimal("60"), currency=Currency.USD),
        ],
    )

    prop = await prop_service.create_draft(db_session, user, payload)
    fresh = await prop_service.get(db_session, prop.id)

    with patch(
        "app.modules.media.service.public_url",
        side_effect=lambda key: f"https://cdn.example/{key}",
    ):
        detail = await prop_service.to_detail(db_session, fresh, user)

    assert len(detail.prices) == 2
    currencies = {p.currency for p in detail.prices}
    assert Currency.XAF in currencies
    assert Currency.USD in currencies

    amounts = {p.currency: p.amount for p in detail.prices}
    assert amounts[Currency.XAF] == Decimal("38000")
    assert amounts[Currency.USD] == Decimal("60")
