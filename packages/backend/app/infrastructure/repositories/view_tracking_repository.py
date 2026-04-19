"""
Ganitel V2 Backend - View Tracking Repository Implementation
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.domain.entities.view_tracking import ViewTracking, ViewType
from app.domain.repositories.view_tracking_repository import IViewTrackingRepository

class ViewTrackingRepository(IViewTrackingRepository):
    """SQLAlchemy implementation of View Tracking Repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, view_tracking: ViewTracking) -> ViewTracking:
        """Create a new view tracking"""
        self.db.add(view_tracking)
        self.db.commit()
        self.db.refresh(view_tracking)
        return view_tracking
    
    def get_by_id(self, view_id: UUID) -> Optional[ViewTracking]:
        """Get view tracking by ID"""
        return self.db.query(ViewTracking).filter(ViewTracking.id == view_id).first()
    
    def get_by_entity(self, entity_type: str, entity_id: UUID, skip: int = 0, limit: int = 100) -> List[ViewTracking]:
        """Get views by entity"""
        return self.db.query(ViewTracking).filter(
            ViewTracking.entity_type == entity_type,
            ViewTracking.entity_id == entity_id
        ).order_by(ViewTracking.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_view_count(self, entity_type: str, entity_id: UUID) -> int:
        """Get view count for entity"""
        return self.db.query(func.count(ViewTracking.id)).filter(
            ViewTracking.entity_type == entity_type,
            ViewTracking.entity_id == entity_id
        ).scalar() or 0
    
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[ViewTracking]:
        """Get views by user ID"""
        return self.db.query(ViewTracking).filter(
            ViewTracking.user_id == user_id
        ).order_by(ViewTracking.created_at.desc()).offset(skip).limit(limit).all()
    
    def update(self, view_tracking: ViewTracking) -> ViewTracking:
        """Update view tracking"""
        from datetime import datetime
        view_tracking.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(view_tracking)
        return view_tracking
    
    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all view trackings"""
        return self.db.query(ViewTracking).offset(skip).limit(limit).all()
    
    def delete(self, view_id: UUID) -> bool:
        """Delete view tracking"""
        view = self.get_by_id(view_id)
        if view:
            self.db.delete(view)
            self.db.commit()
            return True
        return False

