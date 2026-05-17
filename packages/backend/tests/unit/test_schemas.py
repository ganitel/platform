"""Unit tests for schema validators — pure pydantic, no I/O."""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

import pytest
from pydantic import ValidationError

from app.core.money import Currency, Money
from app.modules.bookings.schemas import BookingCreateIn, InitiatePaymentIn
from app.modules.media.schemas import MediaUploadIn
from app.modules.properties.schemas import (
    GeoPoint,
    PropertyCreateIn,
    PropertyUpdateIn,
)
from app.modules.users.schemas import UpdateMe
from app.modules.waitlist.schemas import WaitlistEntryIn

UUID_FIXTURE = "00000000-0000-0000-0000-000000000001"


# -------------------- bookings --------------------


def _booking(**overrides: Any) -> dict[str, Any]:
    today = date.today()
    base: dict[str, Any] = {
        "property_id": UUID_FIXTURE,
        "check_in_date": today + timedelta(days=1),
        "check_out_date": today + timedelta(days=4),
        "guest_count": 2,
    }
    base.update(overrides)
    return base


def test_booking_accepts_valid_payload() -> None:
    BookingCreateIn.model_validate(_booking())


def test_booking_rejects_check_out_before_check_in() -> None:
    today = date.today()
    with pytest.raises(ValidationError, match="check_out_date must be after"):
        BookingCreateIn.model_validate(
            _booking(
                check_in_date=today + timedelta(days=4),
                check_out_date=today + timedelta(days=2),
            )
        )


def test_booking_rejects_check_out_equal_to_check_in() -> None:
    today = date.today()
    with pytest.raises(ValidationError, match="check_out_date must be after"):
        BookingCreateIn.model_validate(
            _booking(
                check_in_date=today + timedelta(days=2),
                check_out_date=today + timedelta(days=2),
            )
        )


def test_booking_rejects_zero_guests() -> None:
    with pytest.raises(ValidationError):
        BookingCreateIn.model_validate(_booking(guest_count=0))


def test_booking_rejects_unknown_field() -> None:
    with pytest.raises(ValidationError, match="Extra inputs"):
        BookingCreateIn.model_validate(_booking(unknown_field="x"))


def test_initiate_payment_accepts_known_provider() -> None:
    InitiatePaymentIn(provider="tranzak")
    InitiatePaymentIn(provider="stripe")
    InitiatePaymentIn(provider="noop")


def test_initiate_payment_rejects_unknown_provider() -> None:
    with pytest.raises(ValidationError):
        InitiatePaymentIn.model_validate({"provider": "paypal"})


# -------------------- properties --------------------


def _property(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "title": "Loft lumineux",
        "description": "Belle vue sur le port.",
        "property_type": "apartment",
        "city": "Douala",
        "country_code": "CM",
        "location": GeoPoint(lat=4.05, lng=9.69),
        "capacity": 2,
        "bedrooms": 1,
        "beds": 1,
        "bathrooms": 1,
        "amenities": ["wifi", "ac"],
        "base_price": Money(amount=Decimal("38000"), currency=Currency.XAF),
    }
    base.update(overrides)
    return base


def test_property_accepts_valid_payload() -> None:
    PropertyCreateIn.model_validate(_property())


def test_property_rejects_lowercase_country_code() -> None:
    with pytest.raises(ValidationError, match="country_code"):
        PropertyCreateIn.model_validate(_property(country_code="cm"))


def test_property_rejects_three_letter_country_code() -> None:
    with pytest.raises(ValidationError):
        PropertyCreateIn.model_validate(_property(country_code="CMR"))


def test_property_rejects_invalid_geo_lat() -> None:
    with pytest.raises(ValidationError):
        PropertyCreateIn.model_validate(_property(location=GeoPoint(lat=91.0, lng=0.0)))


def test_property_default_cancellation_policy_is_moderate() -> None:
    p = PropertyCreateIn.model_validate(_property())
    assert p.cancellation_policy.value == "moderate"


def test_property_rejects_unknown_content_language() -> None:
    with pytest.raises(ValidationError):
        PropertyCreateIn.model_validate(_property(content_language="es"))


def test_property_amenities_cap() -> None:
    with pytest.raises(ValidationError):
        PropertyCreateIn.model_validate(_property(amenities=[f"a{i}" for i in range(65)]))


def test_property_update_accepts_empty_patch() -> None:
    # Omitting every field is a valid partial update.
    PropertyUpdateIn.model_validate({})


def test_property_update_accepts_bool_partial_patch() -> None:
    patch = PropertyUpdateIn.model_validate({"pets_allowed": True})
    assert patch.pets_allowed is True
    assert patch.smoking_allowed is None  # not in payload, still default


