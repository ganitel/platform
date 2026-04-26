"""Unit tests for schema validators — pure pydantic, no I/O."""

from datetime import date, timedelta
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.core.money import Currency, Money
from app.modules.bookings.schemas import BookingCreateIn, InitiatePaymentIn
from app.modules.media.schemas import MediaUploadIn
from app.modules.properties.schemas import (
    GeoPoint,
    PropertyCreateIn,
)
from app.modules.users.schemas import UpdateMe

UUID_FIXTURE = "00000000-0000-0000-0000-000000000001"


# -------------------- bookings --------------------


def _booking(**overrides: object) -> dict[str, object]:
    today = date.today()
    base: dict[str, object] = {
        "property_id": UUID_FIXTURE,
        "check_in_date": today + timedelta(days=1),
        "check_out_date": today + timedelta(days=4),
        "guest_count": 2,
    }
    base.update(overrides)
    return base


def test_booking_accepts_valid_payload() -> None:
    BookingCreateIn(**_booking())


def test_booking_rejects_check_out_before_check_in() -> None:
    today = date.today()
    with pytest.raises(ValidationError, match="check_out_date must be after"):
        BookingCreateIn(
            **_booking(
                check_in_date=today + timedelta(days=4),
                check_out_date=today + timedelta(days=2),
            )
        )


def test_booking_rejects_check_out_equal_to_check_in() -> None:
    today = date.today()
    with pytest.raises(ValidationError, match="check_out_date must be after"):
        BookingCreateIn(
            **_booking(
                check_in_date=today + timedelta(days=2),
                check_out_date=today + timedelta(days=2),
            )
        )


def test_booking_rejects_zero_guests() -> None:
    with pytest.raises(ValidationError):
        BookingCreateIn(**_booking(guest_count=0))


def test_booking_rejects_unknown_field() -> None:
    with pytest.raises(ValidationError, match="Extra inputs"):
        BookingCreateIn(**_booking(unknown_field="x"))


def test_initiate_payment_accepts_known_provider() -> None:
    InitiatePaymentIn(provider="tranzak")
    InitiatePaymentIn(provider="stripe")
    InitiatePaymentIn(provider="noop")


def test_initiate_payment_rejects_unknown_provider() -> None:
    with pytest.raises(ValidationError):
        InitiatePaymentIn(provider="paypal")


# -------------------- properties --------------------


def _property(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "title": "Loft lumineux",
        "description": "Belle vue sur le port.",
        "property_type": "apartment",
        "city": "Douala",
        "country_code": "CM",
        "location": GeoPoint(lat=4.05, lng=9.69),
        "capacity": 2,
        "bedrooms": 1,
        "beds": 1,
        "bathrooms": Decimal("1"),
        "amenities": ["wifi", "ac"],
        "base_price": Money(amount=Decimal("38000"), currency=Currency.XAF),
    }
    base.update(overrides)
    return base


def test_property_accepts_valid_payload() -> None:
    PropertyCreateIn(**_property())


def test_property_rejects_lowercase_country_code() -> None:
    with pytest.raises(ValidationError, match="country_code"):
        PropertyCreateIn(**_property(country_code="cm"))


def test_property_rejects_three_letter_country_code() -> None:
    with pytest.raises(ValidationError):
        PropertyCreateIn(**_property(country_code="CMR"))


def test_property_rejects_invalid_geo_lat() -> None:
    with pytest.raises(ValidationError):
        PropertyCreateIn(**_property(location=GeoPoint(lat=91.0, lng=0.0)))


def test_property_default_cancellation_policy_is_moderate() -> None:
    p = PropertyCreateIn(**_property())
    assert p.cancellation_policy.value == "moderate"


def test_property_rejects_unknown_content_language() -> None:
    with pytest.raises(ValidationError):
        PropertyCreateIn(**_property(content_language="es"))


def test_property_amenities_cap() -> None:
    with pytest.raises(ValidationError):
        PropertyCreateIn(**_property(amenities=[f"a{i}" for i in range(65)]))


# -------------------- users --------------------


def test_update_me_accepts_partial_patch() -> None:
    UpdateMe(display_name="Aïcha")  # language and avatar_url omitted


def test_update_me_rejects_empty_display_name() -> None:
    with pytest.raises(ValidationError):
        UpdateMe(display_name="")


def test_update_me_rejects_unsupported_language() -> None:
    with pytest.raises(ValidationError):
        UpdateMe(language="es")


def test_update_me_rejects_unknown_field() -> None:
    with pytest.raises(ValidationError, match="Extra inputs"):
        UpdateMe(display_name="A", role="admin")  # type: ignore[call-arg]


# -------------------- media --------------------


def test_media_upload_accepts_image_mime() -> None:
    MediaUploadIn(mime_type="image/jpeg")
    MediaUploadIn(mime_type="image/png")
    MediaUploadIn(mime_type="image/webp")
    MediaUploadIn(mime_type="image/avif")


def test_media_upload_rejects_non_image_mime() -> None:
    with pytest.raises(ValidationError):
        MediaUploadIn(mime_type="application/pdf")


def test_media_upload_rejects_oversize() -> None:
    with pytest.raises(ValidationError):
        MediaUploadIn(mime_type="image/jpeg", size_bytes=10**9)
