"""
Ganitel V2 Backend - Get User Profile Use Case
"""

from uuid import UUID

from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import UserNotFoundError


class GetUserProfileUseCase:
    """
    Use case for retrieving user profile
    """

    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def execute(self, user_id: UUID) -> User:
        """
        Get user profile by ID

        Args:
            user_id: User ID

        Returns:
            User: User entity

        Raises:
            UserNotFoundError: If user not found
        """
        user = self.user_repository.get_by_id(user_id)

        if not user:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        return user
