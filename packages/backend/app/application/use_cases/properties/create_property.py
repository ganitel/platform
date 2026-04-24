"""
Ganitel V2 Backend - Create Property Use Case
"""
from uuid import UUID

from app.domain.entities.property import Property
from app.exceptions import GanitelException


class CreatePropertyUseCase:
    """Create property use case"""

    def __init__(self, property_repository, location_repository, property_type_repository, amenity_repository):
        self.property_repository = property_repository
        self.location_repository = location_repository
        self.property_type_repository = property_type_repository
        self.amenity_repository = amenity_repository

    def execute(
        self,
        provider_id: UUID,
        title: str,
        description: str,
        location_id: UUID,
        property_type_id: UUID,
        address: str,
        base_price: float,
        currency: str = "XAF",
        price_per: str = "night",
        short_description: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        max_guests: int | None = None,
        bedrooms: int | None = None,
        bathrooms: int | None = None,
        beds: int | None = None,
        living_rooms: int | None = None,
        balconies: int | None = None,
        amenity_ids: list[UUID] | None = None,
        images: list[str] | None = None,
        instant_book: bool = False,
        min_stay: int = 1,
        max_stay: int | None = None,
        check_in_time: str = "15:00",
        check_out_time: str = "11:00",
    ) -> Property:
        """
        Create a new property
        """
        # Validate location exists and is not deleted
        location = self.location_repository.get_by_id(location_id)
        if not location or location.deleted_at is not None:
            raise GanitelException(
                message="Invalid location",
                status_code=400
            )

        # Validate property type exists and is not deleted
        property_type = self.property_type_repository.get_by_id(property_type_id)
        if not property_type or property_type.deleted_at is not None:
            raise GanitelException(
                message="Invalid property type",
                status_code=400
            )

        # Create property
        property = Property(
            provider_id=provider_id,
            title=title,
            description=description,
            short_description=short_description,
            location_id=location_id,
            property_type_id=property_type_id,
            address=address,
            latitude=latitude,
            longitude=longitude,
            base_price=base_price,
            currency=currency,
            price_per=price_per,
            max_guests=max_guests,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            beds=beds,
            living_rooms=living_rooms,
            balconies=balconies,
            images=images,
            instant_book=instant_book,
            min_stay=min_stay,
            max_stay=max_stay,
            check_in_time=check_in_time,
            check_out_time=check_out_time,
        )

        # Save property
        saved_property = self.property_repository.create(property)

        # Add amenities if provided
        if amenity_ids:
            for amenity_id in amenity_ids:
                amenity = self.amenity_repository.get_by_id(amenity_id)
                if amenity and amenity.deleted_at is None:
                    # Create property amenity relationship
                    from app.domain.entities.property_amenity import PropertyAmenity
                    property_amenity = PropertyAmenity(
                        property_id=saved_property.id,
                        amenity_id=amenity_id
                    )
                    self.property_repository.session.add(property_amenity)
            self.property_repository.session.commit()

        # Refresh to get relationships
        self.property_repository.session.refresh(saved_property)
        return saved_property
