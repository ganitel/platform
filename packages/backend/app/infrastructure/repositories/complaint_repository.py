"""
Ganitel V2 Backend - Complaint Repository Implementation
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.entities.complaint import Complaint, ComplaintStatus
from app.domain.repositories.complaint_repository import IComplaintRepository

class ComplaintRepository(IComplaintRepository):
    """SQLAlchemy implementation of Complaint Repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, complaint: Complaint) -> Complaint:
        """Create a new complaint"""
        self.db.add(complaint)
        self.db.commit()
        self.db.refresh(complaint)
        return complaint
    
    def get_by_id(self, complaint_id: UUID) -> Optional[Complaint]:
        """Get complaint by ID"""
        return self.db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """Get complaints by user ID"""
        return self.db.query(Complaint).filter(
            Complaint.user_id == user_id
        ).order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_status(self, status: ComplaintStatus, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """Get complaints by status"""
        return self.db.query(Complaint).filter(
            Complaint.status == status.value
        ).order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_assigned_to(self, assigned_to_id: UUID, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """Get complaints assigned to user"""
        return self.db.query(Complaint).filter(
            Complaint.assigned_to_id == assigned_to_id
        ).order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    
    def update(self, complaint: Complaint) -> Complaint:
        """Update complaint"""
        from datetime import datetime
        complaint.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(complaint)
        return complaint
    
    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all complaints"""
        return self.db.query(Complaint).offset(skip).limit(limit).all()
    
    def delete(self, complaint_id: UUID) -> bool:
        """Delete complaint"""
        complaint = self.get_by_id(complaint_id)
        if complaint:
            self.db.delete(complaint)
            self.db.commit()
            return True
        return False

