"""
Ganitel V2 Backend - Reference Data Seeder

Seeder idempotent des données de référence:
- locations
- property types
- amenity categories
- amenities
"""

import sys
from pathlib import Path
from uuid import uuid4

from sqlalchemy import or_
from sqlalchemy.orm import Session

# Ensure `app` package is importable when script is executed directly
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database import SessionLocal
from app.domain.entities.amenity import Amenity
from app.domain.entities.amenity_category import AmenityCategory
from app.domain.entities.location import Location
from app.domain.entities.property_type import PropertyType

# Reference data to seed
LOCATIONS_DATA = [
    {"name": "Douala", "region": "Littoral"},
    {"name": "Yaoundé", "region": "Centre"},
    {"name": "Buea", "region": "Southwest"},
    {"name": "Limbe", "region": "Southwest"},
    {"name": "Kribi", "region": "South"},
]

PROPERTY_TYPES_DATA = [
    "Apartment",
    "Duplex",
    "Villa",
    "Studio",
    "Room",
]

AMENITY_CATEGORIES_DATA = [
    {"name_en": "General", "name_fr": "Généralités", "display_order": 1},
    {"name_en": "Living Room", "name_fr": "Séjour", "display_order": 2},
    {"name_en": "Main Bedroom", "name_fr": "Chambre Principale", "display_order": 3},
    {"name_en": "Kitchen", "name_fr": "Cuisine", "display_order": 4},
    {"name_en": "Security", "name_fr": "Sécurité", "display_order": 5},
]

AMENITIES_DATA = {
    "General": [
        {"name_en": "WiFi", "name_fr": "WiFi", "icon_path": "amenities/wifi.svg"},
        {
            "name_en": "Cable TV",
            "name_fr": "Télévision câblée",
            "icon_path": "amenities/cable_tv.svg",
        },
        {
            "name_en": "Parking",
            "name_fr": "Parking",
            "icon_path": "amenities/parking.svg",
        },
        {
            "name_en": "Air Conditioning",
            "name_fr": "Climatisation",
            "icon_path": "amenities/air_conditioning.svg",
        },
        {
            "name_en": "Heating",
            "name_fr": "Chauffage",
            "icon_path": "amenities/heating.svg",
        },
        {
            "name_en": "Washer",
            "name_fr": "Lave-linge",
            "icon_path": "amenities/washer.svg",
        },
        {
            "name_en": "Dryer",
            "name_fr": "Sèche-linge",
            "icon_path": "amenities/dryer.svg",
        },
    ],
    "Living Room": [
        {"name_en": "Sofa", "name_fr": "Canapé", "icon_path": "amenities/sofa.svg"},
        {
            "name_en": "Coffee Table",
            "name_fr": "Table basse",
            "icon_path": "amenities/coffee_table.svg",
        },
        {
            "name_en": "Dining Table",
            "name_fr": "Table à manger",
            "icon_path": "amenities/dining_table.svg",
        },
        {
            "name_en": "Balcony",
            "name_fr": "Balcon",
            "icon_path": "amenities/balcony.svg",
        },
        {
            "name_en": "Terrace",
            "name_fr": "Terrasse",
            "icon_path": "amenities/terrace.svg",
        },
    ],
    "Main Bedroom": [
        {
            "name_en": "King Bed",
            "name_fr": "Lit King-Size",
            "icon_path": "amenities/king_bed.svg",
        },
        {
            "name_en": "Queen Bed",
            "name_fr": "Lit Queen-Size",
            "icon_path": "amenities/queen_bed.svg",
        },
        {
            "name_en": "Single Bed",
            "name_fr": "Lit simple",
            "icon_path": "amenities/single_bed.svg",
        },
        {
            "name_en": "Wardrobe",
            "name_fr": "Armoire",
            "icon_path": "amenities/wardrobe.svg",
        },
        {
            "name_en": "Bedside Lamp",
            "name_fr": "Lampe de chevet",
            "icon_path": "amenities/bedside_lamp.svg",
        },
    ],
    "Kitchen": [
        {"name_en": "Oven", "name_fr": "Four", "icon_path": "amenities/oven.svg"},
        {
            "name_en": "Microwave",
            "name_fr": "Micro-ondes",
            "icon_path": "amenities/microwave.svg",
        },
        {
            "name_en": "Refrigerator",
            "name_fr": "Réfrigérateur",
            "icon_path": "amenities/refrigerator.svg",
        },
        {
            "name_en": "Dishwasher",
            "name_fr": "Lave-vaisselle",
            "icon_path": "amenities/dishwasher.svg",
        },
        {
            "name_en": "Utensils",
            "name_fr": "Ustensiles",
            "icon_path": "amenities/utensils.svg",
        },
        {
            "name_en": "Stove",
            "name_fr": "Cuisinière",
            "icon_path": "amenities/stove.svg",
        },
    ],
    "Security": [
        {
            "name_en": "Security Room",
            "name_fr": "Salle de sécurité",
            "icon_path": "amenities/security_room.svg",
        },
        {"name_en": "CCTV", "name_fr": "CCTV", "icon_path": "amenities/cctv.svg"},
        {
            "name_en": "Security Guard",
            "name_fr": "Garde de sécurité",
            "icon_path": "amenities/security_guard.svg",
        },
        {
            "name_en": "Emergency Light",
            "name_fr": "Éclairage d'urgence",
            "icon_path": "amenities/emergency_light.svg",
        },
        {
            "name_en": "Fire Extinguisher",
            "name_fr": "Extincteur",
            "icon_path": "amenities/fire_extinguisher.svg",
        },
    ],
}


