"""
Ganitel V2 Backend - Verify User Use Case
"""

from typing import Literal
from uuid import UUID

from app.domain.entities.user import User, UserStatus
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import UserNotFoundError, ValidationError


class VerifyUserUseCase:
    """
    Use case for verifying user email or phone
    """

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def execute(
        self, user_id: UUID, verification_type: Literal["email", "phone"]
    ) -> User:
        """
        Verify user email or phone

        Args:
            user_id: User ID
            verification_type: Type of verification ("email" or "phone")

        Returns:
            User: Updated user entity

        Raises:
            UserNotFoundError: If user not found
            ValidationError: If verification type is invalid
        """
        user = self.user_repository.get_by_id(user_id)

        if not user:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        # Verify based on type
        if verification_type == "email":
            if not user.email:
                raise ValidationError("User does not have an email to verify")
            # In a real implementation, you would verify the verification code/token here
            user.is_verified = True
        elif verification_type == "phone":
            if not user.phone:
                raise ValidationError("User does not have a phone to verify")
            # In a real implementation, you would verify the OTP here
            user.is_verified = True
        else:
            raise ValidationError(f"Invalid verification type: {verification_type}")

        # If verified and currently inactive, activate
        if user.is_verified and user.status == UserStatus.PENDING_VERIFICATION.value:
            user.status = UserStatus.ACTIVE.value

        # Save changes
        updated_user = self.user_repository.update(user)

        return updated_user
