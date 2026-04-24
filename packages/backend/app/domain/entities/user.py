"""
Ganitel V2 Backend - User Entity
"""

from enum import StrEnum

from sqlalchemy import Boolean, Column, DateTime, String, Text

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class UserType(StrEnum):
    """User type enumeration"""

    TRAVELER = "traveler"
    PROVIDER = "provider"
    ADMIN = "admin"


class UserStatus(StrEnum):
    """User status enumeration"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class User(AuditableEntity, SoftDeleteEntity):
    """User entity for all platform users"""

    __tablename__ = "users"

    # Basic Information
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)

    # Authentication
    hashed_password = Column(String(255), nullable=True)
    user_type = Column(
        String(20), default=UserType.TRAVELER.value, nullable=False, index=True
    )
    status = Column(
        String(20),
        default=UserStatus.PENDING_VERIFICATION.value,
        nullable=False,
        index=True,
    )

    # Verification Status
    is_verified = Column(Boolean, default=False, nullable=False)

    # Profile Information
    profile_picture = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)

    # Location Information
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)

    # Preferences
    language = Column(String(10), default="fr", nullable=True)
    currency = Column(String(10), default="XAF", nullable=True)

    # Platform Activity
    last_login_at = Column(DateTime, nullable=True)

    # Password Reset
    reset_password_token = Column(String(255), nullable=True, index=True)
    reset_password_expires_at = Column(DateTime, nullable=True)

    # OAuth
    auth_type = Column(
        String(20), default="email", nullable=False
    )  # email, google, facebook
    oauth_id = Column(String(255), nullable=True, index=True)  # OAuth provider user ID
    oauth_provider = Column(String(20), nullable=True)  # google, facebook

    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, type={self.user_type})>"
