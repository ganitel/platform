"""
Ganitel V2 Backend - Comment Entity
"""
from sqlalchemy import Column, Text, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.domain.entities.base import AuditableEntity, SoftDeleteEntity


class Comment(AuditableEntity, SoftDeleteEntity):
    """
    Comment entity for post comments
    """
    __tablename__ = "comments"
    
    # Relationships
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id"), nullable=True, index=True)  # For replies
    
    # Comment Information
    content = Column(Text, nullable=False)
    
    # Engagement
    likes_count = Column(Integer, default=0, nullable=False)
    replies_count = Column(Integer, default=0, nullable=False)
    
    # Status
    is_approved = Column(Boolean, default=True, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    
    def increment_likes(self):
        """Increment likes count"""
        self.likes_count += 1
    
    def increment_replies(self):
        """Increment replies count"""
        self.replies_count += 1
    
    def __repr__(self):
        return f"<Comment(id={self.id}, post_id={self.post_id}, user_id={self.user_id})>"

