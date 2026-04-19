"""
Ganitel V2 Backend - Property Amenity DB Tests
"""
from uuid import uuid4

from app.domain.entities.location import Location
from app.domain.entities.property_type import PropertyType
from app.domain.entities.property import Property
from app.domain.entities.amenity_category import AmenityCategory
from app.domain.entities.amenity import Amenity
from app.domain.entities.property_amenity import PropertyAmenity


def test_property_amenity_join_works(db_session, sample_provider):
    location = Location(
        id=uuid4(),
        name="Douala",
        region="Littoral",
        is_active=True,
    )
    property_type = PropertyType(
        id=uuid4(),
        name="Apartment",
        is_active=True,
    )

    db_session.add(location)
    db_session.add(property_type)
    db_session.flush()

    prop = Property(
        id=uuid4(),
        title="Property with Amenities",
        description="Property used to validate property-amenity join.",
        provider_id=sample_provider.id,
        location_id=location.id,
        property_type_id=property_type.id,
        address="Akwa, Douala",
        base_price=30000,
        currency="XAF",
        price_per="night",
        instant_book=False,
        min_stay=1,
        is_active=True,
    )

    category = AmenityCategory(
        id=uuid4(),
        name_en="General",
        name_fr="Général",
        icon_path="icons/general.svg",
        display_order=1,
        is_active=True,
    )

    db_session.add(prop)
    db_session.add(category)
    db_session.flush()

    amenity = Amenity(
        id=uuid4(),
        category_id=category.id,
        name_en="WiFi",
        name_fr="WiFi",
        icon_path="icons/wifi.svg",
        is_active=True,
    )
    db_session.add(amenity)
    db_session.flush()

    link = PropertyAmenity(
        id=uuid4(),
        property_id=prop.id,
        amenity_id=amenity.id,
        is_active=True,
    )
    db_session.add(link)
    db_session.commit()

    stored_link = db_session.query(PropertyAmenity).filter(PropertyAmenity.property_id == prop.id).first()

    assert stored_link is not None
    assert stored_link.amenity_id == amenity.id
    assert stored_link.property_id == prop.id
