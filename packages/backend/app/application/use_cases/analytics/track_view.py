"""
Ganitel V2 Backend - Track View Use Case
"""
from uuid import UUID
from typing import Optional
from datetime import datetime

from app.domain.repositories.view_tracking_repository import IViewTrackingRepository
from app.domain.entities.view_tracking import ViewTracking, ViewType
from app.exceptions import ValidationError

class TrackViewUseCase:
    """Use case for tracking views"""
    
    def __init__(self, view_tracking_repository: IViewTrackingRepository):
        self.view_tracking_repository = view_tracking_repository
    
    def execute(
        self,
        entity_type: str,
        entity_id: UUID,
        view_type: str,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referrer: Optional[str] = None
    ) -> ViewTracking:
        """
        Track a view
        
        Args:
            entity_type: Type of entity being viewed
            entity_id: ID of entity being viewed
            view_type: Type of view
            user_id: User ID (optional for anonymous views)
            ip_address: IP address
            user_agent: User agent
            referrer: Referrer URL
            
        Returns:
            ViewTracking: Created view tracking
        """
        if not entity_type or not entity_id:
            raise ValidationError("Entity type and ID are required")
        
        # Validate view type
        try:
            ViewType(view_type)
        except ValueError:
            raise ValidationError(f"Invalid view type: {view_type}")
        
        view_tracking = ViewTracking(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            view_type=view_type,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer
        )
        
        return self.view_tracking_repository.create(view_tracking)