def _restore_soft_deleted(entity) -> bool:
    if entity.deleted_at is None:
        return False
    entity.deleted_at = None
    entity.deleted_by = None
    entity.is_active = True
    return True


def seed_locations(db: Session) -> dict[str, int]:
    """Seed locations idempotently and safely with soft-delete aware logic."""
    stats = {"created": 0, "restored": 0, "updated": 0}

    for location_data in LOCATIONS_DATA:
        name = location_data["name"]
        region = location_data.get("region")

        location = db.query(Location).filter(Location.name == name).first()

        if location is None:
            db.add(Location(id=uuid4(), name=name, region=region))
            stats["created"] += 1
            print(f"✓ Created location: {name}")
            continue

        was_restored = _restore_soft_deleted(location)
        if was_restored:
            stats["restored"] += 1

        if location.region != region:
            location.region = region
            stats["updated"] += 1

        if was_restored:
            print(f"✓ Restored location: {name}")
        elif location.region == region:
            print(f"✓ Location already up-to-date: {name}")
        else:
            print(f"✓ Updated location: {name}")

    return stats


def seed_property_types(db: Session) -> dict[str, int]:
    """Seed property types idempotently and safely with soft-delete aware logic."""
    stats = {"created": 0, "restored": 0, "updated": 0}

    for property_type_name in PROPERTY_TYPES_DATA:
        property_type = (
            db.query(PropertyType)
            .filter(PropertyType.name == property_type_name)
            .first()
        )

        if property_type is None:
            db.add(PropertyType(id=uuid4(), name=property_type_name))
            stats["created"] += 1
            print(f"✓ Created property type: {property_type_name}")
            continue

        if _restore_soft_deleted(property_type):
            stats["restored"] += 1
            print(f"✓ Restored property type: {property_type_name}")
        else:
            print(f"✓ Property type already up-to-date: {property_type_name}")

    return stats


