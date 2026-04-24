"""
Ganitel V2 Backend - Validation Tests
"""

from datetime import date, timedelta

import pytest
from pydantic import ValidationError as PydanticValidationError

from app.api.v1.schemas.booking_schemas import BookingCreateRequest
from app.api.v1.schemas.service_schemas import ServiceCreateRequest
from app.api.v1.schemas.user_schemas import UserCreateRequest


class TestUserCreateRequestValidation:
    """Tests for UserCreateRequest schema validation"""

    def test_valid_user_create_request(self):
        """Test valid user creation request"""
        request = UserCreateRequest(
            email="test@example.com",
            password="password123",
            first_name="Test",
            last_name="User",
            user_type="traveler",
        )
        assert request.email == "test@example.com"
        assert request.user_type == "traveler"

    def test_user_create_request_missing_email_and_phone(self):
        """Test user creation fails without email or phone"""
        with pytest.raises(PydanticValidationError):
            UserCreateRequest(first_name="Test", last_name="User", user_type="traveler")

    def test_user_create_request_invalid_email(self):
        """Test user creation fails with invalid email"""
        with pytest.raises(PydanticValidationError):
            UserCreateRequest(
                email="invalid-email",
                password="password123",
                first_name="Test",
                last_name="User",
                user_type="traveler",
            )

    def test_user_create_request_invalid_phone(self):
        """Test user creation fails with invalid phone"""
        with pytest.raises(PydanticValidationError):
            UserCreateRequest(
                phone="123456",
                first_name="Test",
                last_name="User",
                user_type="traveler",
            )

    def test_user_create_request_weak_password(self):
        """Test user creation fails with weak password"""
        with pytest.raises(PydanticValidationError):
            UserCreateRequest(
                email="test@example.com",
                password="short",
                first_name="Test",
                last_name="User",
                user_type="traveler",
            )

    def test_user_create_request_invalid_user_type(self):
        """Test user creation fails with invalid user type"""
        with pytest.raises(PydanticValidationError):
            UserCreateRequest(
                email="test@example.com",
                password="password123",
                first_name="Test",
                last_name="User",
                user_type="invalid_type",
            )

    def test_user_create_request_admin_user_type_forbidden(self):
        """Test user creation fails when admin user type is used in public signup"""
        with pytest.raises(PydanticValidationError):
            UserCreateRequest(
                email="test@example.com",
                password="password123",
                first_name="Test",
                last_name="User",
                user_type="admin",
            )


class TestServiceCreateRequestValidation:
    """Tests for ServiceCreateRequest schema validation"""

    def test_valid_service_create_request(self):
        """Test valid service creation request"""
        request = ServiceCreateRequest(
            title="Beautiful Apartment in Douala",
            description="This is a beautiful apartment with all modern amenities. Perfect for families and business travelers.",
            service_type="accommodation",
            accommodation_type="apartment",
            country="Cameroun",
            city="Douala",
            address="123 Main Street",
            base_price=25000.0,
        )
        assert request.title == "Beautiful Apartment in Douala"
        assert request.service_type.value == "accommodation"

    def test_service_create_request_short_title(self):
        """Test service creation fails with short title"""
        with pytest.raises(PydanticValidationError):
            ServiceCreateRequest(
                title="Short",
                description="This is a description with enough characters to pass validation",
                service_type="accommodation",
                country="Cameroun",
                city="Douala",
                address="123 Main Street",
                base_price=25000.0,
            )

    def test_service_create_request_short_description(self):
        """Test service creation fails with short description"""
        with pytest.raises(PydanticValidationError):
            ServiceCreateRequest(
                title="Beautiful Apartment in Douala",
                description="Short",
                service_type="accommodation",
                country="Cameroun",
                city="Douala",
                address="123 Main Street",
                base_price=25000.0,
            )

    def test_service_create_request_negative_price(self):
        """Test service creation fails with negative price"""
        with pytest.raises(PydanticValidationError):
            ServiceCreateRequest(
                title="Beautiful Apartment in Douala",
                description="This is a description with enough characters to pass validation",
                service_type="accommodation",
                country="Cameroun",
                city="Douala",
                address="123 Main Street",
                base_price=-1000.0,
            )

    def test_service_create_request_invalid_latitude(self):
        """Test service creation fails with invalid latitude"""
        with pytest.raises(PydanticValidationError):
            ServiceCreateRequest(
                title="Beautiful Apartment in Douala",
                description="This is a description with enough characters to pass validation",
                service_type="accommodation",
                country="Cameroun",
                city="Douala",
                address="123 Main Street",
                base_price=25000.0,
                latitude=100.0,  # Invalid (> 90)
            )


class TestBookingCreateRequestValidation:
    """Tests for BookingCreateRequest schema validation"""

    def test_valid_booking_create_request(self):
        """Test valid booking creation request"""
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)

        request = BookingCreateRequest(
            service_id="123e4567-e89b-12d3-a456-426614174000",
            start_date=start_date,
            end_date=end_date,
            guests=2,
        )
        assert request.guests == 2
        assert request.start_date == start_date

    def test_booking_create_request_invalid_guests(self):
        """Test booking creation fails with invalid guest count"""
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)

        with pytest.raises(PydanticValidationError):
            BookingCreateRequest(
                service_id="123e4567-e89b-12d3-a456-426614174000",
                start_date=start_date,
                end_date=end_date,
                guests=0,
            )

    def test_booking_create_request_invalid_dates(self):
        """Test booking creation fails with end date before start date"""
        start_date = date.today() + timedelta(days=10)
        end_date = start_date - timedelta(days=1)

        with pytest.raises(PydanticValidationError):
            BookingCreateRequest(
                service_id="123e4567-e89b-12d3-a456-426614174000",
                start_date=start_date,
                end_date=end_date,
                guests=2,
            )
