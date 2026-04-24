"""
Ganitel V2 Backend - Change Password Use Case
"""
from uuid import UUID

from passlib.context import CryptContext

from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import AuthorizationError, UserNotFoundError, ValidationError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class ChangePasswordUseCase:
    """
    Use case for changing user password
    """

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def execute(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str
    ) -> bool:
        """
        Change user password

        Args:
            user_id: User ID
            current_password: Current password
            new_password: New password

        Returns:
            bool: True if successful

        Raises:
            UserNotFoundError: If user not found
            ValidationError: If validation fails
            AuthorizationError: If current password is incorrect
        """
        user = self.user_repository.get_by_id(user_id)

        if not user:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        # Validate new password
        if len(new_password) < 8:
            raise ValidationError("New password must be at least 8 characters long")

        has_letter = any(c.isalpha() for c in new_password)
        has_digit = any(c.isdigit() for c in new_password)
        if not (has_letter and has_digit):
            raise ValidationError("New password must contain at least one letter and one number")

        # Verify current password
        if not user.hashed_password:
            raise AuthorizationError("Password not set for this account")

        if not pwd_context.verify(current_password, user.hashed_password):
            raise AuthorizationError("Current password is incorrect")

        # Hash new password
        new_hashed_password = pwd_context.hash(new_password)

        # Update password
        success = self.user_repository.change_password(user_id, new_hashed_password)

        return success

