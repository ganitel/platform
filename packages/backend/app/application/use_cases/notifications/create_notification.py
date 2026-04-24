"""
Ganitel V2 Backend - Create Notification Use Case
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from app.domain.entities.notification import (
    Notification,
    NotificationChannel,
)
from app.domain.repositories.notification_repository import INotificationRepository
from app.exceptions import ValidationError


class CreateNotificationUseCase:
    """Use case for creating a notification"""

    def __init__(self, notification_repository: INotificationRepository):
        self.notification_repository = notification_repository

    def execute(
        self,
        user_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        channel: str = NotificationChannel.IN_APP.value,
        data: dict[str, Any] | None = None,
        action_url: str | None = None,
        action_label: str | None = None,
        related_entity_type: str | None = None,
        related_entity_id: UUID | None = None,
    ) -> Notification:
        """
        Create a notification

        Args:
            user_id: User ID
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            channel: Notification channel
            data: Additional data
            action_url: Action URL
            action_label: Action label
            related_entity_type: Related entity type
            related_entity_id: Related entity ID

        Returns:
            Notification: Created notification
        """
        if not title or not message:
            raise ValidationError("Title and message are required")

        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            channel=channel,
            title=title,
            message=message,
            data=data,
            action_url=action_url,
            action_label=action_label,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            sent_at=datetime.utcnow(),
        )

        return self.notification_repository.create(notification)
