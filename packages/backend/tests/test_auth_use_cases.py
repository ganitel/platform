"""
Ganitel V2 Backend - Authentication Use Cases Tests
"""
from uuid import uuid4

import pytest
from passlib.context import CryptContext

from app.application.use_cases.auth import (
    LoginUserUseCase,
    RefreshTokenUseCase,
    RegisterUserUseCase,
)
from app.domain.entities.user import User, UserStatus, UserType
from app.exceptions import (
    AuthorizationError,
    ConflictError,
    UserNotFoundError,
    ValidationError,
)
from tests.helpers import unique_email, unique_phone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TestRegisterUserUseCase:
    """Tests for RegisterUserUseCase"""

    def test_register_user_with_email_success(self, user_repository):
        """Test successful user registration with email"""
        use_case = RegisterUserUseCase(user_repository)
        email = unique_email()

        user = use_case.execute(
            email=email,
            password="password123",
            first_name="New",
            last_name="User",
            user_type="traveler"
        )

        assert user.email == email
        assert user.first_name == "New"
        assert user.last_name == "User"
        assert user.user_type == UserType.TRAVELER.value
        assert user.status == UserStatus.PENDING_VERIFICATION.value
        assert user.hashed_password is not None

    def test_register_user_with_phone_success(self, user_repository):
        """Test successful user registration with phone"""
        use_case = RegisterUserUseCase(user_repository)
        phone = unique_phone()

        user = use_case.execute(
            phone=phone,
            first_name="Phone",
            last_name="User",
            user_type="traveler"
        )

        assert user.phone == phone
        assert user.email is None
        assert user.hashed_password is None

    def test_register_user_provider(self, user_repository):
        """Test provider registration"""
        use_case = RegisterUserUseCase(user_repository)

        user = use_case.execute(
            email=unique_email(),
            password="password123",
            first_name="Provider",
            last_name="User",
            user_type="provider"
        )

        assert user.user_type == UserType.PROVIDER.value

    def test_register_user_admin_forbidden_in_public_flow(self, user_repository):
        """Test admin registration is forbidden in public flow"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(AuthorizationError, match="Public registration is only allowed"):
            use_case.execute(
                email=unique_email(),
                password="password123",
                first_name="Admin",
                last_name="User",
                user_type="admin"
            )

    def test_register_user_missing_email_and_phone(self, user_repository):
        """Test registration fails without email or phone"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Either email or phone must be provided"):
            use_case.execute(
                first_name="Test",
                last_name="User",
                user_type="traveler"
            )

    def test_register_user_missing_name(self, user_repository):
        """Test registration fails without first or last name"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ValidationError):
            use_case.execute(
                email="test@example.com",
                password="password123",
                user_type="traveler"
            )

    def test_register_user_invalid_email(self, user_repository):
        """Test registration fails with invalid email"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Invalid email format"):
            use_case.execute(
                email="invalid-email",
                password="password123",
                first_name="Test",
                last_name="User",
                user_type="traveler"
            )

    def test_register_user_invalid_phone(self, user_repository):
        """Test registration fails with invalid phone"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Invalid phone format"):
            use_case.execute(
                phone="123456",
                first_name="Test",
                last_name="User",
                user_type="traveler"
            )

    def test_register_user_weak_password(self, user_repository):
        """Test registration fails with weak password"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Password must be at least 8 characters"):
            use_case.execute(
                email=unique_email(),
                password="short",
                first_name="Test",
                last_name="User",
                user_type="traveler"
            )

    def test_register_user_password_without_letter(self, user_repository):
        """Test registration fails with password without letter"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Password must contain at least one letter"):
            use_case.execute(
                email=unique_email(),
                password="12345678",
                first_name="Test",
                last_name="User",
                user_type="traveler"
            )

    def test_register_user_duplicate_email(self, user_repository, sample_user):
        """Test registration fails with duplicate email"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ConflictError, match="Email already registered"):
            use_case.execute(
                email=sample_user.email,
                password="password123",
                first_name="Test",
                last_name="User",
                user_type="traveler"
            )

    def test_register_user_duplicate_phone(self, user_repository, sample_user):
        """Test registration fails with duplicate phone"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ConflictError, match="Phone number already registered"):
            use_case.execute(
                phone=sample_user.phone,
                first_name="Test",
                last_name="User",
                user_type="traveler"
            )

    def test_register_user_invalid_user_type(self, user_repository):
        """Test registration fails with invalid user type"""
        use_case = RegisterUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Invalid user type"):
            use_case.execute(
                email="test@example.com",
                password="password123",
                first_name="Test",
                last_name="User",
                user_type="invalid_type"
            )


class TestLoginUserUseCase:
    """Tests for LoginUserUseCase"""

    def test_login_with_email_success(self, user_repository, sample_user, mock_redis):
        """Test successful login with email"""
        use_case = LoginUserUseCase(user_repository)

        token_data = use_case.execute(
            identifier=sample_user.email,
            password="password123",
            redis_client=mock_redis
        )

        assert token_data.access_token is not None
        assert token_data.refresh_token is not None
        assert token_data.token_type == "bearer"

    def test_login_with_phone_success(self, user_repository, sample_user, mock_redis):
        """Test successful login with phone"""
        use_case = LoginUserUseCase(user_repository)

        token_data = use_case.execute(
            identifier=sample_user.phone,
            password="password123",
            redis_client=mock_redis
        )

        assert token_data.access_token is not None
        assert token_data.refresh_token is not None

    def test_login_user_not_found(self, user_repository, mock_redis):
        """Test login fails with non-existent user"""
        use_case = LoginUserUseCase(user_repository)

        with pytest.raises(UserNotFoundError, match="Invalid credentials"):
            use_case.execute(
                identifier="nonexistent@example.com",
                password="password123",
                redis_client=mock_redis
            )

    def test_login_wrong_password(self, user_repository, sample_user, mock_redis):
        """Test login fails with wrong password"""
        use_case = LoginUserUseCase(user_repository)

        with pytest.raises(AuthorizationError, match="Invalid credentials"):
            use_case.execute(
                identifier=sample_user.email,
                password="wrongpassword",
                redis_client=mock_redis
            )

    def test_login_suspended_user(self, user_repository, db_session, mock_redis):
        """Test login fails for suspended user"""
        user = User(
            id=uuid4(),
            email="suspended@example.com",
            phone="+237690000200",
            first_name="Suspended",
            last_name="User",
            hashed_password=pwd_context.hash("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.SUSPENDED.value,
            is_verified=True,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = LoginUserUseCase(user_repository)

        with pytest.raises(AuthorizationError, match="Account is suspended"):
            use_case.execute(
                identifier=user.email,
                password="password123",
                redis_client=mock_redis
            )

    def test_login_inactive_user(self, user_repository, db_session, mock_redis):
        """Test login fails for inactive user"""
        user = User(
            id=uuid4(),
            email="inactive@example.com",
            phone="+237690000201",
            first_name="Inactive",
            last_name="User",
            hashed_password=pwd_context.hash("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.INACTIVE.value,
            is_verified=False,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        use_case = LoginUserUseCase(user_repository)

        with pytest.raises(AuthorizationError, match="Account is inactive"):
            use_case.execute(
                identifier=user.email,
                password="password123",
                redis_client=mock_redis
            )

    def test_login_missing_identifier(self, user_repository, mock_redis):
        """Test login fails without identifier"""
        use_case = LoginUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Identifier.*required"):
            use_case.execute(
                identifier="",
                password="password123",
                redis_client=mock_redis
            )

    def test_login_missing_password(self, user_repository, sample_user, mock_redis):
        """Test login fails without password"""
        use_case = LoginUserUseCase(user_repository)

        with pytest.raises(ValidationError, match="Password is required"):
            use_case.execute(
                identifier=sample_user.email,
                password="",
                redis_client=mock_redis
            )


class TestRefreshTokenUseCase:
    """Tests for RefreshTokenUseCase"""

    def test_refresh_token_success(self, user_repository, sample_user, mock_redis):
        """Test successful token refresh"""
        login_use_case = LoginUserUseCase(user_repository)
        refresh_use_case = RefreshTokenUseCase(user_repository)

        # First login to get tokens
        token_data = login_use_case.execute(
            identifier=sample_user.email,
            password="password123",
            redis_client=mock_redis
        )

        # Refresh token
        new_token_data = refresh_use_case.execute(
            refresh_token=token_data.refresh_token,
            redis_client=mock_redis
        )

        assert new_token_data.access_token is not None
        assert new_token_data.refresh_token is not None
        assert new_token_data.access_token != token_data.access_token

    def test_refresh_token_invalid(self, user_repository, mock_redis):
        """Test refresh fails with invalid token"""
        refresh_use_case = RefreshTokenUseCase(user_repository)

        with pytest.raises(AuthorizationError, match="Invalid refresh token"):
            refresh_use_case.execute(
                refresh_token="invalid_token",
                redis_client=mock_redis
            )