@pytest.mark.parametrize(
    "field",
    [
        "elevator",
        "accessible",
        "private_bathroom",
        "events_allowed",
        "family_friendly",
        "child_friendly",
        "pets_allowed",
        "smoking_allowed",
    ],
)
def test_property_update_rejects_explicit_null_bool(field: str) -> None:
    with pytest.raises(ValidationError, match="must not be null"):
        PropertyUpdateIn.model_validate({field: None})


# -------------------- users --------------------


def test_update_me_accepts_partial_patch() -> None:
    UpdateMe(display_name="Aïcha")  # language and avatar_url omitted


def test_update_me_rejects_empty_display_name() -> None:
    with pytest.raises(ValidationError):
        UpdateMe(display_name="")


def test_update_me_rejects_unsupported_language() -> None:
    with pytest.raises(ValidationError):
        UpdateMe.model_validate({"language": "es"})


def test_update_me_rejects_unknown_field() -> None:
    with pytest.raises(ValidationError, match="Extra inputs"):
        UpdateMe.model_validate({"display_name": "A", "role": "admin"})


# -------------------- media --------------------


def test_media_upload_accepts_image_mime() -> None:
    MediaUploadIn(mime_type="image/jpeg")
    MediaUploadIn(mime_type="image/png")
    MediaUploadIn(mime_type="image/webp")
    MediaUploadIn(mime_type="image/avif")


def test_media_upload_rejects_non_image_mime() -> None:
    with pytest.raises(ValidationError):
        MediaUploadIn.model_validate({"mime_type": "application/pdf"})


def test_media_upload_rejects_oversize() -> None:
    with pytest.raises(ValidationError):
        MediaUploadIn(mime_type="image/jpeg", size_bytes=10**9)


# -------------------- waitlist --------------------


def _waitlist(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {"email": "test@example.com"}
    base.update(overrides)
    return base


def test_waitlist_accepts_email_only() -> None:
    entry = WaitlistEntryIn.model_validate(_waitlist())
    assert entry.phone is None


def test_waitlist_accepts_phone() -> None:
    entry = WaitlistEntryIn.model_validate(_waitlist(phone="+237611223344"))
    assert entry.phone == "+237611223344"


def test_waitlist_strips_phone_formatting() -> None:
    entry = WaitlistEntryIn.model_validate(_waitlist(phone="+237 (6) 11-22.33 44"))
    assert entry.phone == "+237611223344"


def test_waitlist_treats_blank_phone_as_none() -> None:
    entry = WaitlistEntryIn.model_validate(_waitlist(phone="   "))
    assert entry.phone is None


def test_waitlist_rejects_phone_without_plus() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(_waitlist(phone="237611223344"))


def test_waitlist_rejects_phone_with_leading_zero_after_plus() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(_waitlist(phone="+0611223344"))


def test_waitlist_rejects_phone_too_short() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(_waitlist(phone="+12345"))


def test_waitlist_rejects_phone_over_32_chars() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(_waitlist(phone="+" + "1" * 32))


def test_waitlist_rejects_unknown_field() -> None:
    with pytest.raises(ValidationError, match="Extra inputs"):
        WaitlistEntryIn.model_validate(_waitlist(foo="bar"))


def test_waitlist_accepts_budget_currency() -> None:
    entry = WaitlistEntryIn.model_validate(
        _waitlist(budget_range="under_50k", budget_currency="eur"),
    )
    assert entry.budget_range == "under_50k"
    assert entry.budget_currency == "eur"


def test_waitlist_rejects_invalid_budget_currency() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(
            _waitlist(budget_range="under_50k", budget_currency="gbp"),
        )


def test_waitlist_accepts_host_payload() -> None:
    entry = WaitlistEntryIn.model_validate(
        _waitlist(
            role="host",
            interest="renting",
            host_city="Douala",
            host_inventory="2_5",
            host_status="ready",
        ),
    )
    assert entry.role == "host"
    assert entry.host_city == "Douala"
    assert entry.host_inventory == "2_5"
    assert entry.host_status == "ready"


def test_waitlist_accepts_traveler_role() -> None:
    entry = WaitlistEntryIn.model_validate(_waitlist(role="traveler"))
    assert entry.role == "traveler"


def test_waitlist_rejects_unknown_role() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(_waitlist(role="vendor"))


def test_waitlist_rejects_unknown_host_inventory() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(_waitlist(host_inventory="50"))


def test_waitlist_rejects_unknown_host_status() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(_waitlist(host_status="ghosted"))


def test_waitlist_rejects_host_city_over_120_chars() -> None:
    with pytest.raises(ValidationError):
        WaitlistEntryIn.model_validate(_waitlist(host_city="x" * 121))
