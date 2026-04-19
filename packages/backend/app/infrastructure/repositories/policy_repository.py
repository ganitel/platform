"""
Ganitel V2 Backend - Policy Repository Implementation
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.entities.policy import Policy, PolicyType
from app.domain.repositories.policy_repository import IPolicyRepository

class PolicyRepository(IPolicyRepository):
    """SQLAlchemy implementation of Policy Repository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, policy: Policy) -> Policy:
        """Create a new policy"""
        self.db.add(policy)
        self.db.commit()
        self.db.refresh(policy)
        return policy
    
    def get_by_id(self, policy_id: UUID) -> Optional[Policy]:
        """Get policy by ID"""
        return self.db.query(Policy).filter(
            Policy.id == policy_id,
            Policy.deleted_at.is_(None)
        ).first()
    
    def get_by_slug(self, slug: str) -> Optional[Policy]:
        """Get policy by slug"""
        return self.db.query(Policy).filter(
            Policy.slug == slug,
            Policy.deleted_at.is_(None)
        ).first()
    
    def get_by_type(self, policy_type: PolicyType, skip: int = 0, limit: int = 100) -> List[Policy]:
        """Get policies by type"""
        return self.db.query(Policy).filter(
            Policy.policy_type == policy_type.value,
            Policy.deleted_at.is_(None)
        ).order_by(Policy.display_order).offset(skip).limit(limit).all()
    
    def get_active_policies(self, skip: int = 0, limit: int = 100) -> List[Policy]:
        """Get active policies"""
        return self.db.query(Policy).filter(
            Policy.is_active == True,
            Policy.deleted_at.is_(None)
        ).order_by(Policy.display_order).offset(skip).limit(limit).all()
    
    def update(self, policy: Policy) -> Policy:
        """Update policy"""
        from datetime import datetime
        policy.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(policy)
        return policy
    
    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all policies"""
        return self.db.query(Policy).filter(
            Policy.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def delete(self, policy_id: UUID) -> bool:
        """Delete policy"""
        policy = self.get_by_id(policy_id)
        if policy:
            self.db.delete(policy)
            self.db.commit()
            return True
        return False

