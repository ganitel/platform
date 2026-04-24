"""
Ganitel V2 Backend - Forgot Password Use Case
"""

import secrets
from datetime import datetime, timedelta

from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import ValidationError


class ForgotPasswordUseCase:
    """
    Use case for initiating password reset
    Generates reset token and sends email/SMS
    """

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def execute(self, email: str | None = None, phone: str | None = None) -> dict:
        """
        Initiate password reset process

        Args:
            email: User email (optional)
            phone: User phone (optional)

        Returns:
            dict: Contains reset token and expiration info

        Raises:
            ValidationError: If neither email nor phone provided
            UserNotFoundError: If user not found
        """
        if not email and not phone:
            raise ValidationError("Either email or phone must be provided")

        # Find user by email or phone
        user = None
        if email:
            user = self.user_repository.get_by_email(email.strip().lower())
        elif phone:
            user = self.user_repository.get_by_phone(phone.strip())

        if not user:
            # Don't reveal if user exists for security
            return {
                "message": "If the email/phone exists, a reset link will be sent",
                "success": True,
            }

        # Check if user uses email auth
        if email and user.auth_type != "email":
            raise ValidationError("This account uses a different authentication method")

        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry

        # Update user with reset token
        self.user_repository.update_reset_token(
            user_id=user.id, token=reset_token, expires_at=expires_at
        )

        # In production, send email/SMS here
        # For now, return token (should be sent via email in production)

        return {
            "message": "Password reset link sent to your email/phone",
            "success": True,
            "token": reset_token,  # Remove in production, only for testing
            "expires_at": expires_at.isoformat(),
        }
