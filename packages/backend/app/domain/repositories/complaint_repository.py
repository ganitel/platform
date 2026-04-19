"""
Ganitel V2 Backend - Complaint Repository Interface
"""
from abc import abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.complaint import Complaint, ComplaintStatus
from app.domain.repositories.base_repository import BaseRepository

class IComplaintRepository(BaseRepository[Complaint]):
    """Complaint repository interface"""
    
    @abstractmethod
    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """Get complaints by user ID"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_status(self, status: ComplaintStatus, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """Get complaints by status"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_assigned_to(self, assigned_to_id: UUID, skip: int = 0, limit: int = 100) -> List[Complaint]:
        """Get complaints assigned to user"""
        raise NotImplementedError

