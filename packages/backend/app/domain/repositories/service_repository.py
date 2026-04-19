"""
Ganitel V2 Backend - Service Repository Interface
"""
from abc import abstractmethod
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date

from app.domain.entities.service import Service, ServiceType, ServiceStatus
from app.domain.repositories.base_repository import BaseRepository

class IServiceRepository(BaseRepository[Service]):
    """
    Service repository interface defining service-specific operations
    """
    
    @abstractmethod
    def get_by_provider_id(self, provider_id: UUID, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services by provider ID"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_slug(self, slug: str) -> Optional[Service]:
        """Get service by URL slug"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_service_type(self, service_type: ServiceType, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services by type"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_status(self, status: ServiceStatus, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services by status"""
        raise NotImplementedError
    
    @abstractmethod
    def get_active_services(self, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get active services"""
        raise NotImplementedError
    
    @abstractmethod
    def get_by_location(self, country: Optional[str] = None, city: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services by location"""
        raise NotImplementedError
    
    @abstractmethod
    def search_services(
        self,
        query: str,
        service_type: Optional[ServiceType] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        amenities: Optional[List[str]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Service]:
        """Search services with filters"""
        raise NotImplementedError
    
    @abstractmethod
    def get_available_services(
        self,
        check_in: date,
        check_out: date,
        guests: Optional[int] = None,
        service_type: Optional[ServiceType] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Service]:
        """Get available services for specific dates"""
        raise NotImplementedError
    
    @abstractmethod
    def get_featured_services(self, limit: int = 10) -> List[Service]:
        """Get featured services"""
        raise NotImplementedError
    
    @abstractmethod
    def update_view_count(self, service_id: UUID) -> bool:
        """Increment service view count"""
        raise NotImplementedError
    
    @abstractmethod
    def update_booking_count(self, service_id: UUID) -> bool:
        """Increment service booking count"""
        raise NotImplementedError
    
    @abstractmethod
    def slug_exists(self, slug: str, exclude_service_id: Optional[UUID] = None) -> bool:
        """Check if slug already exists"""
        raise NotImplementedError

