"""
Ganitel V2 Backend - User Entity
"""

from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

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
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    phone: Mapped[str | None] = mapped_column(
        String(20), unique=True, index=True, nullable=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Authentication
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_type: Mapped[str] = mapped_column(
        String(20), default=UserType.TRAVELER.value, nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20),
        default=UserStatus.PENDING_VERIFICATION.value,
        nullable=False,
        index=True,
    )

    # Verification Status
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Profile Information
    profile_picture: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Location Information
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Preferences
    language: Mapped[str | None] = mapped_column(
        String(10), default="fr", nullable=True
    )
    currency: Mapped[str | None] = mapped_column(
        String(10), default="XAF", nullable=True
    )

    # Platform Activity
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Password Reset
    reset_password_token: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    reset_password_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # OAuth
    auth_type: Mapped[str] = mapped_column(
        String(20), default="email", nullable=False
    )  # email, google, facebook
    oauth_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )  # OAuth provider user ID
    oauth_provider: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # google, facebook

    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, type={self.user_type})>"
