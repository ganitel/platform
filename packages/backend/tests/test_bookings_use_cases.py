"""
Ganitel V2 Backend - Booking Use Cases Tests
"""
import pytest
from uuid import uuid4
from datetime import date, timedelta
from passlib.context import CryptContext
from app.application.use_cases.bookings import (
    CreateBookingUseCase,
    GetBookingUseCase,
    GetUserBookingsUseCase,
    CancelBookingUseCase,
    ConfirmBookingUseCase,
    CompleteBookingUseCase
)
from app.domain.entities.booking import BookingStatus
from app.exceptions import BookingNotFoundError, ValidationError, BookingConflictError, AuthorizationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestCreateBookingUseCase:
    """Tests for CreateBookingUseCase"""
    
    def test_create_booking_success(self, booking_repository, service_repository, user_repository, sample_user, sample_service):
        """Test successful booking creation"""
        use_case = CreateBookingUseCase(booking_repository, service_repository, user_repository)
        
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)
        
        booking = use_case.execute(
            traveler_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date,
            end_date=end_date,
            guests=2
        )
        
        assert booking.user_id == sample_user.id
        assert booking.service_id == sample_service.id
        assert booking.start_date == start_date
        assert booking.end_date == end_date
        assert booking.guests == 2
        assert booking.status == BookingStatus.PENDING.value
        assert booking.total_amount > 0
    
    def test_create_booking_invalid_guests(self, booking_repository, service_repository, user_repository, sample_user, sample_service):
        """Test booking creation fails with invalid guest count"""
        use_case = CreateBookingUseCase(booking_repository, service_repository, user_repository)
        
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)
        
        with pytest.raises(ValidationError):
            use_case.execute(
                traveler_id=sample_user.id,
                service_id=sample_service.id,
                start_date=start_date,
                end_date=end_date,
                guests=0
            )
    
    def test_create_booking_exceeds_max_guests(self, booking_repository, service_repository, user_repository, sample_user, sample_service):
        """Test booking creation fails when guests exceed service capacity"""
        use_case = CreateBookingUseCase(booking_repository, service_repository, user_repository)
        
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)
        
        with pytest.raises(ValidationError, match="exceeds.*capacity"):
            use_case.execute(
                traveler_id=sample_user.id,
                service_id=sample_service.id,
                start_date=start_date,
                end_date=end_date,
                guests=10  # More than max_guests (4)
            )
    
    def test_create_booking_date_conflict(self, booking_repository, service_repository, user_repository, sample_user, sample_service, sample_booking):
        """Test booking creation fails with date conflict"""
        use_case = CreateBookingUseCase(booking_repository, service_repository, user_repository)
        
        # Try to book overlapping dates
        start_date = sample_booking.start_date + timedelta(days=1)
        end_date = sample_booking.end_date + timedelta(days=1)
        
        with pytest.raises(BookingConflictError, match="already booked"):
            use_case.execute(
                traveler_id=sample_user.id,
                service_id=sample_service.id,
                start_date=start_date,
                end_date=end_date,
                guests=2
            )
    
    def test_create_booking_invalid_dates(self, booking_repository, service_repository, user_repository, sample_user, sample_service):
        """Test booking creation fails with invalid dates"""
        use_case = CreateBookingUseCase(booking_repository, service_repository, user_repository)
        
        start_date = date.today() + timedelta(days=10)
        end_date = start_date - timedelta(days=1)  # End before start
        
        with pytest.raises(ValidationError, match="End date must be after start date"):
            use_case.execute(
                traveler_id=sample_user.id,
                service_id=sample_service.id,
                start_date=start_date,
                end_date=end_date,
                guests=2
            )


class TestConfirmBookingUseCase:
    """Tests for ConfirmBookingUseCase"""
    
    def test_confirm_booking_success(self, booking_repository, sample_booking):
        """Test successful booking confirmation"""
        use_case = ConfirmBookingUseCase(booking_repository)
        
        confirmed_booking = use_case.execute(
            booking_id=sample_booking.id
        )
        
        assert confirmed_booking.status == BookingStatus.CONFIRMED.value
    
    def test_confirm_booking_not_pending(self, booking_repository, sample_booking):
        """Test confirmation fails for non-pending booking"""
        # Set booking to confirmed
        sample_booking.status = BookingStatus.CONFIRMED.value
        booking_repository.update(sample_booking)
        
        use_case = ConfirmBookingUseCase(booking_repository)
        
        with pytest.raises(ValidationError, match="Only pending bookings can be confirmed"):
            use_case.execute(
                booking_id=sample_booking.id
            )
    
    def test_confirm_booking_not_found(self, booking_repository):
        """Test confirmation fails for non-existent booking"""
        use_case = ConfirmBookingUseCase(booking_repository)
        
        with pytest.raises(BookingNotFoundError):
            use_case.execute(
                booking_id=uuid4()
            )


class TestCompleteBookingUseCase:
    """Tests for CompleteBookingUseCase"""
    
    def test_complete_booking_success(self, booking_repository, sample_booking):
        """Test successful booking completion"""
        # Set booking to confirmed first
        sample_booking.status = BookingStatus.CONFIRMED.value
        booking_repository.update(sample_booking)
        
        use_case = CompleteBookingUseCase(booking_repository)
        
        completed_booking = use_case.execute(
            booking_id=sample_booking.id
        )
        
        assert completed_booking.status == BookingStatus.COMPLETED.value
    
    def test_complete_booking_not_confirmed(self, booking_repository, sample_booking):
        """Test completion fails for non-confirmed booking"""
        use_case = CompleteBookingUseCase(booking_repository)
        
        with pytest.raises(ValidationError, match="Only confirmed bookings can be completed"):
            use_case.execute(
                booking_id=sample_booking.id
            )
    
    def test_complete_booking_not_found(self, booking_repository):
        """Test completion fails for non-existent booking"""
        use_case = CompleteBookingUseCase(booking_repository)
        
        with pytest.raises(BookingNotFoundError):
            use_case.execute(
                booking_id=uuid4()
            )


class TestCancelBookingUseCase:
    """Tests for CancelBookingUseCase"""
    
    def test_cancel_booking_success(self, booking_repository, sample_booking):
        """Test successful booking cancellation"""
        use_case = CancelBookingUseCase(booking_repository)
        
        cancelled_booking = use_case.execute(
            booking_id=sample_booking.id,
            requester_id=sample_booking.user_id,
            is_admin=False
        )
        
        assert cancelled_booking.status == BookingStatus.CANCELLED.value
    
    def test_cancel_booking_unauthorized(self, booking_repository, sample_booking, sample_provider):
        """Test cancellation fails for unauthorized user"""
        use_case = CancelBookingUseCase(booking_repository)
        
        # sample_provider is a different user than the booking owner
        with pytest.raises(AuthorizationError):
            use_case.execute(
                booking_id=sample_booking.id,
                requester_id=sample_provider.id,  # Different user
                is_admin=False
            )
    
    def test_cancel_booking_admin_authorized(self, booking_repository, sample_booking, sample_admin):
        """Test admin can cancel any booking"""
        use_case = CancelBookingUseCase(booking_repository)
        
        cancelled_booking = use_case.execute(
            booking_id=sample_booking.id,
            requester_id=sample_admin.id,
            is_admin=True
        )
        
        assert cancelled_booking.status == BookingStatus.CANCELLED.value

