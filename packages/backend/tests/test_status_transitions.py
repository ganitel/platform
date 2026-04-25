"""
Ganitel V2 Backend - Status Transitions Tests
"""

from uuid import uuid4

import pytest

from app.application.use_cases.bookings import (
    CompleteBookingUseCase,
    ConfirmBookingUseCase,
)
from app.application.use_cases.services import UpdateServiceStatusUseCase
from app.application.use_cases.users import UpdateUserStatusUseCase
from app.core.password import hash_password
from app.domain.entities.booking import BookingStatus
from app.domain.entities.service import ServiceStatus
from app.domain.entities.user import User, UserStatus, UserType
from app.exceptions import ValidationError


class TestUserStatusTransitions:
    """Tests for user status transitions"""

    def test_transition_pending_to_active(self, user_repository, db_session):
        """Test transition: pending_verification → active"""
        user = User(
            id=uuid4(),
            email="pending@example.com",
            phone="+237690002000",
            first_name="Pending",
            last_name="User",
            hashed_password=hash_password("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.PENDING_VERIFICATION.value,
            is_verified=False,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = UpdateUserStatusUseCase(user_repository)
        updated_user = use_case.execute(user.id, UserStatus.ACTIVE)

        assert updated_user.status == UserStatus.ACTIVE.value
        assert updated_user.is_verified is True

    def test_transition_active_to_suspended(self, user_repository, sample_user):
        """Test transition: active → suspended"""
        use_case = UpdateUserStatusUseCase(user_repository)
        updated_user = use_case.execute(sample_user.id, UserStatus.SUSPENDED)

        assert updated_user.status == UserStatus.SUSPENDED.value

    def test_transition_suspended_to_active(self, user_repository, db_session):
        """Test transition: suspended → active"""
        user = User(
            id=uuid4(),
            email="suspended2@example.com",
            phone="+237690002001",
            first_name="Suspended",
            last_name="User",
            hashed_password=hash_password("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.SUSPENDED.value,
            is_verified=True,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = UpdateUserStatusUseCase(user_repository)
        updated_user = use_case.execute(user.id, UserStatus.ACTIVE)

        assert updated_user.status == UserStatus.ACTIVE.value

    def test_transition_invalid_active_to_pending(self, user_repository, sample_user):
        """Test invalid transition: active → pending_verification"""
        use_case = UpdateUserStatusUseCase(user_repository)

        with pytest.raises(ValidationError, match="Cannot transition"):
            use_case.execute(sample_user.id, UserStatus.PENDING_VERIFICATION)


class TestServiceStatusTransitions:
    """Tests for service status transitions"""

    def test_transition_draft_to_pending_review(
        self, service_repository, sample_service, sample_provider
    ):
        """Test transition: draft → pending_review"""
        sample_service.status = ServiceStatus.DRAFT.value
        service_repository.update(sample_service)

        use_case = UpdateServiceStatusUseCase(service_repository)
        updated_service = use_case.execute(
            sample_service.id,
            ServiceStatus.PENDING_REVIEW,
            provider_id=sample_provider.id,
            is_admin=False,
        )

        assert updated_service.status == ServiceStatus.PENDING_REVIEW.value

    def test_transition_pending_to_active_admin(
        self, service_repository, sample_service, sample_admin
    ):
        """Test transition: pending_review → active (admin only)"""
        sample_service.status = ServiceStatus.PENDING_REVIEW.value
        service_repository.update(sample_service)

        use_case = UpdateServiceStatusUseCase(service_repository)
        updated_service = use_case.execute(
            sample_service.id,
            ServiceStatus.ACTIVE,
            updated_by=sample_admin.id,
            is_admin=True,
        )

        assert updated_service.status == ServiceStatus.ACTIVE.value

    def test_transition_pending_to_rejected_admin(
        self, service_repository, sample_service, sample_admin
    ):
        """Test transition: pending_review → rejected (admin only)"""
        sample_service.status = ServiceStatus.PENDING_REVIEW.value
        service_repository.update(sample_service)

        use_case = UpdateServiceStatusUseCase(service_repository)
        updated_service = use_case.execute(
            sample_service.id,
            ServiceStatus.REJECTED,
            updated_by=sample_admin.id,
            is_admin=True,
        )

        assert updated_service.status == ServiceStatus.REJECTED.value

    def test_transition_active_to_inactive(
        self, service_repository, sample_service, sample_provider
    ):
        """Test transition: active → inactive"""
        use_case = UpdateServiceStatusUseCase(service_repository)
        updated_service = use_case.execute(
            sample_service.id,
            ServiceStatus.INACTIVE,
            provider_id=sample_provider.id,
            is_admin=False,
        )

        assert updated_service.status == ServiceStatus.INACTIVE.value

    def test_transition_invalid_active_to_draft(
        self, service_repository, sample_service, sample_provider
    ):
        """Test invalid transition: active → draft"""
        use_case = UpdateServiceStatusUseCase(service_repository)

        with pytest.raises(ValidationError, match="Cannot transition"):
            use_case.execute(
                sample_service.id,
                ServiceStatus.DRAFT,
                provider_id=sample_provider.id,
                is_admin=False,
            )


class TestBookingStatusTransitions:
    """Tests for booking status transitions"""

    def test_transition_pending_to_confirmed(self, booking_repository, sample_booking):
        """Test transition: pending → confirmed"""
        use_case = ConfirmBookingUseCase(booking_repository)
        updated_booking = use_case.execute(sample_booking.id)

        assert updated_booking.status == BookingStatus.CONFIRMED.value

    def test_transition_confirmed_to_completed(
        self, booking_repository, sample_booking
    ):
        """Test transition: confirmed → completed"""
        # First confirm
        confirm_use_case = ConfirmBookingUseCase(booking_repository)
        confirmed_booking = confirm_use_case.execute(sample_booking.id)

        # Then complete
        complete_use_case = CompleteBookingUseCase(booking_repository)
        completed_booking = complete_use_case.execute(confirmed_booking.id)

        assert completed_booking.status == BookingStatus.COMPLETED.value

    def test_transition_pending_to_cancelled(self, booking_repository, sample_booking):
        """Test transition: pending → cancelled"""
        from app.application.use_cases.bookings import CancelBookingUseCase

        use_case = CancelBookingUseCase(booking_repository)
        cancelled_booking = use_case.execute(
            sample_booking.id, requester_id=sample_booking.user_id, is_admin=False
        )

        assert cancelled_booking.status == BookingStatus.CANCELLED.value

    def test_transition_invalid_confirmed_to_pending(
        self, booking_repository, sample_booking
    ):
        """Test invalid transition: confirmed → pending"""
        # First confirm
        confirm_use_case = ConfirmBookingUseCase(booking_repository)
        confirmed_booking = confirm_use_case.execute(sample_booking.id)

        # Try to go back to pending (should fail)
        use_case = ConfirmBookingUseCase(booking_repository)
        with pytest.raises(
            ValidationError, match="Only pending bookings can be confirmed"
        ):
            use_case.execute(confirmed_booking.id)
