"""
Ganitel V2 Backend - Services Endpoints
"""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.schemas.service_schemas import (
    MessageResponse,
    ServiceCreateRequest,
    ServiceListResponse,
    ServiceResponse,
    ServiceSearchResponse,
    ServiceUpdateRequest,
)
from app.application.use_cases.services import (
    CreateServiceUseCase,
    DeleteServiceUseCase,
    GetServiceUseCase,
    SearchServicesUseCase,
    UpdateServiceUseCase,
)
from app.database import get_db
from app.dependencies import (
    get_current_provider,
    get_optional_current_user,
)
from app.domain.entities.service import ServiceType
from app.domain.entities.user import User
from app.exceptions import GanitelError
from app.infrastructure.repositories.service_repository import ServiceRepository
from app.infrastructure.repositories.user_repository import UserRepository

router = APIRouter()


@router.get("/search", response_model=ServiceSearchResponse)
async def search_services(
    q: str | None = Query(None, description="Search query"),
    service_type: ServiceType | None = Query(None, description="Service type filter"),
    country: str | None = Query(None, description="Country filter"),
    city: str | None = Query(None, description="City filter"),
    min_price: float | None = Query(None, ge=0, description="Minimum price"),
    max_price: float | None = Query(None, ge=0, description="Maximum price"),
    amenities: str | None = Query(None, description="Comma-separated amenities"),
    guests: int | None = Query(None, ge=1, description="Number of guests"),
    check_in: date | None = Query(None, description="Check-in date (YYYY-MM-DD)"),
    check_out: date | None = Query(None, description="Check-out date (YYYY-MM-DD)"),
    lat: float | None = Query(None, ge=-90, le=90, description="Latitude"),
    lng: float | None = Query(None, ge=-180, le=180, description="Longitude"),
    radius: float | None = Query(
        10.0, ge=0.1, le=100, description="Search radius in km"
    ),
    sort: str = Query(
        "relevance",
        description="Sort by: relevance, price_low, price_high, rating, newest",
    ),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """
    Search services with filters
    """
    try:
        service_repository = ServiceRepository(db)
        search_use_case = SearchServicesUseCase(service_repository)

        # Parse amenities
        amenities_list = None
        if amenities:
            amenities_list = [a.strip() for a in amenities.split(",") if a.strip()]

        # Calculate skip for pagination
        skip = (page - 1) * per_page

        # Execute search
        search_result = search_use_case.execute(
            query=q,
            service_type=service_type,
            country=country,
            city=city,
            min_price=min_price,
            max_price=max_price,
            amenities=amenities_list,
            max_guests=guests,
            check_in=check_in,
            check_out=check_out,
            latitude=lat,
            longitude=lng,
            radius_km=radius,
            sort_by=sort,
            skip=skip,
            limit=per_page,
        )

        return ServiceSearchResponse(**search_result)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed. Please try again.",
        ) from None


@router.get("/", response_model=ServiceListResponse)
async def list_services(
    service_type: ServiceType | None = Query(None),
    country: str | None = Query(None),
    city: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    List all active services with optional filters
    """
    try:
        service_repository = ServiceRepository(db)

        if service_type or country or city:
            criteria = {}
            if service_type:
                criteria["service_type"] = service_type.value
            if country:
                criteria["country"] = country
            if city:
                criteria["city"] = city

            services = service_repository.find_by_criteria(
                criteria, skip=skip, limit=limit
            )
            total = service_repository.count(criteria)
        else:
            services = service_repository.get_active_services(skip=skip, limit=limit)
            total = service_repository.count({"status": "active"})

        return ServiceListResponse(
            services=[ServiceResponse.model_validate(service) for service in services],
            total=total,
            page=skip // limit + 1,
            per_page=limit,
            pages=(total + limit - 1) // limit,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve services",
        ) from None


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """
    Get service by ID
    """
    try:
        service_repository = ServiceRepository(db)
        get_use_case = GetServiceUseCase(service_repository)
        service = get_use_case.execute(UUID(service_id))
        service_repository.update_view_count(service.id)
        return ServiceResponse.model_validate(service)

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid service ID format"
        ) from None
    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service",
        ) from None


@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_data: ServiceCreateRequest,
    current_user: User = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Create a new service (Provider only)
    """
    try:
        service_repository = ServiceRepository(db)
        user_repository = UserRepository(db)
        create_use_case = CreateServiceUseCase(service_repository, user_repository)

        # Create service
        service = create_use_case.execute(
            provider_id=str(current_user.id),
            title=service_data.title,
            description=service_data.description,
            service_type=service_data.service_type,  # ty: ignore[invalid-argument-type]
            country=service_data.country,
            city=service_data.city,
            address=service_data.address,
            base_price=service_data.base_price,
            currency=service_data.currency,
            accommodation_type=service_data.accommodation_type,  # ty: ignore[invalid-argument-type]
            short_description=service_data.short_description,
            max_guests=service_data.max_guests,
            bedrooms=service_data.bedrooms,
            bathrooms=service_data.bathrooms,
            beds=service_data.beds,
            amenities=service_data.amenities,
            house_rules=service_data.house_rules,
            images=service_data.images,
            latitude=service_data.latitude,
            longitude=service_data.longitude,
            instant_book=service_data.instant_book,
            min_stay=service_data.min_stay,
            max_stay=service_data.max_stay,
            check_in_time=service_data.check_in_time,
            check_out_time=service_data.check_out_time,
        )

        return ServiceResponse.model_validate(service)

    except GanitelError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Service creation failed. Please try again.",
        ) from None


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    service_data: ServiceUpdateRequest,
    current_user: User = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Update an existing service (Provider only)
    """
    try:
        service_repository = ServiceRepository(db)
        update_use_case = UpdateServiceUseCase(service_repository)
        updates = service_data.model_dump(exclude_unset=True)
        service = update_use_case.execute(UUID(service_id), current_user.id, updates)
        return ServiceResponse.model_validate(service)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid service ID format"
        ) from None
    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update service",
        ) from None


@router.delete("/{service_id}", response_model=MessageResponse)
async def delete_service(
    service_id: str,
    current_user: User = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Delete a service (Provider only, soft delete)
    """
    try:
        service_repository = ServiceRepository(db)
        delete_use_case = DeleteServiceUseCase(service_repository)
        delete_use_case.execute(UUID(service_id), current_user.id)
        return MessageResponse(message="Service deleted successfully")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid service ID format"
        ) from None
    except GanitelError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete service",
        ) from None


@router.get("/provider/my-services", response_model=ServiceListResponse)
async def get_my_services(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_provider),
    db: Session = Depends(get_db),
):
    """
    Get current provider's services
    """
    try:
        service_repository = ServiceRepository(db)

        services = service_repository.get_by_provider_id(
            current_user.id, skip=skip, limit=limit
        )

        # Count total services for this provider
        total = service_repository.count({"provider_id": current_user.id})

        return ServiceListResponse(
            services=[ServiceResponse.model_validate(service) for service in services],
            total=total,
            page=skip // limit + 1,
            per_page=limit,
            pages=(total + limit - 1) // limit,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve your services",
        ) from None


@router.get("/featured", response_model=list[ServiceResponse])
async def get_featured_services(
    limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)
):
    """
    Get featured services
    """
    try:
        service_repository = ServiceRepository(db)
        services = service_repository.get_featured_services(limit=limit)

        return [ServiceResponse.model_validate(service) for service in services]

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve featured services",
        ) from None
