"""
Ganitel V2 Backend - Support Request Repository Implementation
"""
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.support_request import SupportRequest, SupportRequestStatus
from app.domain.repositories.support_request_repository import ISupportRequestRepository


class SupportRequestRepository(ISupportRequestRepository):
    """SQLAlchemy implementation of Support Request Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, support_request: SupportRequest) -> SupportRequest:
        """Create a new support request"""
        self.db.add(support_request)
        self.db.commit()
        self.db.refresh(support_request)
        return support_request

    def get_by_id(self, request_id: UUID) -> SupportRequest | None:
        """Get support request by ID"""
        return self.db.query(SupportRequest).filter(SupportRequest.id == request_id).first()

    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> list[SupportRequest]:
        """Get support requests by user ID"""
        return self.db.query(SupportRequest).filter(
            SupportRequest.user_id == user_id
        ).order_by(SupportRequest.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_status(self, status: SupportRequestStatus, skip: int = 0, limit: int = 100) -> list[SupportRequest]:
        """Get support requests by status"""
        return self.db.query(SupportRequest).filter(
            SupportRequest.status == status.value
        ).order_by(SupportRequest.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_assigned_to(self, assigned_to_id: UUID, skip: int = 0, limit: int = 100) -> list[SupportRequest]:
        """Get support requests assigned to user"""
        return self.db.query(SupportRequest).filter(
            SupportRequest.assigned_to_id == assigned_to_id
        ).order_by(SupportRequest.created_at.desc()).offset(skip).limit(limit).all()

    def update(self, support_request: SupportRequest) -> SupportRequest:
        """Update support request"""
        from datetime import datetime
        support_request.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(support_request)
        return support_request

    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all support requests"""
        return self.db.query(SupportRequest).offset(skip).limit(limit).all()

    def delete(self, request_id: UUID) -> bool:
        """Delete support request"""
        request = self.get_by_id(request_id)
        if request:
            self.db.delete(request)
            self.db.commit()
            return True
        return False

