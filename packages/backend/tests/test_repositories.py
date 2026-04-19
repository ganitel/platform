"""
Ganitel V2 Backend - Repository Tests
"""
import pytest
from uuid import uuid4
from datetime import timedelta
from app.domain.entities.user import User, UserType, UserStatus
from app.domain.entities.service import Service, ServiceType, ServiceStatus, AccommodationType
from app.domain.entities.booking import Booking, BookingStatus
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestUserRepository:
    """Tests for UserRepository"""
    
    def test_create_user(self, user_repository):
        """Test user creation"""
        user = User(
            id=uuid4(),
            email="repo@example.com",
            phone="+237690003000",
            first_name="Repo",
            last_name="Test",
            hashed_password=pwd_context.hash("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.ACTIVE.value,
            is_verified=True,
            is_active=True,
        )
        
        created_user = user_repository.create(user)
        assert created_user.id == user.id
        assert created_user.email == user.email
    
    def test_get_user_by_id(self, user_repository, sample_user):
        """Test get user by ID"""
        user = user_repository.get_by_id(sample_user.id)
        assert user is not None
        assert user.id == sample_user.id
    
    def test_get_user_by_email(self, user_repository, sample_user):
        """Test get user by email"""
        user = user_repository.get_by_email(sample_user.email)
        assert user is not None
        assert user.email == sample_user.email
    
    def test_get_user_by_phone(self, user_repository, sample_user):
        """Test get user by phone"""
        user = user_repository.get_by_phone(sample_user.phone)
        assert user is not None
        assert user.phone == sample_user.phone
    
    def test_update_user(self, user_repository, sample_user):
        """Test user update"""
        sample_user.first_name = "Updated"
        updated_user = user_repository.update(sample_user)
        assert updated_user.first_name == "Updated"
    
    def test_soft_delete_user(self, user_repository, sample_user):
        """Test user soft delete"""
        result = user_repository.soft_delete(sample_user.id)
        assert result is True
        
        # User should not be found after soft delete
        user = user_repository.get_by_id(sample_user.id)
        assert user is None
    
    def test_count_users(self, user_repository, sample_user):
        """Test user count"""
        count = user_repository.count()
        assert count >= 1
    
    def test_search_users(self, user_repository, sample_user):
        """Test user search"""
        users = user_repository.search_users("Test", skip=0, limit=10)
        assert len(users) >= 1
        assert any(u.id == sample_user.id for u in users)


class TestServiceRepository:
    """Tests for ServiceRepository"""
    
    def test_create_service(self, service_repository, sample_provider):
        """Test service creation"""
        service = Service(
            id=uuid4(),
            provider_id=sample_provider.id,
            title="Repository Test Service",
            description="This is a test service description with enough characters to pass validation",
            service_type=ServiceType.ACCOMMODATION.value,
            accommodation_type=AccommodationType.APARTMENT.value,
            status=ServiceStatus.DRAFT.value,
            country="Cameroun",
            city="Douala",
            address="123 Test Street",
            base_price=25000.0,
            currency="XAF",
            is_active=True,
        )
        service.generate_slug()
        
        created_service = service_repository.create(service)
        assert created_service.id == service.id
        assert created_service.title == service.title
    
    def test_get_service_by_id(self, service_repository, sample_service):
        """Test get service by ID"""
        service = service_repository.get_by_id(sample_service.id)
        assert service is not None
        assert service.id == sample_service.id
    
    def test_get_services_by_provider(self, service_repository, sample_service, sample_provider):
        """Test get services by provider"""
        services = service_repository.get_by_provider_id(sample_provider.id)
        assert len(services) >= 1
        assert any(s.id == sample_service.id for s in services)
    
    def test_update_service(self, service_repository, sample_service):
        """Test service update"""
        sample_service.title = "Updated Title"
        updated_service = service_repository.update(sample_service)
        assert updated_service.title == "Updated Title"
    
    def test_search_services(self, service_repository, sample_service):
        """Test service search"""
        result = service_repository.search_services(
            query="Test",
            skip=0,
            limit=10
        )
        assert len(result) >= 1

    def test_get_available_services_excludes_conflicting_booking(
        self,
        service_repository,
        sample_service,
        sample_service_2,
        sample_booking,
    ):
        """Test availability excludes services with overlapping bookings"""
        check_in = sample_booking.start_date + timedelta(days=1)
        check_out = sample_booking.end_date

        available = service_repository.get_available_services(
            check_in=check_in,
            check_out=check_out,
            skip=0,
            limit=20,
        )
        available_ids = {service.id for service in available}

        assert sample_service.id not in available_ids
        assert sample_service_2.id in available_ids


class TestBookingRepository:
    """Tests for BookingRepository"""
    
    def test_create_booking(self, booking_repository, sample_user, sample_service):
        """Test booking creation"""
        from datetime import date, timedelta
        
        start_date = date.today() + timedelta(days=15)
        end_date = start_date + timedelta(days=3)
        nights = (end_date - start_date).days
        total_amount = float(sample_service.base_price) * nights
        
        booking = Booking(
            id=uuid4(),
            user_id=sample_user.id,
            service_id=sample_service.id,
            start_date=start_date,
            end_date=end_date,
            guests=2,
            status=BookingStatus.PENDING.value,
            total_amount=total_amount,
            currency="XAF",
            is_active=True,
        )
        
        created_booking = booking_repository.create(booking)
        assert created_booking.id == booking.id
        assert created_booking.user_id == sample_user.id
    
    def test_get_booking_by_id(self, booking_repository, sample_booking):
        """Test get booking by ID"""
        booking = booking_repository.get_by_id(sample_booking.id)
        assert booking is not None
        assert booking.id == sample_booking.id
    
    def test_get_bookings_by_user(self, booking_repository, sample_booking, sample_user):
        """Test get bookings by user"""
        bookings = booking_repository.get_by_user_id(sample_user.id)
        assert len(bookings) >= 1
        assert any(b.id == sample_booking.id for b in bookings)
    
    def test_update_booking(self, booking_repository, sample_booking):
        """Test booking update"""
        sample_booking.notes = "Updated notes"
        updated_booking = booking_repository.update(sample_booking)
        assert updated_booking.notes == "Updated notes"

