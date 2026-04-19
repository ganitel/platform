"""
Ganitel V2 Backend - Notification Repository Interface
"""
from abc import abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.notification import Notification
from app.domain.repositories.base_repository import BaseRepository

class INotificationRepository(BaseRepository[Notification]):
    """Notification repository interface"""
    
    @abstractmethod
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100, unread_only: bool = False) -> List[Notification]:
        """Get notifications by user ID"""
        raise NotImplementedError
    
    @abstractmethod
    def mark_as_read(self, notification_id: UUID) -> bool:
        """Mark notification as read"""
        raise NotImplementedError
    
    @abstractmethod
    def mark_all_as_read(self, user_id: UUID) -> bool:
        """Mark all user notifications as read"""
        raise NotImplementedError
    
    @abstractmethod
    def get_unread_count(self, user_id: UUID) -> int:
        """Get unread notification count"""
        raise NotImplementedError

