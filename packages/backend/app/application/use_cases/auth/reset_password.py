"""
Ganitel V2 Backend - Reset Password Use Case
"""
from passlib.context import CryptContext

from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import AuthorizationError, ValidationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class ResetPasswordUseCase:
    """
    Use case for resetting password with token
    """

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def execute(self, token: str, new_password: str) -> dict:
        """
        Reset password using reset token

        Args:
            token: Password reset token
            new_password: New password

        Returns:
            dict: Success message

        Raises:
            ValidationError: If validation fails
            UserNotFoundError: If token is invalid or expired
            AuthorizationError: If token is invalid
        """
        if not token:
            raise ValidationError("Reset token is required")

        if not new_password:
            raise ValidationError("New password is required")

        # Validate password strength
        if len(new_password) < 8:
            raise ValidationError("Password must be at least 8 characters long")

        if not self._is_strong_password(new_password):
            raise ValidationError("Password must contain at least one letter and one number")

        # Find user by reset token
        user = self.user_repository.get_by_reset_token(token)

        if not user:
            raise AuthorizationError("Invalid or expired reset token")

        # Hash new password
        hashed_password = pwd_context.hash(new_password)

        # Update password and clear reset token
        self.user_repository.change_password(user.id, hashed_password)
        self.user_repository.clear_reset_token(user.id)

        return {
            "message": "Password reset successfully",
            "success": True
        }

    def _is_strong_password(self, password: str) -> bool:
        """Check if password is strong enough"""
        has_letter = any(c.isalpha() for c in password)
        has_digit = any(c.isdigit() for c in password)
        return has_letter and has_digit

