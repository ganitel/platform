"""
Unit tests for booking use cases
"""
from datetime import date, timedelta
from uuid import uuid4
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.bookings.create_booking import CreateBookingUseCase
from app.application.use_cases.bookings.cancel_booking import CancelBookingUseCase
from app.domain.entities.booking import BookingStatus
from app.domain.entities.service import ServiceStatus
from app.exceptions import BookingConflictError, ValidationError, AuthorizationError


def _build_listing(provider_id):
    listing = MagicMock()
    listing.id = uuid4()
    listing.provider_id = provider_id
    listing.base_price = 10000
    listing.currency = "XAF"
    listing.status = ServiceStatus.ACTIVE.value
    listing.is_active = True
    listing.min_stay = 1
    listing.max_stay = 30
    listing.max_guests = 4
    return listing


def test_create_booking_success():
    traveler_id = uuid4()
    listing = _build_listing(uuid4())

    booking_repo = MagicMock()
    booking_repo.has_conflict.return_value = False
    booking_repo.create.side_effect = lambda booking: booking
    service_repo = MagicMock()
    service_repo.get_by_id.return_value = listing
    service_repo.update_booking_count.return_value = True
    user_repo = MagicMock()
    traveler = MagicMock()
    traveler.id = traveler_id
    traveler.user_type = "traveler"  # Pas besoin de .value pour un mock
    user_repo.get_by_id.return_value = traveler

    use_case = CreateBookingUseCase(booking_repo, service_repo, user_repo)

    start = date.today() + timedelta(days=10)
    end = start + timedelta(days=3)
    booking = use_case.execute(traveler_id, listing.id, start, end, guests=2)

    assert booking.total_amount == float(listing.base_price) * 3
    booking_repo.create.assert_called_once()


def test_create_booking_conflict():
    traveler_id = uuid4()
    listing = _build_listing(uuid4())

    booking_repo = MagicMock()
    booking_repo.has_conflict.return_value = True
    service_repo = MagicMock()
    service_repo.get_by_id.return_value = listing
    user_repo = MagicMock()
    traveler = MagicMock()
    traveler.user_type = "traveler"
    user_repo.get_by_id.return_value = traveler

    use_case = CreateBookingUseCase(booking_repo, service_repo, user_repo)
    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=2)

    with pytest.raises(BookingConflictError):
        use_case.execute(traveler_id, listing.id, start, end, 2)


def test_create_booking_invalid_guests():
    traveler_id = uuid4()
    listing = _build_listing(uuid4())
    listing.max_guests = 2

    booking_repo = MagicMock()
    booking_repo.has_conflict.return_value = False
    service_repo = MagicMock()
    service_repo.get_by_id.return_value = listing
    user_repo = MagicMock()
    traveler = MagicMock()
    traveler.user_type = "traveler"
    user_repo.get_by_id.return_value = traveler

    use_case = CreateBookingUseCase(booking_repo, service_repo, user_repo)
    start = date.today() + timedelta(days=1)
    end = start + timedelta(days=2)

    with pytest.raises(ValidationError):
        use_case.execute(traveler_id, listing.id, start, end, guests=5)


def test_cancel_booking_protection():
    booking_repo = MagicMock()
    booking = MagicMock()
    booking.status = BookingStatus.CONFIRMED.value
    booking.user_id = uuid4()
    booking_repo.get_by_id.return_value = booking
    booking_repo.update.return_value = booking

    use_case = CancelBookingUseCase(booking_repo)
    other_user = uuid4()
    with pytest.raises(AuthorizationError):
        use_case.execute(uuid4(), other_user)

    # Authorized path
    use_case.execute(uuid4(), booking.user_id)
    booking_repo.update.assert_called_once()

