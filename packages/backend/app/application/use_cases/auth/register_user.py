"""
Ganitel V2 Backend - Register User Use Case
"""

from typing import ClassVar
from uuid import uuid4

from passlib.context import CryptContext

from app.domain.entities.user import User, UserStatus, UserType
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import AuthorizationError, ConflictError, ValidationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterUserUseCase:
    """
    Use case for user registration
    Handles registration for travelers, providers, and admins
    """

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    ALLOWED_PUBLIC_USER_TYPES: ClassVar[set] = {
        UserType.TRAVELER,
        UserType.PROVIDER,
    }

    def execute(
        self,
        email: str | None = None,
        phone: str | None = None,
        password: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
        user_type: str = "traveler",
        country: str | None = None,
        city: str | None = None,
        allow_admin_registration: bool = False,
    ) -> User:
        """
        Register a new user

        Args:
            email: User email (optional, but either email or phone required)
            phone: User phone (optional, but either email or phone required)
            password: User password (required for email registration)
            first_name: User first name
            last_name: User last name
            user_type: User type (traveler, provider, admin)
            country: User country
            city: User city
            allow_admin_registration: Allows admin registration for controlled internal flows only

        Returns:
            User: Created user entity

        Raises:
            ValidationError: If validation fails
            ConflictError: If user already exists
        """
        # Validate inputs
        if not email and not phone:
            raise ValidationError("Either email or phone must be provided")

        if not first_name or not last_name:
            raise ValidationError("First name and last name are required")

        if not first_name.strip() or not last_name.strip():
            raise ValidationError("First name and last name cannot be empty")

        # Validate user type
        try:
            user_type_enum = UserType(user_type.lower())
        except ValueError:
            raise ValidationError(
                f"Invalid user type: {user_type}. Must be one of: traveler, provider, admin"
            ) from None

        if (
            not allow_admin_registration
            and user_type_enum not in self.ALLOWED_PUBLIC_USER_TYPES
        ):
            raise AuthorizationError(
                "Public registration is only allowed for traveler and provider accounts"
            )

        # Validate email if provided
        if email:
            email = email.strip().lower()
            if not self._is_valid_email(email):
                raise ValidationError("Invalid email format")

            # Check if email already exists
            existing_user = self.user_repository.get_by_email(email)
            if existing_user:
                raise ConflictError("Email already registered")

        # Validate phone if provided
        if phone:
            phone = phone.strip()
            if not self._is_valid_phone(phone):
                raise ValidationError(
                    "Invalid phone format. Must be in international format (e.g., +237690000000)"
                )

            # Check if phone already exists
            existing_user = self.user_repository.get_by_phone(phone)
            if existing_user:
                raise ConflictError("Phone number already registered")

        # Password validation (required for email registration)
        if email and not password:
            raise ValidationError("Password is required for email registration")

        if password:
            if len(password) < 8:
                raise ValidationError("Password must be at least 8 characters long")
            if not self._is_strong_password(password):
                raise ValidationError(
                    "Password must contain at least one letter and one number"
                )

        # Hash password if provided
        hashed_password = None
        if password:
            hashed_password = pwd_context.hash(password)

        # Determine initial status based on user type
        # According to architecture: new users start as "inactive" (pending verification)
        # Admin users can be created as "active" if needed
        initial_status = UserStatus.PENDING_VERIFICATION
        is_verified = False

        # Create user entity
        user = User(
            id=uuid4(),
            email=email,
            phone=phone,
            hashed_password=hashed_password,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            user_type=user_type_enum.value,
            status=initial_status.value,
            is_verified=is_verified,
            country=country,
            city=city,
            is_active=True,
        )

        # Save user
        created_user = self.user_repository.create(user)

        return created_user

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        import re

        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    def _is_valid_phone(self, phone: str) -> bool:
        """Validate phone format (international format)"""
        import re

        # International format: + followed by 1-15 digits
        pattern = r"^\+\d{1,15}$"
        return bool(re.match(pattern, phone))

    def _is_strong_password(self, password: str) -> bool:
        """Check if password is strong enough"""
        has_letter = any(c.isalpha() for c in password)
        has_digit = any(c.isdigit() for c in password)
        return has_letter and has_digit
