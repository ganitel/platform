"""
Ganitel V2 Backend - Post Entity (Social Features)
"""

from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class PostStatus(StrEnum):
    """Post status enumeration"""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    HIDDEN = "hidden"


class Post(AuditableEntity, SoftDeleteEntity):
    """
    Post entity for social posts
    """

    __tablename__ = "posts"

    # Relationships
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Post Information
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(String(500), nullable=True)
    slug: Mapped[str | None] = mapped_column(
        String(250), unique=True, index=True, nullable=True
    )

    # Media
    featured_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    images: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default=PostStatus.DRAFT.value, nullable=False, index=True
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Engagement
    likes_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comments_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # SEO
    meta_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    def increment_likes(self):
        """Increment likes count"""
        self.likes_count += 1

    def increment_comments(self):
        """Increment comments count"""
        self.comments_count += 1

    def increment_views(self):
        """Increment views count"""
        self.views_count += 1

    def __repr__(self):
        return f"<Post(id={self.id}, title={self.title}, status={self.status})>"
