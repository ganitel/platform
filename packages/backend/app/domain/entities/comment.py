"""
Ganitel V2 Backend - Comment Entity
"""

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class Comment(AuditableEntity, SoftDeleteEntity):
    """
    Comment entity for post comments
    """

    __tablename__ = "comments"

    # Relationships
    post_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("posts.id"), nullable=False, index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("comments.id"), nullable=True, index=True
    )  # For replies

    # Comment Information
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Engagement
    likes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    replies_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Status
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def increment_likes(self):
        """Increment likes count"""
        self.likes_count += 1

    def increment_replies(self):
        """Increment replies count"""
        self.replies_count += 1

    def __repr__(self):
        return (
            f"<Comment(id={self.id}, post_id={self.post_id}, user_id={self.user_id})>"
        )