def seed_amenities(db: Session) -> dict[str, int]:
    """Seed amenity categories and amenities with idempotent upsert behavior."""
    stats = {
        "categories_created": 0,
        "categories_restored": 0,
        "categories_updated": 0,
        "amenities_created": 0,
        "amenities_restored": 0,
        "amenities_updated": 0,
    }

    for category_data in AMENITY_CATEGORIES_DATA:
        category = (
            db.query(AmenityCategory)
            .filter(
                or_(
                    AmenityCategory.name_en == category_data["name_en"],
                    AmenityCategory.name_fr == category_data["name_fr"],
                )
            )
            .first()
        )

        if category is None:
            category = AmenityCategory(
                id=uuid4(),
                name_en=category_data["name_en"],
                name_fr=category_data["name_fr"],
                display_order=category_data["display_order"],
            )
            db.add(category)
            db.flush()
            stats["categories_created"] += 1
            print(f"✓ Created amenity category: {category_data['name_en']}")
        else:
            was_restored = _restore_soft_deleted(category)
            if was_restored:
                stats["categories_restored"] += 1

            category_changed = False
            if category.name_en != category_data["name_en"]:
                category.name_en = category_data["name_en"]
                category_changed = True
            if category.name_fr != category_data["name_fr"]:
                category.name_fr = category_data["name_fr"]
                category_changed = True
            if category.display_order != category_data["display_order"]:
                category.display_order = category_data["display_order"]
                category_changed = True

            if category_changed:
                stats["categories_updated"] += 1

            if was_restored:
                print(f"✓ Restored amenity category: {category_data['name_en']}")
            elif category_changed:
                print(f"✓ Updated amenity category: {category_data['name_en']}")
            else:
                print(
                    f"✓ Amenity category already up-to-date: {category_data['name_en']}"
                )

        for amenity_data in AMENITIES_DATA.get(category_data["name_en"], []):
            amenity = (
                db.query(Amenity)
                .filter(
                    Amenity.category_id == category.id,
                    Amenity.name_en == amenity_data["name_en"],
                )
                .first()
            )

            if amenity is None:
                db.add(
                    Amenity(
                        id=uuid4(),
                        category_id=category.id,
                        name_en=amenity_data["name_en"],
                        name_fr=amenity_data["name_fr"],
                        icon_path=amenity_data.get("icon_path"),
                    )
                )
                stats["amenities_created"] += 1
                print(f"  ✓ Created amenity: {amenity_data['name_en']}")
                continue

            was_restored = _restore_soft_deleted(amenity)
            if was_restored:
                stats["amenities_restored"] += 1

            amenity_changed = False
            if amenity.name_fr != amenity_data["name_fr"]:
                amenity.name_fr = amenity_data["name_fr"]
                amenity_changed = True
            if amenity.icon_path != amenity_data.get("icon_path"):
                amenity.icon_path = amenity_data.get("icon_path")
                amenity_changed = True

            if amenity_changed:
                stats["amenities_updated"] += 1

            if was_restored:
                print(f"  ✓ Restored amenity: {amenity_data['name_en']}")
            elif amenity_changed:
                print(f"  ✓ Updated amenity: {amenity_data['name_en']}")
            else:
                print(f"  ✓ Amenity already up-to-date: {amenity_data['name_en']}")

    return stats


def main():
    """Seed all reference data with a single transaction."""
    print("\n" + "=" * 60)
    print("🌱 Ganitel Reference Data Seeder - T08")
    print("=" * 60 + "\n")

    db = SessionLocal()
    try:
        total_created = 0
        total_restored = 0
        total_updated = 0

        print("📍 Seeding Locations...")
        location_stats = seed_locations(db)
        total_created += location_stats["created"]
        total_restored += location_stats["restored"]
        total_updated += location_stats["updated"]
        print(
            "   "
            f"({location_stats['created']} created, "
            f"{location_stats['restored']} restored, "
            f"{location_stats['updated']} updated)\n"
        )

        print("🏠 Seeding Property Types...")
        property_type_stats = seed_property_types(db)
        total_created += property_type_stats["created"]
        total_restored += property_type_stats["restored"]
        total_updated += property_type_stats["updated"]
        print(
            "   "
            f"({property_type_stats['created']} created, "
            f"{property_type_stats['restored']} restored, "
            f"{property_type_stats['updated']} updated)\n"
        )

        print("✨ Seeding Amenity Categories and Amenities...")
        amenity_stats = seed_amenities(db)
        total_created += (
            amenity_stats["categories_created"] + amenity_stats["amenities_created"]
        )
        total_restored += (
            amenity_stats["categories_restored"] + amenity_stats["amenities_restored"]
        )
        total_updated += (
            amenity_stats["categories_updated"] + amenity_stats["amenities_updated"]
        )
        print(
            "   "
            f"(categories: {amenity_stats['categories_created']} created, "
            f"{amenity_stats['categories_restored']} restored, "
            f"{amenity_stats['categories_updated']} updated | "
            f"amenities: {amenity_stats['amenities_created']} created, "
            f"{amenity_stats['amenities_restored']} restored, "
            f"{amenity_stats['amenities_updated']} updated)\n"
        )

        db.commit()

        print("=" * 60)
        print("✅ Seed completed successfully!")
        print(f"   Total created:  {total_created}")
        print(f"   Total restored: {total_restored}")
        print(f"   Total updated:  {total_updated}")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n❌ Error during seeding: {e!s}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
