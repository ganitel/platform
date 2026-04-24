"""
Ganitel V2 Backend - Booking Exclusion Constraint Tests

Tests specifically for the anti-overlap booking constraint at the database level.
"""

from datetime import date, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from app.domain.entities.booking import Booking, BookingStatus
from app.infrastructure.repositories.booking_repository import BookingRepository


class TestBookingExclusionConstraint:
    """Tests for the database-level exclusion constraint preventing overlapping bookings"""

    def test_overlapping_bookings_should_fail_at_db_level(
        self, db_session, sample_user, sample_service
    ):
        """
        Test that the database exclusion constraint prevents overlapping bookings
        for the same service.

        This test verifies that the constraint 'no_overlapping_bookings' is properly
        enforced at the database level using PostgreSQL's EXCLUDE constraint.
        """
        repo = BookingRepository(db_session)

        # Create the first booking
        start_date_1 = date.today() + timedelta(days=10)
        end_date_1 = start_date_1 + timedelta(days=3)

        booking_1 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date_1,
            end_date=end_date_1,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )
        repo.create(booking_1)
        db_session.commit()

        # Try to create an overlapping booking (same service, overlapping dates)
        # This should fail due to the EXCLUDE constraint
        start_date_2 = start_date_1 + timedelta(days=1)  # Overlaps with booking_1
        end_date_2 = end_date_1 + timedelta(days=1)

        booking_2 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date_2,
            end_date=end_date_2,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )

        # Adding the second booking should raise IntegrityError due to the constraint
        db_session.add(booking_2)
        with pytest.raises(IntegrityError, match="no_overlapping_bookings"):
            db_session.commit()

        # Clean up the transaction state
        db_session.rollback()

    def test_non_overlapping_bookings_should_succeed(
        self, db_session, sample_user, sample_service
    ):
        """
        Test that non-overlapping bookings for the same service can be created.
        """
        repo = BookingRepository(db_session)

        # Create the first booking
        start_date_1 = date.today() + timedelta(days=10)
        end_date_1 = start_date_1 + timedelta(days=3)

        booking_1 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date_1,
            end_date=end_date_1,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )
        repo.create(booking_1)
        db_session.commit()

        # Create a non-overlapping booking after the first one
        start_date_2 = end_date_1 + timedelta(days=1)  # Starts after booking_1 ends
        end_date_2 = start_date_2 + timedelta(days=3)

        booking_2 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date_2,
            end_date=end_date_2,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )

        # This should succeed since there's no overlap
        repo.create(booking_2)
        db_session.commit()

        # Verify both bookings exist
        assert repo.get_by_id(booking_1.id) is not None
        assert repo.get_by_id(booking_2.id) is not None

    def test_deleted_bookings_do_not_trigger_constraint(
        self, db_session, sample_user, sample_service
    ):
        """
        Test that soft-deleted bookings do not trigger the overlap constraint.

        Since the constraint includes WHERE (deleted_at IS NULL), a booking
        that has been soft-deleted should not conflict with new bookings.
        """
        repo = BookingRepository(db_session)

        # Create the first booking
        start_date_1 = date.today() + timedelta(days=10)
        end_date_1 = start_date_1 + timedelta(days=3)

        booking_1 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date_1,
            end_date=end_date_1,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )
        repo.create(booking_1)
        db_session.commit()

        # Soft-delete the first booking
        repo.soft_delete(booking_1.id)
        db_session.commit()

        # Try to create an overlapping booking
        # This should succeed since the first booking is soft-deleted
        start_date_2 = start_date_1 + timedelta(days=1)
        end_date_2 = end_date_1 + timedelta(days=1)

        booking_2 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date_2,
            end_date=end_date_2,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )

        # This should succeed since booking_1 is deleted
        repo.create(booking_2)
        db_session.commit()

        # Verify booking_2 exists
        assert repo.get_by_id(booking_2.id) is not None

    def test_overlapping_bookings_different_services_allowed(
        self, db_session, sample_user, sample_service, sample_service_2
    ):
        """
        Test that overlapping bookings are allowed for different services.

        The constraint is per-service, so the same user can have overlapping
        bookings on different services.
        """
        repo = BookingRepository(db_session)

        # Create booking on first service
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)

        booking_1 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date,
            end_date=end_date,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )
        repo.create(booking_1)
        db_session.commit()

        # Create overlapping booking on second service (should succeed)
        booking_2 = Booking(
            user_id=sample_user.id,
            service_id=sample_service_2.id,
            start_date=start_date,
            end_date=end_date,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )

        repo.create(booking_2)
        db_session.commit()

        # Verify both bookings exist
        assert repo.get_by_id(booking_1.id) is not None
        assert repo.get_by_id(booking_2.id) is not None

    def test_adjacent_bookings_allowed(self, db_session, sample_user, sample_service):
        """
        Test that adjacent bookings (where end_date of one equals start_date of another)
        are allowed.

        The daterange type with its default inclusion rules [) means that adjacent
        ranges do not overlap.
        """
        repo = BookingRepository(db_session)

        # Create the first booking
        start_date_1 = date.today() + timedelta(days=10)
        end_date_1 = start_date_1 + timedelta(days=3)

        booking_1 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date_1,
            end_date=end_date_1,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )
        repo.create(booking_1)
        db_session.commit()

        # Create an adjacent booking that starts exactly when the first one ends
        start_date_2 = end_date_1  # Exactly equal to booking_1's end date
        end_date_2 = start_date_2 + timedelta(days=3)

        booking_2 = Booking(
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date_2,
            end_date=end_date_2,
            guests=2,
            status=BookingStatus.CONFIRMED.value,
            total_amount=100.00,
            currency="XAF",
        )

        # This should succeed since adjacent bookings don't overlap
        repo.create(booking_2)
        db_session.commit()

        # Verify both bookings exist
        assert repo.get_by_id(booking_1.id) is not None
        assert repo.get_by_id(booking_2.id) is not None
