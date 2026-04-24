"""
Ganitel V2 Backend - Properties Endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.property_schemas import (
    MessageResponse,
    PropertyCreateRequest,
    PropertyDetailResponse,
    PropertyListResponse,
    PropertyResponse,
    PropertyUpdateRequest,
)
from app.application.use_cases.properties import (
    CreatePropertyUseCase,
    DeletePropertyUseCase,
    GetPropertyUseCase,
    ListPropertiesUseCase,
    UpdatePropertyUseCase,
)
from app.database import get_db
from app.dependencies import (
    get_current_provider,
    get_optional_current_user,
)
from app.domain.entities.user import User
from app.exceptions import GanitelError
from app.infrastructure.repositories.amenity_repository import AmenityRepository
from app.infrastructure.repositories.location_repository import LocationRepository
from app.infrastructure.repositories.property_repository import PropertyRepository
from app.infrastructure.repositories.property_type_repository import (
    PropertyTypeRepository,
)

router = APIRouter()


@router.get("/", response_model=PropertyListResponse)
async def list_properties(
    location_id: UUID | None = Query(None, description="Filter by location"),
    property_type_id: UUID | None = Query(None, description="Filter by property type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    List all active properties with optional filters
    """
    try:
        property_repository = PropertyRepository(db)
        list_use_case = ListPropertiesUseCase(property_repository)

        result = list_use_case.execute(
            skip=skip,
            limit=limit,
            location_id=location_id,
            property_type_id=property_type_id,
        )

        return PropertyListResponse(
            items=[
                PropertyResponse.model_validate(prop) for prop in result["properties"]
            ],
            total=result["total"],
            page=skip // limit + 1,
            per_page=limit,
            total_pages=(result["total"] + limit - 1) // limit,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve properties",
        ) from None


@router.get("/{property_id}", response_model=PropertyDetailResponse)
async def get_property(
    property_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """
    Get property by ID
    """
    try:
        property_repository = PropertyRepository(db)
        get_use_case = GetPropertyUseCase(property_repository)
        property = get_use_case.execute(property_id)
        return PropertyDetailResponse.model_validate(property)

    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve property",
        ) from None


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: PropertyCreateRequest,
    current_user: User = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Create a new property (Provider only)
    """
    try:
        property_repository = PropertyRepository(db)
        location_repository = LocationRepository(db)
        property_type_repository = PropertyTypeRepository(db)
        amenity_repository = AmenityRepository(db)

        create_use_case = CreatePropertyUseCase(
            property_repository,
            location_repository,
            property_type_repository,
            amenity_repository,
        )

        # Create property
        property = create_use_case.execute(
            provider_id=current_user.id,
            title=property_data.title,
            description=property_data.description,
            location_id=property_data.location_id,
            property_type_id=property_data.property_type_id,
            address=property_data.address,
            base_price=property_data.base_price,
            currency=property_data.currency,
            price_per=property_data.price_per,
            short_description=property_data.short_description,
            latitude=property_data.latitude,
            longitude=property_data.longitude,
            max_guests=property_data.max_guests,
            bedrooms=property_data.bedrooms,
            bathrooms=property_data.bathrooms,
            beds=property_data.beds,
            living_rooms=property_data.living_rooms,
            balconies=property_data.balconies,
            amenity_ids=property_data.amenity_ids,
            images=property_data.images,
            instant_book=property_data.instant_book,
            min_stay=property_data.min_stay,
            max_stay=property_data.max_stay,
            check_in_time=property_data.check_in_time,
            check_out_time=property_data.check_out_time,
        )

        return PropertyResponse.model_validate(property)

    except GanitelError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Property creation failed. Please try again.",
        ) from None


@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: UUID,
    property_data: PropertyUpdateRequest,
    current_user: User = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Update an existing property (Provider only)
    """
    try:
        property_repository = PropertyRepository(db)
        location_repository = LocationRepository(db)
        property_type_repository = PropertyTypeRepository(db)

        update_use_case = UpdatePropertyUseCase(
            property_repository,
            location_repository,
            property_type_repository,
        )

        updates = property_data.model_dump(exclude_unset=True)
        property = update_use_case.execute(property_id, current_user.id, updates)
        return PropertyResponse.model_validate(property)

    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update property",
        ) from None


@router.delete("/{property_id}", response_model=MessageResponse)
async def delete_property(
    property_id: UUID,
    current_user: User = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Delete a property (Provider only, soft delete)
    """
    try:
        property_repository = PropertyRepository(db)
        delete_use_case = DeletePropertyUseCase(property_repository)
        delete_use_case.execute(property_id, current_user.id)
        return MessageResponse(message="Property deleted successfully")

    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete property",
        ) from None


@router.get("/provider/my-properties", response_model=PropertyListResponse)
async def get_my_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Get current provider's properties
    """
    try:
        property_repository = PropertyRepository(db)
        list_use_case = ListPropertiesUseCase(property_repository)

        result = list_use_case.execute(
            skip=skip,
            limit=limit,
            provider_id=current_user.id,
        )

        return PropertyListResponse(
            items=[
                PropertyResponse.model_validate(prop) for prop in result["properties"]
            ],
            total=result["total"],
            page=skip // limit + 1,
            per_page=limit,
            total_pages=(result["total"] + limit - 1) // limit,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve your properties",
        ) from None
