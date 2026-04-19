"""
Ganitel V2 Backend - Service Repository Implementation
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text

from app.domain.entities.booking import Booking, BookingStatus
from app.domain.entities.service import Service, ServiceType, ServiceStatus
from app.domain.repositories.service_repository import IServiceRepository

class ServiceRepository(IServiceRepository):
    """
    SQLAlchemy implementation of Service Repository
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, service: Service) -> Service:
        """Create a new service"""
        self.db.add(service)
        self.db.commit()
        self.db.refresh(service)
        return service
    
    def get_by_id(self, service_id: UUID) -> Optional[Service]:
        """Get service by ID"""
        return self.db.query(Service).filter(
            Service.id == service_id,
            Service.deleted_at.is_(None)
        ).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get all services with pagination"""
        return self.db.query(Service).filter(
            Service.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def update(self, service: Service) -> Service:
        """Update an existing service"""
        service.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(service)
        return service
    
    def delete(self, service_id: UUID) -> bool:
        """Delete a service (hard delete)"""
        service = self.get_by_id(service_id)
        if service:
            self.db.delete(service)
            self.db.commit()
            return True
        return False
    
    def soft_delete(self, service_id: UUID) -> bool:
        """Soft delete a service"""
        service = self.get_by_id(service_id)
        if service:
            service.soft_delete()
            self.db.commit()
            return True
        return False
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count services with optional filters"""
        query = self.db.query(Service).filter(Service.deleted_at.is_(None))
        
        if filters:
            query = self._apply_filters(query, filters)
        
        return query.count()
    
    def exists(self, service_id: UUID) -> bool:
        """Check if service exists"""
        return self.db.query(Service).filter(
            Service.id == service_id,
            Service.deleted_at.is_(None)
        ).first() is not None
    
    def find_by_criteria(self, criteria: Dict[str, Any], skip: int = 0, limit: int = 100) -> List[Service]:
        """Find services by criteria"""
        query = self.db.query(Service).filter(Service.deleted_at.is_(None))
        
        query = self._apply_filters(query, criteria)
        
        return query.offset(skip).limit(limit).all()
    
    def get_by_provider_id(self, provider_id: UUID, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services by provider ID"""
        return self.db.query(Service).filter(
            Service.provider_id == provider_id,
            Service.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def get_by_slug(self, slug: str) -> Optional[Service]:
        """Get service by URL slug"""
        return self.db.query(Service).filter(
            Service.slug == slug,
            Service.deleted_at.is_(None)
        ).first()
    
    def get_by_service_type(self, service_type: ServiceType, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services by type"""
        return self.db.query(Service).filter(
            Service.service_type == service_type.value,
            Service.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def get_by_status(self, status: ServiceStatus, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services by status"""
        return self.db.query(Service).filter(
            Service.status == status.value,
            Service.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def get_active_services(self, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get active services"""
        return self.db.query(Service).filter(
            Service.status == ServiceStatus.ACTIVE.value,
            Service.is_active == True,
            Service.deleted_at.is_(None)
        ).offset(skip).limit(limit).all()
    
    def get_by_location(self, country: Optional[str] = None, city: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services by location"""
        query = self.db.query(Service).filter(Service.deleted_at.is_(None))
        
        if country:
            query = query.filter(Service.country.ilike(f"%{country}%"))
        
        if city:
            query = query.filter(Service.city.ilike(f"%{city}%"))
        
        return query.offset(skip).limit(limit).all()
    
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
        search_query = self.db.query(Service).filter(
            or_(
                Service.title.ilike(f"%{query}%"),
                Service.description.ilike(f"%{query}%"),
                Service.short_description.ilike(f"%{query}%")
            ),
            Service.deleted_at.is_(None),
            Service.status == ServiceStatus.ACTIVE.value
        )
        
        if service_type:
            search_query = search_query.filter(Service.service_type == service_type.value)
        
        if country:
            search_query = search_query.filter(Service.country.ilike(f"%{country}%"))
        
        if city:
            search_query = search_query.filter(Service.city.ilike(f"%{city}%"))
        
        if min_price is not None:
            search_query = search_query.filter(Service.base_price >= min_price)
        
        if max_price is not None:
            search_query = search_query.filter(Service.base_price <= max_price)
        
        if amenities:
            for amenity in amenities:
                search_query = search_query.filter(Service.amenities.contains([amenity]))
        
        return search_query.offset(skip).limit(limit).all()
    
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
        query = self.db.query(Service).filter(
            Service.deleted_at.is_(None),
            Service.status == ServiceStatus.ACTIVE.value
        )
        
        if service_type:
            query = query.filter(Service.service_type == service_type.value)
        
        if country:
            query = query.filter(Service.country.ilike(f"%{country}%"))
        
        if city:
            query = query.filter(Service.city.ilike(f"%{city}%"))
        
        if guests:
            query = query.filter(Service.max_guests >= guests)

        conflicting_booking_service_ids = (
            self.db.query(Booking.service_id)
            .filter(
                Booking.deleted_at.is_(None),
                Booking.status.in_(
                    [
                        BookingStatus.PENDING.value,
                        BookingStatus.NEGOTIATING.value,
                        BookingStatus.CONFIRMED.value,
                        BookingStatus.COMPLETED.value,
                    ]
                ),
                Booking.start_date < check_out,
                Booking.end_date > check_in,
            )
            .subquery()
        )

        query = query.filter(~Service.id.in_(conflicting_booking_service_ids))
        
        return query.offset(skip).limit(limit).all()
    
    def get_featured_services(self, limit: int = 10) -> List[Service]:
        """Get featured services"""
        return self.db.query(Service).filter(
            Service.deleted_at.is_(None),
            Service.status == ServiceStatus.ACTIVE.value
        ).order_by(Service.average_rating.desc()).limit(limit).all()
    
    def get_popular_services(self, service_type: Optional[ServiceType] = None, limit: int = 10) -> List[Service]:
        """Get popular services by booking count"""
        query = self.db.query(Service).filter(
            Service.deleted_at.is_(None),
            Service.status == ServiceStatus.ACTIVE.value
        )
        
        if service_type:
            query = query.filter(Service.service_type == service_type.value)
        
        return query.order_by(Service.booking_count.desc()).limit(limit).all()
    
    def get_top_rated_services(self, service_type: Optional[ServiceType] = None, min_reviews: int = 5, limit: int = 10) -> List[Service]:
        """Get top rated services"""
        query = self.db.query(Service).filter(
            Service.deleted_at.is_(None),
            Service.status == ServiceStatus.ACTIVE.value,
            Service.review_count >= min_reviews
        )
        
        if service_type:
            query = query.filter(Service.service_type == service_type.value)
        
        return query.order_by(Service.average_rating.desc()).limit(limit).all()
    
    def get_recent_services(self, days: int = 30, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get recently added services"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        return self.db.query(Service).filter(
            Service.created_at >= since_date,
            Service.deleted_at.is_(None)
        ).order_by(Service.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_services_by_price_range(
        self,
        min_price: float,
        max_price: float,
        service_type: Optional[ServiceType] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Service]:
        """Get services within price range"""
        query = self.db.query(Service).filter(
            Service.base_price >= min_price,
            Service.base_price <= max_price,
            Service.deleted_at.is_(None),
            Service.status == ServiceStatus.ACTIVE.value
        )
        
        if service_type:
            query = query.filter(Service.service_type == service_type.value)
        
        return query.offset(skip).limit(limit).all()
    
    def get_services_with_amenities(
        self,
        amenities: List[str],
        service_type: Optional[ServiceType] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Service]:
        """Get services with specific amenities"""
        query = self.db.query(Service).filter(
            Service.deleted_at.is_(None),
            Service.status == ServiceStatus.ACTIVE.value
        )
        
        if service_type:
            query = query.filter(Service.service_type == service_type.value)
        
        for amenity in amenities:
            query = query.filter(Service.amenities.contains([amenity]))
        
        return query.offset(skip).limit(limit).all()
    
    def get_nearby_services(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
        service_type: Optional[ServiceType] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Service]:
        """Get services within radius of coordinates"""
        # Using Haversine formula for distance calculation
        query = self.db.query(Service).filter(
            Service.latitude.isnot(None),
            Service.longitude.isnot(None),
            Service.deleted_at.is_(None),
            Service.status == ServiceStatus.ACTIVE.value
        )
        
        if service_type:
            query = query.filter(Service.service_type == service_type.value)
        
        # Add distance calculation (simplified - in production use PostGIS)
        distance_formula = func.sqrt(
            func.pow(69.1 * (Service.latitude - latitude), 2) +
            func.pow(69.1 * (longitude - Service.longitude) * func.cos(Service.latitude / 57.3), 2)
        )
        
        query = query.filter(distance_formula <= radius_km)
        query = query.order_by(distance_formula)
        
        return query.offset(skip).limit(limit).all()
    
    def update_view_count(self, service_id: UUID) -> bool:
        """Increment service view count"""
        service = self.get_by_id(service_id)
        if service:
            service.increment_view_count()
            self.db.commit()
            return True
        return False
    
    def update_booking_count(self, service_id: UUID) -> bool:
        """Increment service booking count"""
        service = self.get_by_id(service_id)
        if service:
            service.increment_booking_count()
            self.db.commit()
            return True
        return False
    
    def update_rating(self, service_id: UUID, average_rating: float, review_count: int) -> bool:
        """Update service rating"""
        service = self.get_by_id(service_id)
        if service:
            service.average_rating = average_rating
            service.review_count = review_count
            self.db.commit()
            return True
        return False
    
    def update_status(self, service_id: UUID, status: ServiceStatus) -> bool:
        """Update service status"""
        service = self.get_by_id(service_id)
        if service:
            service.status = status.value
            self.db.commit()
            return True
        return False
    
    def slug_exists(self, slug: str, exclude_service_id: Optional[UUID] = None) -> bool:
        """Check if slug already exists"""
        query = self.db.query(Service).filter(
            Service.slug == slug,
            Service.deleted_at.is_(None)
        )
        
        if exclude_service_id:
            query = query.filter(Service.id != exclude_service_id)
        
        return query.first() is not None
    
    def get_service_statistics(self, provider_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Get service statistics"""
        query = self.db.query(Service).filter(Service.deleted_at.is_(None))
        
        if provider_id:
            query = query.filter(Service.provider_id == provider_id)
        
        total_services = query.count()
        active_services = query.filter(Service.status == ServiceStatus.ACTIVE.value).count()
        pending_services = query.filter(Service.status == ServiceStatus.PENDING_REVIEW.value).count()
        
        return {
            "total_services": total_services,
            "active_services": active_services,
            "pending_services": pending_services,
            "inactive_services": total_services - active_services - pending_services
        }
    
    def get_services_needing_review(self, skip: int = 0, limit: int = 100) -> List[Service]:
        """Get services pending review"""
        return self.db.query(Service).filter(
            Service.status == ServiceStatus.PENDING_REVIEW.value,
            Service.deleted_at.is_(None)
        ).order_by(Service.created_at.asc()).offset(skip).limit(limit).all()
    
    def _apply_filters(self, query, filters: Dict[str, Any]):
        """Apply filters to query"""
        for key, value in filters.items():
            if hasattr(Service, key) and value is not None:
                if key in ['country', 'city', 'title', 'description']:
                    query = query.filter(getattr(Service, key).ilike(f"%{value}%"))
                else:
                    query = query.filter(getattr(Service, key) == value)
        
        return query