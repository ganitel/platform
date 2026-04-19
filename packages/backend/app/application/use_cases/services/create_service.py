"""
Ganitel V2 Backend - Create Service Use Case
"""
from typing import Optional, List
from uuid import UUID, uuid4

from app.domain.entities.service import Service, ServiceType, ServiceStatus, AccommodationType
from app.domain.repositories.service_repository import IServiceRepository
from app.domain.repositories.user_repository import IUserRepository
from app.exceptions import UserNotFoundError, ValidationError

class CreateServiceUseCase:
    """Use case responsible for creating new listings/services"""

    def __init__(
        self,
        service_repository: IServiceRepository,
        user_repository: IUserRepository,
    ):
        self.service_repository = service_repository
        self.user_repository = user_repository

    def execute(
        self,
        provider_id: str,
        title: str,
        description: str,
        service_type: ServiceType,
        country: str,
        city: str,
        address: str,
        base_price: float,
        currency: str = "XAF",
        accommodation_type: Optional[AccommodationType] = None,
        short_description: Optional[str] = None,
        max_guests: Optional[int] = None,
        bedrooms: Optional[int] = None,
        bathrooms: Optional[int] = None,
        beds: Optional[int] = None,
        amenities: Optional[List[str]] = None,
        house_rules: Optional[List[str]] = None,
        images: Optional[List[str]] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        instant_book: bool = False,
        min_stay: int = 1,
        max_stay: Optional[int] = None,
        check_in_time: str = "15:00",
        check_out_time: str = "11:00",
    ) -> Service:
        provider = self.user_repository.get_by_id(UUID(provider_id))
        if not provider:
            raise UserNotFoundError("Provider not found")

        if provider.user_type != "provider":
            raise ValidationError("User must be a provider to create services")

        service = Service(
            id=uuid4(),
            title=title,
            description=description,
            short_description=short_description,
            service_type=service_type.value,
            accommodation_type=accommodation_type.value if accommodation_type else None,
            status=ServiceStatus.DRAFT.value,
            provider_id=UUID(provider_id),
            country=country,
            city=city,
            address=address,
            latitude=latitude,
            longitude=longitude,
            base_price=base_price,
            currency=currency,
            price_per="night",
            max_guests=max_guests,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            beds=beds,
            amenities=amenities or [],
            house_rules=house_rules or [],
            images=images or [],
            instant_book=instant_book,
            min_stay=min_stay,
            max_stay=max_stay,
            check_in_time=check_in_time,
            check_out_time=check_out_time,
            is_active=True,
        )

        service.generate_slug()
        created = self.service_repository.create(service)
        return created

