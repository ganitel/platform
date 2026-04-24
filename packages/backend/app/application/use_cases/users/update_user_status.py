"""
Ganitel V2 Backend - Update User Status Use Case
"""

from typing import ClassVar
from uuid import UUID

from app.domain.entities.user import User, UserStatus
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import UserNotFoundError, ValidationError


class UpdateUserStatusUseCase:
    """
    Use case for updating user status with transition validation
    """

    # Valid status transitions
    VALID_TRANSITIONS: ClassVar[dict] = {
        UserStatus.PENDING_VERIFICATION: [UserStatus.ACTIVE, UserStatus.INACTIVE],
        UserStatus.INACTIVE: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
        UserStatus.ACTIVE: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
        UserStatus.SUSPENDED: [UserStatus.ACTIVE],
    }

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def execute(
        self, user_id: UUID, new_status: UserStatus, updated_by: UUID | None = None
    ) -> User:
        """
        Update user status with transition validation

        Valid transitions:
        - inactive → active (after verification)
        - active → suspended (suspension)
        - suspended → active (reactivation)
        - active → inactive (deactivation)

        Args:
            user_id: User ID
            new_status: New status
            updated_by: ID of user making the update (for audit)

        Returns:
            User: Updated user entity

        Raises:
            UserNotFoundError: If user not found
            ValidationError: If transition is invalid
        """
        user = self.user_repository.get_by_id(user_id)

        if not user:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        # Get current status
        try:
            current_status = UserStatus(user.status)
        except ValueError:
            raise ValidationError(f"Invalid current status: {user.status}") from None

        # Check if transition is valid
        if current_status in self.VALID_TRANSITIONS:
            if new_status not in self.VALID_TRANSITIONS[current_status]:
                raise ValidationError(
                    f"Cannot transition from {current_status.value} to {new_status.value}. "
                    f"Valid transitions: {[s.value for s in self.VALID_TRANSITIONS[current_status]]}"
                )
        elif current_status != new_status:
            # If current status not in transitions, only allow if same status
            raise ValidationError(
                f"Invalid status transition from {current_status.value}"
            )

        # Update status
        user.status = new_status.value

        # If activating, mark as verified
        if new_status == UserStatus.ACTIVE:
            user.is_verified = True

        # Set updated_by for audit
        if updated_by:
            user.updated_by = updated_by

        # Save changes
        updated_user = self.user_repository.update(user)

        return updated_user
