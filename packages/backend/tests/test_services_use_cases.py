"""
Ganitel V2 Backend - Service Use Cases Tests
"""
from uuid import uuid4

import pytest
from passlib.context import CryptContext

from app.application.use_cases.services import (
    CreateServiceUseCase,
    UpdateServiceStatusUseCase,
)
from app.domain.entities.service import AccommodationType, ServiceStatus, ServiceType
from app.exceptions import (
    AuthorizationError,
    ServiceNotFoundError,
    UserNotFoundError,
    ValidationError,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestCreateServiceUseCase:
    """Tests for CreateServiceUseCase"""

    def test_create_service_success(self, user_repository, service_repository, sample_provider):
        """Test successful service creation"""
        use_case = CreateServiceUseCase(service_repository, user_repository)

        service = use_case.execute(
            provider_id=str(sample_provider.id),
            title="Beautiful Apartment in Douala",
            description="This is a beautiful apartment with all modern amenities. Perfect for families and business travelers. Located in the heart of the city with easy access to restaurants, shopping, and entertainment.",
            service_type=ServiceType.ACCOMMODATION,
            country="Cameroun",
            city="Douala",
            address="123 Main Street, Douala",
            base_price=30000.0,
            currency="XAF",
            accommodation_type=AccommodationType.APARTMENT,
            max_guests=4,
            bedrooms=2,
            bathrooms=1
        )

        assert service.title == "Beautiful Apartment in Douala"
        assert service.provider_id == sample_provider.id
        assert service.status == ServiceStatus.DRAFT.value
        assert service.slug is not None

    def test_create_service_non_provider(self, user_repository, service_repository, sample_user):
        """Test service creation fails for non-provider"""
        use_case = CreateServiceUseCase(service_repository, user_repository)

        with pytest.raises(ValidationError, match="provider"):
            use_case.execute(
                provider_id=str(sample_user.id),
                title="Test Service",
                description="Test description with enough characters to pass validation",
                service_type=ServiceType.ACCOMMODATION,
                country="Cameroun",
                city="Douala",
                address="123 Test Street",
                base_price=25000.0,
                currency="XAF"
            )

    def test_create_service_provider_not_found(self, user_repository, service_repository):
        """Test service creation fails for non-existent provider"""
        use_case = CreateServiceUseCase(service_repository, user_repository)

        with pytest.raises(UserNotFoundError):
            use_case.execute(
                provider_id=str(uuid4()),
                title="Test Service",
                description="Test description with enough characters to pass validation",
                service_type=ServiceType.ACCOMMODATION,
                country="Cameroun",
                city="Douala",
                address="123 Test Street",
                base_price=25000.0,
                currency="XAF"
            )

    def test_create_service_missing_accommodation_type(self, user_repository, service_repository, sample_provider):
        """Test service creation succeeds even without accommodation type (optional field)"""
        use_case = CreateServiceUseCase(service_repository, user_repository)

        # accommodation_type is optional, so this should succeed
        service = use_case.execute(
            provider_id=str(sample_provider.id),
            title="Test Service",
            description="Test description with enough characters to pass validation",
            service_type=ServiceType.ACCOMMODATION,
            country="Cameroun",
            city="Douala",
            address="123 Test Street",
            base_price=25000.0,
            currency="XAF"
        )

        assert service is not None
        assert service.accommodation_type is None


class TestUpdateServiceStatusUseCase:
    """Tests for UpdateServiceStatusUseCase"""

    def test_update_status_draft_to_pending_review(self, service_repository, sample_service, sample_provider):
        """Test successful status transition: draft → pending_review"""
        # Set service to draft
        sample_service.status = ServiceStatus.DRAFT.value
        service_repository.update(sample_service)

        use_case = UpdateServiceStatusUseCase(service_repository)

        updated_service = use_case.execute(
            service_id=sample_service.id,
            new_status=ServiceStatus.PENDING_REVIEW,
            provider_id=sample_provider.id,
            is_admin=False
        )

        assert updated_service.status == ServiceStatus.PENDING_REVIEW.value

    def test_update_status_pending_to_active_admin(self, service_repository, sample_service, sample_admin):
        """Test admin can approve service: pending_review → active"""
        sample_service.status = ServiceStatus.PENDING_REVIEW.value
        service_repository.update(sample_service)

        use_case = UpdateServiceStatusUseCase(service_repository)

        updated_service = use_case.execute(
            service_id=sample_service.id,
            new_status=ServiceStatus.ACTIVE,
            updated_by=sample_admin.id,
            is_admin=True
        )

        assert updated_service.status == ServiceStatus.ACTIVE.value

    def test_update_status_pending_to_rejected_admin(self, service_repository, sample_service, sample_admin):
        """Test admin can reject service: pending_review → rejected"""
        sample_service.status = ServiceStatus.PENDING_REVIEW.value
        service_repository.update(sample_service)

        use_case = UpdateServiceStatusUseCase(service_repository)

        updated_service = use_case.execute(
            service_id=sample_service.id,
            new_status=ServiceStatus.REJECTED,
            updated_by=sample_admin.id,
            is_admin=True
        )

        assert updated_service.status == ServiceStatus.REJECTED.value

    def test_update_status_active_to_inactive(self, service_repository, sample_service, sample_provider):
        """Test successful status transition: active → inactive"""
        use_case = UpdateServiceStatusUseCase(service_repository)

        updated_service = use_case.execute(
            service_id=sample_service.id,
            new_status=ServiceStatus.INACTIVE,
            provider_id=sample_provider.id,
            is_admin=False
        )

        assert updated_service.status == ServiceStatus.INACTIVE.value

    def test_update_status_inactive_to_active(self, service_repository, sample_service, sample_provider):
        """Test successful status transition: inactive → active"""
        sample_service.status = ServiceStatus.INACTIVE.value
        service_repository.update(sample_service)

        use_case = UpdateServiceStatusUseCase(service_repository)

        updated_service = use_case.execute(
            service_id=sample_service.id,
            new_status=ServiceStatus.ACTIVE,
            provider_id=sample_provider.id,
            is_admin=False
        )

        assert updated_service.status == ServiceStatus.ACTIVE.value

    def test_update_status_unauthorized(self, service_repository, sample_service, sample_user):
        """Test status update fails for non-owner and non-admin"""
        use_case = UpdateServiceStatusUseCase(service_repository)

        with pytest.raises(AuthorizationError, match="Only the service provider or admin"):
            use_case.execute(
                service_id=sample_service.id,
                new_status=ServiceStatus.INACTIVE,
                provider_id=sample_user.id,
                is_admin=False
            )

    def test_update_status_admin_only_transition(self, service_repository, sample_service, sample_provider):
        """Test admin-only transitions require admin"""
        sample_service.status = ServiceStatus.PENDING_REVIEW.value
        service_repository.update(sample_service)

        use_case = UpdateServiceStatusUseCase(service_repository)

        with pytest.raises(AuthorizationError, match="Only administrators can approve"):
            use_case.execute(
                service_id=sample_service.id,
                new_status=ServiceStatus.ACTIVE,
                provider_id=sample_provider.id,
                is_admin=False
            )

    def test_update_status_invalid_transition(self, service_repository, sample_service, sample_provider):
        """Test status update fails with invalid transition"""
        use_case = UpdateServiceStatusUseCase(service_repository)

        with pytest.raises(ValidationError, match="Cannot transition"):
            use_case.execute(
                service_id=sample_service.id,
                new_status=ServiceStatus.REJECTED,
                provider_id=sample_provider.id,
                is_admin=False
            )

    def test_update_status_not_found(self, service_repository, sample_provider):
        """Test status update fails for non-existent service"""
        use_case = UpdateServiceStatusUseCase(service_repository)

        with pytest.raises(ServiceNotFoundError):
            use_case.execute(
                service_id=uuid4(),
                new_status=ServiceStatus.ACTIVE,
                provider_id=sample_provider.id,
                is_admin=False
            )

