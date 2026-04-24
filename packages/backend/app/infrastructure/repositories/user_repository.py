"""
Ganitel V2 Backend - User Repository Implementation
"""
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.domain.entities.user import User, UserStatus
from app.domain.repositories.user_repository import IUserRepository


class UserRepository(IUserRepository):
    """
    SQLAlchemy implementation of User Repository
    """

    def __init__(self, db: Session):
        self.db = db

    def create(self, user: User) -> User:
        """Create a new user"""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID"""
        return self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[User]:
        """Get all users with pagination"""
        return self.db.query(User).filter(
            User.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def update(self, user: User) -> User:
        """Update an existing user"""
        from datetime import datetime
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: UUID) -> bool:
        """Delete a user (hard delete)"""
        user = self.get_by_id(user_id)
        if user:
            self.db.delete(user)
            self.db.commit()
            return True
        return False

    def soft_delete(self, user_id: UUID) -> bool:
        """Soft delete a user"""
        user = self.get_by_id(user_id)
        if user:
            user.soft_delete()
            self.db.commit()
            return True
        return False

    def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count users with optional filters"""
        query = self.db.query(User).filter(User.deleted_at.is_(None))

        if filters:
            query = self._apply_filters(query, filters)

        return query.count()

    def exists(self, user_id: UUID) -> bool:
        """Check if user exists"""
        return self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None)
        ).first() is not None

    def find_by_criteria(self, criteria: dict[str, Any], skip: int = 0, limit: int = 100) -> list[User]:
        """Find users by criteria"""
        query = self.db.query(User).filter(User.deleted_at.is_(None))

        query = self._apply_filters(query, criteria)

        return query.offset(skip).limit(limit).all()

    def get_by_email(self, email: str) -> User | None:
        """Get user by email"""
        return self.db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None)
        ).first()

    def get_by_phone(self, phone: str) -> User | None:
        """Get user by phone"""
        return self.db.query(User).filter(
            User.phone == phone,
            User.deleted_at.is_(None)
        ).first()

    def search_users(self, search_term: str, skip: int = 0, limit: int = 100) -> list[User]:
        """Search users by name or email"""
        return self.db.query(User).filter(
            or_(
                User.first_name.ilike(f"%{search_term}%"),
                User.last_name.ilike(f"%{search_term}%"),
                User.email.ilike(f"%{search_term}%")
            ),
            User.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()

    def update_status(self, user_id: UUID, status: UserStatus) -> bool:
        """Update user status"""
        user = self.get_by_id(user_id)
        if user:
            user.status = status.value
            self.db.commit()
            return True
        return False

    def change_password(self, user_id: UUID, hashed_password: str) -> bool:
        """Change user password"""
        user = self.get_by_id(user_id)
        if user:
            user.hashed_password = hashed_password
            self.db.commit()
            return True
        return False

    def get_by_reset_token(self, token: str) -> User | None:
        """Get user by reset password token"""
        from datetime import datetime
        return self.db.query(User).filter(
            User.reset_password_token == token,
            User.reset_password_expires_at > datetime.utcnow(),
            User.deleted_at.is_(None)
        ).first()

    def update_reset_token(self, user_id: UUID, token: str, expires_at: datetime) -> bool:
        """Update reset password token"""
        user = self.get_by_id(user_id)
        if user:
            user.reset_password_token = token
            user.reset_password_expires_at = expires_at
            self.db.commit()
            return True
        return False

    def clear_reset_token(self, user_id: UUID) -> bool:
        """Clear reset password token"""
        user = self.get_by_id(user_id)
        if user:
            user.reset_password_token = None
            user.reset_password_expires_at = None
            self.db.commit()
            return True
        return False

    def get_by_oauth_id(self, oauth_id: str, provider: str) -> User | None:
        """Get user by OAuth ID and provider"""
        return self.db.query(User).filter(
            User.oauth_id == oauth_id,
            User.oauth_provider == provider,
            User.deleted_at.is_(None)
        ).first()

    def _apply_filters(self, query, filters: dict[str, Any]):
        """Apply filters to query"""
        for key, value in filters.items():
            if hasattr(User, key) and value is not None:
                if key in ['email', 'first_name', 'last_name']:
                    query = query.filter(getattr(User, key).ilike(f"%{value}%"))
                else:
                    query = query.filter(getattr(User, key) == value)

        return query

