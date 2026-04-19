"""
Ganitel V2 Backend - Reference Data Endpoints
Endpoints for accessing locations, property types, amenities, etc.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.domain.entities.location import Location
from app.domain.entities.property_type import PropertyType
from app.domain.entities.amenity_category import AmenityCategory
from app.domain.entities.amenity import Amenity
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Response schemas
class LocationResponse(BaseModel):
    id: str
    name: str
    region: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PropertyTypeResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AmenityResponse(BaseModel):
    id: str
    name_en: str
    name_fr: str
    icon_path: Optional[str]
    category_id: str
    
    class Config:
        from_attributes = True


class AmenityCategoryResponse(BaseModel):
    id: str
    name_en: str
    name_fr: str
    icon_path: Optional[str]
    display_order: int
    amenities: List[AmenityResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True


# Router
router = APIRouter(tags=["reference_data"])


@router.get("/locations", response_model=List[LocationResponse])
async def get_locations(
    db: Session = Depends(get_db)
):
    """
    Get all available locations
    """
    locations = db.query(Location).filter(Location.deleted_at.is_(None)).all()
    return locations


@router.get("/locations/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific location by ID
    """
    location = db.query(Location).filter(
        Location.id == location_id,
        Location.deleted_at.is_(None)
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    return location


@router.get("/property-types", response_model=List[PropertyTypeResponse])
async def get_property_types(
    db: Session = Depends(get_db)
):
    """
    Get all available property types
    """
    property_types = db.query(PropertyType).filter(
        PropertyType.deleted_at.is_(None)
    ).all()
    return property_types


@router.get("/property-types/{property_type_id}", response_model=PropertyTypeResponse)
async def get_property_type(
    property_type_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific property type by ID
    """
    property_type = db.query(PropertyType).filter(
        PropertyType.id == property_type_id,
        PropertyType.deleted_at.is_(None)
    ).first()
    
    if not property_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property type not found"
        )
    
    return property_type


@router.get("/amenity-categories", response_model=List[AmenityCategoryResponse])
async def get_amenity_categories(
    db: Session = Depends(get_db)
):
    """
    Get all amenity categories with their amenities
    """
    categories = db.query(AmenityCategory).filter(
        AmenityCategory.deleted_at.is_(None)
    ).order_by(AmenityCategory.display_order).all()
    return categories


@router.get("/amenity-categories/{category_id}", response_model=AmenityCategoryResponse)
async def get_amenity_category(
    category_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific amenity category with its amenities
    """
    category = db.query(AmenityCategory).filter(
        AmenityCategory.id == category_id,
        AmenityCategory.deleted_at.is_(None)
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Amenity category not found"
        )
    
    return category


@router.get("/amenities", response_model=List[AmenityResponse])
async def get_amenities(
    category_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all amenities, optionally filtered by category
    """
    query = db.query(Amenity).filter(Amenity.deleted_at.is_(None))
    
    if category_id:
        query = query.filter(Amenity.category_id == category_id)
    
    amenities = query.all()
    return amenities


@router.get("/amenities/{amenity_id}", response_model=AmenityResponse)
async def get_amenity(
    amenity_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific amenity by ID
    """
    amenity = db.query(Amenity).filter(
        Amenity.id == amenity_id,
        Amenity.deleted_at.is_(None)
    ).first()
    
    if not amenity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Amenity not found"
        )
    
    return amenity
