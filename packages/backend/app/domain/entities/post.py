"""
Ganitel V2 Backend - Post Entity (Social Features)
"""
from enum import Enum

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class PostStatus(str, Enum):
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
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Post Information
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(String(500), nullable=True)
    slug = Column(String(250), unique=True, index=True, nullable=True)

    # Media
    featured_image = Column(String(500), nullable=True)
    images = Column(ARRAY(String), nullable=True)

    # Status
    status = Column(String(20), default=PostStatus.DRAFT.value, nullable=False, index=True)
    is_featured = Column(Boolean, default=False, nullable=False)

    # Engagement
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)

    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    tags = Column(ARRAY(String), nullable=True)

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

