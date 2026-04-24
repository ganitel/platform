"""
Ganitel V2 Backend - User Repository Interface
"""
from abc import abstractmethod
from uuid import UUID

from app.domain.entities.user import User, UserStatus
from app.domain.repositories.base_repository import BaseRepository


class IUserRepository(BaseRepository[User]):
    """
    User repository interface defining user-specific operations
    """

    @abstractmethod
    def get_by_email(self, email: str) -> User | None:
        """Get user by email"""
        raise NotImplementedError

    @abstractmethod
    def get_by_phone(self, phone: str) -> User | None:
        """Get user by phone"""
        raise NotImplementedError

    @abstractmethod
    def search_users(self, search_term: str, skip: int = 0, limit: int = 100) -> list[User]:
        """Search users by name or email"""
        raise NotImplementedError

    @abstractmethod
    def update_status(self, user_id: UUID, status: UserStatus) -> bool:
        """Update user status"""
        raise NotImplementedError

    @abstractmethod
    def change_password(self, user_id: UUID, hashed_password: str) -> bool:
        """Change user password"""
        raise NotImplementedError

    @abstractmethod
    def get_by_reset_token(self, token: str) -> User | None:
        """Get user by reset password token"""
        raise NotImplementedError

    @abstractmethod
    def update_reset_token(self, user_id: UUID, token: str, expires_at) -> bool:
        """Update reset password token"""
        raise NotImplementedError

    @abstractmethod
    def clear_reset_token(self, user_id: UUID) -> bool:
        """Clear reset password token"""
        raise NotImplementedError

    @abstractmethod
    def get_by_oauth_id(self, oauth_id: str, provider: str) -> User | None:
        """Get user by OAuth ID and provider"""
        raise NotImplementedError

