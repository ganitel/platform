"""
Ganitel V2 Backend - Review Repository Implementation
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.domain.entities.review import Review
from app.domain.repositories.review_repository import IReviewRepository

class ReviewRepository(IReviewRepository):
    """SQLAlchemy implementation of Review Repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, review: Review) -> Review:
        """Create a new review"""
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review
    
    def get_by_id(self, review_id: UUID) -> Optional[Review]:
        """Get review by ID"""
        return self.db.query(Review).filter(
            Review.id == review_id,
            Review.deleted_at.is_(None)
        ).first()
    
    def get_by_service_id(self, service_id: UUID, skip: int = 0, limit: int = 100) -> List[Review]:
        """Get reviews by service ID"""
        return self.db.query(Review).filter(
            Review.service_id == service_id,
            Review.deleted_at.is_(None),
            Review.status == "published"
        ).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Review]:
        """Get reviews by user ID"""
        return self.db.query(Review).filter(
            Review.user_id == user_id,
            Review.deleted_at.is_(None)
        ).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_service_and_user(self, service_id: UUID, user_id: UUID) -> Optional[Review]:
        """Get review by service and user"""
        return self.db.query(Review).filter(
            Review.service_id == service_id,
            Review.user_id == user_id,
            Review.deleted_at.is_(None)
        ).first()
    
    def get_average_rating(self, service_id: UUID) -> float:
        """Get average rating for service"""
        result = self.db.query(func.avg(Review.overall_rating)).filter(
            Review.service_id == service_id,
            Review.deleted_at.is_(None),
            Review.status == "published"
        ).scalar()
        return float(result) if result else 0.0
    
    def update(self, review: Review) -> Review:
        """Update review"""
        from datetime import datetime
        review.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(review)
        return review
    
    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all reviews"""
        return self.db.query(Review).filter(
            Review.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def delete(self, review_id: UUID) -> bool:
        """Delete review"""
        review = self.get_by_id(review_id)
        if review:
            self.db.delete(review)
            self.db.commit()
            return True
        return False
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count reviews with optional filters"""
        from typing import Dict, Any
        query = self.db.query(Review).filter(Review.deleted_at.is_(None))
        
        if filters:
            for key, value in filters.items():
                if hasattr(Review, key) and value is not None:
                    query = query.filter(getattr(Review, key) == value)
        
        return query.count()
        
        if filters:
            for key, value in filters.items():
                if hasattr(Review, key) and value is not None:
                    query = query.filter(getattr(Review, key) == value)
        
        return query.count()

