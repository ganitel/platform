"""
Ganitel V2 Backend - Notification Repository Implementation
"""

from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.domain.entities.notification import Notification
from app.domain.repositories.notification_repository import INotificationRepository


class NotificationRepository(INotificationRepository):
    """SQLAlchemy implementation of Notification Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, notification: Notification) -> Notification:
        """Create a new notification"""
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_by_id(self, notification_id: UUID) -> Notification | None:
        """Get notification by ID"""
        return (
            self.db.query(Notification)
            .filter(Notification.id == notification_id)
            .first()
        )

    def get_by_user_id(
        self, user_id: UUID, skip: int = 0, limit: int = 100, unread_only: bool = False
    ) -> list[Notification]:
        """Get notifications by user ID"""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)

        if unread_only:
            query = query.filter(Notification.is_read.is_(False))

        return (
            query.order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def mark_as_read(self, notification_id: UUID) -> bool:
        """Mark notification as read"""
        notification = self.get_by_id(notification_id)
        if notification:
            notification.mark_as_read()
            self.db.commit()
            return True
        return False

    def mark_all_as_read(self, user_id: UUID) -> bool:
        """Mark all user notifications as read"""
        from datetime import datetime

        updated = (
            self.db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
            .update(
                {Notification.is_read: True, Notification.read_at: datetime.utcnow()}
            )
        )
        self.db.commit()
        return updated > 0

    def get_unread_count(self, user_id: UUID) -> int:
        """Get unread notification count"""
        return (
            self.db.query(func.count(Notification.id))
            .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
            .scalar()
            or 0
        )

    def update(self, notification: Notification) -> Notification:
        """Update notification"""
        from datetime import datetime

        notification.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all notifications"""
        return self.db.query(Notification).offset(skip).limit(limit).all()

    def delete(self, notification_id: UUID) -> bool:
        """Delete notification"""
        notification = self.get_by_id(notification_id)
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        return False
