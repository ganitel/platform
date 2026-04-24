"""
Legacy SQL backup migration ETL (MySQL dump -> Ganitel V1 Postgres schema).

Scope:
- users
- locations
- property_types
- properties
- amenity_categories / amenities
- property_amenities
- services (accommodation only for active/published legacy properties)

Usage:
  python app/scripts/legacy_migration_etl.py --source residencemg_backup.sql --dry-run
  python app/scripts/legacy_migration_etl.py --source residencemg_backup.sql --apply
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import and_, text
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database import SessionLocal
from app.domain.entities.amenity import Amenity
from app.domain.entities.amenity_category import AmenityCategory
from app.domain.entities.location import Location
from app.domain.entities.property import Property
from app.domain.entities.property_amenity import PropertyAmenity
from app.domain.entities.property_type import PropertyType
from app.domain.entities.service import Service, ServiceStatus, ServiceType
from app.domain.entities.user import User, UserStatus, UserType

ALLOWED_TABLES = {"user", "region", "city", "house_type", "houses", "facilities"}
DEFAULT_METADATA_KEYS = [
    "legacy_id",
    "legacy_source",
    "legacy_status",
    "legacy_type_label",
    "legacy_media_paths",
]

CATEGORY_KEYWORDS: dict[str, str] = {
    "wifi": "General",
    "tv": "General",
    "netflix": "General",
    "parking": "General",
    "air": "General",
    "washer": "General",
    "machine": "General",
    "elevator": "General",
    "balcony": "Living Room",
    "terrace": "Living Room",
    "terasse": "Living Room",
    "bed": "Main Bedroom",
    "wardrobe": "Main Bedroom",
    "kitchen": "Kitchen",
    "security": "Security",
    "guard": "Security",
    "camera": "Security",
    "fire": "Security",
    "alarm": "Security",
}

SERVICE_STATUS_ACTIVE_VALUES = {"1", "true", "active", "published"}


@dataclass
class ExtractedData:
    users: list[dict[str, Any]]
    regions: list[dict[str, Any]]
    cities: list[dict[str, Any]]
    house_types: list[dict[str, Any]]
    houses: list[dict[str, Any]]
    facilities: list[dict[str, Any]]


@dataclass
class MigrationStats:
    users_created: int = 0
    users_updated: int = 0
    users_mapped: int = 0
    locations_created: int = 0
    locations_updated: int = 0
    property_types_mapped: int = 0
    properties_created: int = 0
    properties_updated: int = 0
    services_created: int = 0
    services_updated: int = 0
    amenities_created: int = 0
    amenities_updated: int = 0
    property_amenities_linked: int = 0
    anomalies: int = 0


class LegacyMigrationETL:
    def __init__(
        self,
        db: Session,
        source_path: Path,
        apply_changes: bool,
        report_dir: Path,
        metadata_keys: list[str] | None = None,
    ) -> None:
        self.db = db
        self.source_path = source_path
        self.apply_changes = apply_changes
        self.report_dir = report_dir
        self.metadata_keys = metadata_keys or DEFAULT_METADATA_KEYS
        self.stats = MigrationStats()
        self.anomalies: list[dict[str, Any]] = []

        self._location_by_norm: dict[str, Location] = {}
        self._property_type_by_norm: dict[str, PropertyType] = {}
        self._amenity_by_norm: dict[str, Amenity] = {}

    def run(self) -> dict[str, Any]:
        extracted = self.extract()

        if not self.apply_changes:
            report = self._build_report(extracted, dry_run=True)
            self._write_report(report)
            return report

        self.load_users(extracted)
        self.load_locations(extracted)
        self.load_property_types(extracted)
        self.load_properties_and_services(extracted)
        self.load_amenities_and_links(extracted)

        self.db.commit()

        report = self._build_report(extracted, dry_run=False)
        self._write_report(report)
        return report

    def extract(self) -> ExtractedData:
        raw = self.source_path.read_text(encoding="utf-8", errors="replace")
        inserts = self._extract_insert_blocks(raw)

        users = [self._map_user_row(row) for row in inserts.get("user", [])]
        regions = [self._map_region_row(row) for row in inserts.get("region", [])]
        cities = [self._map_city_row(row) for row in inserts.get("city", [])]
        house_types = [self._map_house_type_row(row) for row in inserts.get("house_type", [])]
        houses = [self._map_house_row(row) for row in inserts.get("houses", [])]
        facilities = [self._map_facility_row(row) for row in inserts.get("facilities", [])]

        return ExtractedData(
            users=users,
            regions=regions,
            cities=cities,
            house_types=house_types,
            houses=houses,
            facilities=facilities,
        )

    def load_users(self, data: ExtractedData) -> None:
        provider_phones = {
            self._normalize_phone(item.get("user_phone"))
            for item in data.houses
            if item.get("user_phone")
        }
        provider_phones.discard(None)

        dedup_cache: dict[str, User] = {}

        for src in data.users:
            old_id = src["id"]
            existing_map = self._get_map("migration_map_users", old_id)
            email = self._normalize_email(src.get("email"))
            phone = self._normalize_phone(src.get("telephone"))

            if not email and not phone:
                email = f"legacy_user_{old_id}@legacy.ganitel.local"

            key = f"email:{email}" if email else f"phone:{phone}"

            mapped_user: User | None = None
            if existing_map:
                mapped_user = self.db.query(User).filter(User.id == existing_map["new_id"]).first()

            if not mapped_user and key in dedup_cache:
                mapped_user = dedup_cache[key]

            if not mapped_user:
                mapped_user = self._find_existing_user(email, phone)

            first_name, last_name = self._split_name(src.get("fullname") or "Legacy User")
            normalized_role = (src.get("role") or "").strip().lower()

            user_type = UserType.TRAVELER.value
            if normalized_role == "admin":
                user_type = UserType.ADMIN.value
            elif phone and phone in provider_phones:
                user_type = UserType.PROVIDER.value

            status = UserStatus.ACTIVE.value if (src.get("status") or "").strip().lower() == "active" else UserStatus.PENDING_VERIFICATION.value

            if not mapped_user:
                mapped_user = User(
                    id=uuid4(),
                    email=email,
                    phone=phone,
                    first_name=first_name,
                    last_name=last_name,
                    hashed_password=src.get("password"),
                    user_type=user_type,
                    status=status,
                    is_verified=status == UserStatus.ACTIVE.value,
                    profile_picture=src.get("image"),
                    bio=src.get("description"),
                    city=src.get("city"),
                    country="Cameroon",
                    language="fr",
                    currency="XAF",
                    is_active=True,
                )
                self.db.add(mapped_user)
                self.db.flush()
                self.stats.users_created += 1
            else:
                changed = False
                changed |= self._set_if_changed(mapped_user, "email", email)
                changed |= self._set_if_changed(mapped_user, "phone", phone)
                changed |= self._set_if_changed(mapped_user, "first_name", first_name)
                changed |= self._set_if_changed(mapped_user, "last_name", last_name)
                changed |= self._set_if_changed(mapped_user, "hashed_password", src.get("password"))
                changed |= self._set_if_changed(mapped_user, "user_type", user_type)
                changed |= self._set_if_changed(mapped_user, "status", status)
                changed |= self._set_if_changed(mapped_user, "is_verified", status == UserStatus.ACTIVE.value)
                changed |= self._set_if_changed(mapped_user, "profile_picture", src.get("image"))
                changed |= self._set_if_changed(mapped_user, "bio", src.get("description"))
                changed |= self._set_if_changed(mapped_user, "city", src.get("city"))
                if changed:
                    self.stats.users_updated += 1

            dedup_cache[key] = mapped_user

            payload = {
                "legacy_email": src.get("email"),
                "legacy_phone": src.get("telephone"),
                "role": src.get("role"),
            }
            self._upsert_map(
                "migration_map_users",
                old_id,
                mapped_user.id,
                self._hash_payload(payload),
                payload,
            )
            self.stats.users_mapped += 1

        self.db.commit()

    def load_locations(self, data: ExtractedData) -> None:
        regions_by_id = {row["id"]: row["name"] for row in data.regions}

        for city in data.cities:
            old_id = city["id"]
            city_name = self._normalize_city(city.get("name"))
            if not city_name:
                self._record_anomaly("location", f"Invalid city name for legacy city id={old_id}", city)
                continue

            region_name = regions_by_id.get(city.get("region_id"))
            location = self.db.query(Location).filter(Location.name == city_name).first()
            if not location:
                location = Location(id=uuid4(), name=city_name, region=region_name)
                self.db.add(location)
                self.db.flush()
                self.stats.locations_created += 1
            else:
                if region_name and location.region != region_name:
                    location.region = region_name
                    self.stats.locations_updated += 1

            self._upsert_map(
                "migration_map_locations",
                old_id,
                location.id,
                self._hash_payload(city),
                city,
            )

        self.db.flush()
        self._location_by_norm = {
            self._normalize_key(loc.name): loc
            for loc in self.db.query(Location).filter(Location.deleted_at.is_(None)).all()
        }
        self.db.commit()

    def load_property_types(self, data: ExtractedData) -> None:
        canonical = {
            "apartment": "Apartment",
            "studio": "Studio",
            "singleroom": "Room",
            "room": "Room",
            "duplexvilla": "Duplex",
            "duplex": "Duplex",
            "villa": "Villa",
        }

        for src in data.house_types:
            old_id = src["id"]
            raw_name = (src.get("type") or "").strip()
            normalized = canonical.get(self._normalize_key(raw_name), "Room")

            obj = self.db.query(PropertyType).filter(PropertyType.name == normalized).first()
            if not obj:
                obj = PropertyType(id=uuid4(), name=normalized)
                self.db.add(obj)
                self.db.flush()

            self._upsert_map(
                "migration_map_property_types",
                old_id,
                obj.id,
                self._hash_payload(src),
                src,
            )
            self.stats.property_types_mapped += 1

        self.db.flush()
        self._property_type_by_norm = {
            self._normalize_key(t.name): t
            for t in self.db.query(PropertyType).filter(PropertyType.deleted_at.is_(None)).all()
        }
        self.db.commit()

    def load_properties_and_services(self, data: ExtractedData) -> None:
        user_by_phone = {
            self._normalize_phone(user.phone): user
            for user in self.db.query(User).filter(User.deleted_at.is_(None)).all()
            if user.phone
        }

        for src in data.houses:
            old_id = src["id"]

            map_row = self._get_map("migration_map_properties", old_id)
            prop = None
            if map_row:
                prop = self.db.query(Property).filter(Property.id == map_row["new_id"]).first()

            provider_phone = self._normalize_phone(src.get("user_phone"))
            provider = user_by_phone.get(provider_phone)
            if not provider:
                self._record_anomaly("property", f"Provider not found for legacy house id={old_id}", src)
                continue

            location = self._resolve_location(src.get("city"))
            if not location:
                self._record_anomaly("property", f"Location not found for legacy house id={old_id}", src)
                continue

            ptype = self._resolve_property_type(src)
            if not ptype:
                self._record_anomaly("property", f"Property type not resolved for legacy house id={old_id}", src)
                continue

            title = (src.get("location") or "").strip() or f"Legacy Property #{old_id}"
            description = (src.get("description") or src.get("description_fr") or "Legacy imported property").strip()
            address = (src.get("location") or src.get("city") or "Unknown").strip()
            base_price = self._safe_decimal(src.get("discPrice")) or self._safe_decimal(src.get("price")) or 0
            images = self._collect_images(src.get("image"), src.get("other_images"))

            if not prop:
                prop = Property(
                    id=uuid4(),
                    title=title,
                    description=description,
                    short_description=(description[:497] + "...") if len(description) > 500 else description,
                    provider_id=provider.id,
                    location_id=location.id,
                    property_type_id=ptype.id,
                    address=address,
                    latitude=None,
                    longitude=None,
                    base_price=base_price,
                    currency="XAF",
                    price_per="night",
                    max_guests=self._safe_int(src.get("guestnum")),
                    bedrooms=self._safe_int(src.get("rooms")),
                    bathrooms=self._safe_int(src.get("toilets")),
                    beds=self._safe_int(src.get("rooms")),
                    living_rooms=self._safe_int(src.get("livrooms")),
                    balconies=self._safe_int(src.get("balconies")),
                    instant_book=False,
                    min_stay=1,
                    max_stay=None,
                    check_in_time="15:00",
                    check_out_time="11:00",
                    images=images,
                    is_active=self._is_active_legacy_property(src),
                )
                self.db.add(prop)
                self.db.flush()
                self.stats.properties_created += 1
            else:
                changed = False
                changed |= self._set_if_changed(prop, "title", title)
                changed |= self._set_if_changed(prop, "description", description)
                changed |= self._set_if_changed(prop, "short_description", (description[:497] + "...") if len(description) > 500 else description)
                changed |= self._set_if_changed(prop, "provider_id", provider.id)
                changed |= self._set_if_changed(prop, "location_id", location.id)
                changed |= self._set_if_changed(prop, "property_type_id", ptype.id)
                changed |= self._set_if_changed(prop, "address", address)
                changed |= self._set_if_changed(prop, "base_price", base_price)
                changed |= self._set_if_changed(prop, "max_guests", self._safe_int(src.get("guestnum")))
                changed |= self._set_if_changed(prop, "bedrooms", self._safe_int(src.get("rooms")))
                changed |= self._set_if_changed(prop, "bathrooms", self._safe_int(src.get("toilets")))
                changed |= self._set_if_changed(prop, "beds", self._safe_int(src.get("rooms")))
                changed |= self._set_if_changed(prop, "living_rooms", self._safe_int(src.get("livrooms")))
                changed |= self._set_if_changed(prop, "balconies", self._safe_int(src.get("balconies")))
                changed |= self._set_if_changed(prop, "images", images)
                changed |= self._set_if_changed(prop, "is_active", self._is_active_legacy_property(src))
                if changed:
                    self.stats.properties_updated += 1

            payload = {
                "legacy_id": old_id,
                "legacy_source": "residencemg_backup.sql",
                "legacy_status": src.get("status"),
                "legacy_type_label": src.get("type"),
                "legacy_media_paths": images,
            }
            self._upsert_map(
                "migration_map_properties",
                old_id,
                prop.id,
                self._hash_payload(payload),
                payload,
            )

            self._upsert_service_for_active_property(src, prop, provider, location, ptype)

        self.db.commit()

    def load_amenities_and_links(self, data: ExtractedData) -> None:
        categories = {
            c.name_en: c
            for c in self.db.query(AmenityCategory).filter(AmenityCategory.deleted_at.is_(None)).all()
        }

        for expected in ["General", "Living Room", "Main Bedroom", "Kitchen", "Security"]:
            if expected not in categories:
                c = AmenityCategory(
                    id=uuid4(),
                    name_en=expected,
                    name_fr=expected,
                    display_order=len(categories) + 1,
                )
                self.db.add(c)
                self.db.flush()
                categories[expected] = c

        for facility in data.facilities:
            old_id = facility["id"]
            name_en = (facility.get("name_en") or "").strip() or f"Legacy Amenity {old_id}"
            name_fr = (facility.get("name_fr") or name_en).strip()
            category_name = self._resolve_category_name(name_en)
            category = categories[category_name]

            amenity = self.db.query(Amenity).filter(
                and_(Amenity.category_id == category.id, Amenity.name_en == name_en)
            ).first()

            if not amenity:
                amenity = Amenity(
                    id=uuid4(),
                    category_id=category.id,
                    name_en=name_en,
                    name_fr=name_fr,
                    icon_path=None,
                )
                self.db.add(amenity)
                self.db.flush()
                self.stats.amenities_created += 1
            else:
                changed = False
                changed |= self._set_if_changed(amenity, "name_fr", name_fr)
                changed |= self._set_if_changed(amenity, "category_id", category.id)
                if changed:
                    self.stats.amenities_updated += 1

            self._upsert_map(
                "migration_map_amenities",
                old_id,
                amenity.id,
                self._hash_payload(facility),
                facility,
            )

        self.db.flush()

        amenity_rows = self.db.query(Amenity).filter(Amenity.deleted_at.is_(None)).all()
        self._amenity_by_norm = {self._normalize_key(row.name_en): row for row in amenity_rows}

        for house in data.houses:
            prop_map = self._get_map("migration_map_properties", house["id"])
            if not prop_map:
                continue
            property_id = prop_map["new_id"]

            tokens = self._tokenize_facilities(house.get("facilities"))
            for token in tokens:
                amenity = self._resolve_amenity_by_token(token)
                if not amenity:
                    continue

                exists = self.db.query(PropertyAmenity).filter(
                    PropertyAmenity.property_id == property_id,
                    PropertyAmenity.amenity_id == amenity.id,
                ).first()
                if exists:
                    continue

                link = PropertyAmenity(
                    id=uuid4(),
                    property_id=property_id,
                    amenity_id=amenity.id,
                )
                self.db.add(link)
                self.stats.property_amenities_linked += 1

        self.db.commit()

    def _upsert_service_for_active_property(
        self,
        src_house: dict[str, Any],
        prop: Property,
        provider: User,
        location: Location,
        ptype: PropertyType,
    ) -> None:
        if not self._is_active_legacy_property(src_house):
            return

        slug = f"legacy-house-{src_house['id']}"
        service = self.db.query(Service).filter(Service.slug == slug).first()

        accommodation_type = self._service_accommodation_type(ptype.name)
        status = ServiceStatus.ACTIVE.value

        if not service:
            service = Service(
                id=uuid4(),
                title=prop.title,
                description=prop.description,
                short_description=prop.short_description,
                service_type=ServiceType.ACCOMMODATION.value,
                accommodation_type=accommodation_type,
                status=status,
                provider_id=provider.id,
                country="Cameroon",
                city=location.name,
                address=prop.address,
                latitude=prop.latitude,
                longitude=prop.longitude,
                base_price=prop.base_price,
                currency=prop.currency,
                price_per=prop.price_per,
                max_guests=prop.max_guests,
                bedrooms=prop.bedrooms,
                bathrooms=prop.bathrooms,
                beds=prop.beds,
                amenities=None,
                features={
                    key: value
                    for key, value in {
                        "legacy_id": src_house.get("id"),
                        "legacy_source": "residencemg_backup.sql",
                        "legacy_status": src_house.get("status"),
                        "legacy_type_label": src_house.get("type"),
                        "legacy_media_paths": self._collect_images(src_house.get("image"), src_house.get("other_images")),
                    }.items()
                    if key in self.metadata_keys
                },
                house_rules=self._tokenize_rules(src_house.get("rules")),
                instant_book=False,
                min_stay=1,
                max_stay=None,
                check_in_time=prop.check_in_time,
                check_out_time=prop.check_out_time,
                images=prop.images,
                slug=slug,
                is_active=True,
            )
            self.db.add(service)
            self.stats.services_created += 1
            return

        changed = False
        changed |= self._set_if_changed(service, "title", prop.title)
        changed |= self._set_if_changed(service, "description", prop.description)
        changed |= self._set_if_changed(service, "short_description", prop.short_description)
        changed |= self._set_if_changed(service, "service_type", ServiceType.ACCOMMODATION.value)
        changed |= self._set_if_changed(service, "accommodation_type", accommodation_type)
        changed |= self._set_if_changed(service, "status", status)
        changed |= self._set_if_changed(service, "provider_id", provider.id)
        changed |= self._set_if_changed(service, "country", "Cameroon")
        changed |= self._set_if_changed(service, "city", location.name)
        changed |= self._set_if_changed(service, "address", prop.address)
        changed |= self._set_if_changed(service, "base_price", prop.base_price)
        changed |= self._set_if_changed(service, "currency", prop.currency)
        changed |= self._set_if_changed(service, "price_per", prop.price_per)
        changed |= self._set_if_changed(service, "max_guests", prop.max_guests)
        changed |= self._set_if_changed(service, "bedrooms", prop.bedrooms)
        changed |= self._set_if_changed(service, "bathrooms", prop.bathrooms)
        changed |= self._set_if_changed(service, "beds", prop.beds)
        changed |= self._set_if_changed(service, "house_rules", self._tokenize_rules(src_house.get("rules")))
        changed |= self._set_if_changed(service, "images", prop.images)
        changed |= self._set_if_changed(service, "is_active", True)

        if changed:
            self.stats.services_updated += 1

    def _extract_insert_blocks(self, sql_text: str) -> dict[str, list[list[Any]]]:
        out: dict[str, list[list[Any]]] = {table: [] for table in ALLOWED_TABLES}
        marker = "INSERT INTO `"
        cursor = 0

        while True:
            start = sql_text.find(marker, cursor)
            if start < 0:
                break

            table_start = start + len(marker)
            table_end = sql_text.find("`", table_start)
            if table_end < 0:
                break

            table = sql_text[table_start:table_end]

            values_marker = " VALUES "
            values_start = sql_text.find(values_marker, table_end)
            if values_start < 0:
                cursor = table_end + 1
                continue

            stmt_start = values_start + len(values_marker)
            stmt_end = self._find_statement_terminator(sql_text, stmt_start)
            if stmt_end < 0:
                break

            if table in ALLOWED_TABLES:
                values_part = sql_text[stmt_start:stmt_end]
                tuples = self._split_tuples(values_part)
                for tuple_text in tuples:
                    row = self._parse_tuple(tuple_text)
                    out[table].append(row)

            cursor = stmt_end + 1

        return out

    def _find_statement_terminator(self, sql_text: str, start_idx: int) -> int:
        in_string = False
        escaped = False

        for idx in range(start_idx, len(sql_text)):
            char = sql_text[idx]

            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == "'":
                    in_string = False
                continue

            if char == "'":
                in_string = True
                continue

            if char == ";":
                return idx

        return -1

    def _split_tuples(self, values_text: str) -> list[str]:
        tuples: list[str] = []
        in_string = False
        escaped = False
        depth = 0
        start_idx = -1

        for idx, char in enumerate(values_text):
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == "'":
                    in_string = False
                continue

            if char == "'":
                in_string = True
                continue

            if char == "(":
                if depth == 0:
                    start_idx = idx + 1
                depth += 1
                continue

            if char == ")":
                depth -= 1
                if depth == 0 and start_idx >= 0:
                    tuples.append(values_text[start_idx:idx])
                    start_idx = -1

        return tuples

    def _parse_tuple(self, tuple_text: str) -> list[Any]:
        values: list[str] = []
        in_string = False
        escaped = False
        token_start = 0

        for idx, char in enumerate(tuple_text):
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == "'":
                    in_string = False
                continue

            if char == "'":
                in_string = True
                continue

            if char == ",":
                values.append(tuple_text[token_start:idx])
                token_start = idx + 1

        values.append(tuple_text[token_start:])
        return [self._coerce_sql_value(item.strip()) for item in values]

    def _coerce_sql_value(self, raw: str) -> Any:
        if raw.upper() == "NULL":
            return None

        if len(raw) >= 2 and raw[0] == "'" and raw[-1] == "'":
            value = raw[1:-1]
            return self._unescape_mysql_string(value)

        if re.fullmatch(r"-?\d+", raw):
            try:
                return int(raw)
            except ValueError:
                return raw

        return raw

    @staticmethod
    def _unescape_mysql_string(value: str) -> str:
        replacements = {
            r"\\0": "\x00",
            r"\\b": "\b",
            r"\\n": "\n",
            r"\\r": "\r",
            r"\\t": "\t",
            r"\\Z": "\x1a",
            r"\\\"": '"',
            r"\\'": "'",
            r"\\\\": "\\",
        }
        out = value
        for src, target in replacements.items():
            out = out.replace(src, target)
        return out

    @staticmethod
    def _map_user_row(row: list[Any]) -> dict[str, Any]:
        return {
            "id": row[0],
            "fullname": row[1],
            "city": row[2],
            "password": row[3],
            "email": row[4],
            "telephone": row[5],
            "phone2": row[6],
            "role": row[7],
            "status": row[8],
            "description": row[11],
            "image": row[12],
            "last_sign": row[13],
        }

    @staticmethod
    def _map_region_row(row: list[Any]) -> dict[str, Any]:
        return {"id": row[0], "name": row[1]}

    @staticmethod
    def _map_city_row(row: list[Any]) -> dict[str, Any]:
        return {"id": row[0], "name": row[1], "region_id": row[2]}

    @staticmethod
    def _map_house_type_row(row: list[Any]) -> dict[str, Any]:
        return {"id": row[0], "type": row[1]}

    @staticmethod
    def _map_house_row(row: list[Any]) -> dict[str, Any]:
        return {
            "id": row[0],
            "city": row[1],
            "location": row[2],
            "type": row[3],
            "description": row[4],
            "description_fr": row[5],
            "landlord": row[6],
            "rooms": row[7],
            "toilets": row[8],
            "price": row[9],
            "discPrice": row[10],
            "status": row[11],
            "published": row[12],
            "user_phone": row[13],
            "rules": row[14],
            "facilities": row[15],
            "rules_fr": row[16],
            "facilities_fr": row[17],
            "owner": row[18],
            "balconies": row[19],
            "livrooms": row[20],
            "guestnum": row[21],
            "views": row[22],
            "image": row[23],
            "other_images": row[24],
            "last_edit": row[25],
            "numUnits": row[26],
        }

    @staticmethod
    def _map_facility_row(row: list[Any]) -> dict[str, Any]:
        return {"id": row[0], "name_en": row[1], "name_fr": row[2]}

    def _find_existing_user(self, email: str | None, phone: str | None) -> User | None:
        if email:
            found = self.db.query(User).filter(User.email == email).first()
            if found:
                return found
        if phone:
            found = self.db.query(User).filter(User.phone == phone).first()
            if found:
                return found
        return None

    def _resolve_location(self, raw_city: str | None) -> Location | None:
        if not self._location_by_norm:
            self._location_by_norm = {
                self._normalize_key(loc.name): loc
                for loc in self.db.query(Location).filter(Location.deleted_at.is_(None)).all()
            }

        city = self._normalize_city(raw_city)
        if not city:
            return None

        norm = self._normalize_key(city)
        if norm in self._location_by_norm:
            return self._location_by_norm[norm]

        loc = Location(id=uuid4(), name=city, region=None)
        self.db.add(loc)
        self.db.flush()
        self._location_by_norm[norm] = loc
        self.stats.locations_created += 1
        return loc

    def _resolve_property_type(self, house: dict[str, Any]) -> PropertyType | None:
        if not self._property_type_by_norm:
            self._property_type_by_norm = {
                self._normalize_key(t.name): t
                for t in self.db.query(PropertyType).filter(PropertyType.deleted_at.is_(None)).all()
            }

        raw = (house.get("type") or "").strip()
        normalized = self._normalize_key(raw)

        if normalized in {"apartment", "studio", "room", "singleroom", "duplex", "villa"}:
            mapped = "room" if normalized == "singleroom" else normalized
        elif normalized == "duplexvilla":
            text_blob = f"{house.get('location') or ''} {house.get('description') or ''}".lower()
            mapped = "villa" if "villa" in text_blob else "duplex"
        else:
            mapped = "room"

        return self._property_type_by_norm.get(mapped)

    def _resolve_category_name(self, amenity_name: str) -> str:
        norm = self._normalize_key(amenity_name)
        for token, category in CATEGORY_KEYWORDS.items():
            if token in norm:
                return category
        return "General"

    def _resolve_amenity_by_token(self, token: str) -> Amenity | None:
        normalized = self._normalize_key(token)
        if normalized in self._amenity_by_norm:
            return self._amenity_by_norm[normalized]

        aliases = {
            "wi fi": "wifi",
            "wi-fi": "wifi",
            "air conditioner": "air conditioning",
            "flat screen tv": "cable tv",
            "parking space": "parking",
            "video surveillance camera": "cctv",
            "security guard": "security guard",
            "hot water": "heating",
            "standby generator": "emergency light",
            "terasse": "terrace",
            "netflix": "cable tv",
            "decoder": "cable tv",
        }
        alias_norm = self._normalize_key(aliases.get(token.lower(), aliases.get(normalized, "")))
        if alias_norm and alias_norm in self._amenity_by_norm:
            return self._amenity_by_norm[alias_norm]
        return None

    def _service_accommodation_type(self, property_type_name: str) -> str:
        norm = self._normalize_key(property_type_name)
        if norm == "apartment":
            return "apartment"
        if norm == "villa":
            return "villa"
        if norm == "room":
            return "guesthouse"
        return "house"

    def _is_active_legacy_property(self, house: dict[str, Any]) -> bool:
        status = str(house.get("status") or "").strip().lower()
        published = str(house.get("published") or "").strip().lower()
        return status in SERVICE_STATUS_ACTIVE_VALUES or published in SERVICE_STATUS_ACTIVE_VALUES or bool(published)

    def _collect_images(self, primary: Any, other_images: Any) -> list[str]:
        images: list[str] = []
        if primary and str(primary).strip():
            images.append(str(primary).strip())

        if other_images and str(other_images).strip():
            tokens = re.split(r"[\s,]+", str(other_images).strip())
            for token in tokens:
                clean = token.strip()
                if clean and clean not in images:
                    images.append(clean)

        return images

    def _tokenize_facilities(self, facilities: Any) -> list[str]:
        if not facilities:
            return []
        tokens = [item.strip() for item in re.split(r",|;", str(facilities))]
        return [token for token in tokens if token]

    def _tokenize_rules(self, rules: Any) -> list[str]:
        if not rules:
            return []
        tokens = [item.strip() for item in re.split(r",|;", str(rules))]
        return [token for token in tokens if token]

    def _get_map(self, table_name: str, old_id: int) -> dict[str, Any] | None:
        sql = text(f"SELECT old_id, new_id, source_hash FROM {table_name} WHERE old_id = :old_id")
        row = self.db.execute(sql, {"old_id": old_id}).mappings().first()
        return dict(row) if row else None

    def _upsert_map(self, table_name: str, old_id: int, new_id: Any, source_hash: str, payload: dict[str, Any]) -> None:
        sql = text(
            f"""
            INSERT INTO {table_name} (id, old_id, new_id, source_hash, payload, created_at, updated_at)
            VALUES (:id, :old_id, :new_id, :source_hash, CAST(:payload AS jsonb), NOW(), NOW())
            ON CONFLICT (old_id)
            DO UPDATE SET
              new_id = EXCLUDED.new_id,
              source_hash = EXCLUDED.source_hash,
              payload = EXCLUDED.payload,
              updated_at = NOW()
            """
        )
        self.db.execute(
            sql,
            {
                "id": str(uuid4()),
                "old_id": old_id,
                "new_id": str(new_id),
                "source_hash": source_hash,
                "payload": json.dumps(payload, ensure_ascii=False),
            },
        )

    def _record_anomaly(self, category: str, message: str, payload: dict[str, Any]) -> None:
        self.stats.anomalies += 1
        self.anomalies.append({"category": category, "message": message, "payload": payload})

    @staticmethod
    def _set_if_changed(entity: Any, field_name: str, new_value: Any) -> bool:
        old_value = getattr(entity, field_name)
        if old_value != new_value:
            setattr(entity, field_name, new_value)
            return True
        return False

    @staticmethod
    def _normalize_email(email: str | None) -> str | None:
        if not email:
            return None
        value = email.strip().lower()
        if not value or "@" not in value:
            return None
        return value

    @staticmethod
    def _normalize_phone(phone: str | None) -> str | None:
        if not phone:
            return None
        cleaned = re.sub(r"[^\d+]", "", str(phone))
        if not cleaned:
            return None

        if cleaned.startswith("+"):
            digits = "+" + re.sub(r"\D", "", cleaned)
        else:
            digits = re.sub(r"\D", "", cleaned)
            if digits.startswith("237") and len(digits) > 9:
                digits = "+" + digits
            elif len(digits) == 9:
                digits = "+237" + digits
            else:
                digits = "+" + digits
        return digits

    @staticmethod
    def _split_name(full_name: str) -> tuple[str, str]:
        clean = re.sub(r"\s+", " ", full_name or "").strip()
        if not clean:
            return "Legacy", "User"
        parts = clean.split(" ", 1)
        if len(parts) == 1:
            return parts[0], "User"
        return parts[0], parts[1]

    @staticmethod
    def _normalize_key(value: str | None) -> str:
        if not value:
            return ""
        return re.sub(r"[^a-z0-9]", "", value.lower())

    @staticmethod
    def _normalize_city(raw_city: str | None) -> str | None:
        if not raw_city:
            return None
        city = re.sub(r"\s+", " ", str(raw_city)).strip()
        invalid = {
            "choose city",
            "choisir une ville",
            "select a country",
            "cameroon",
        }
        if city.lower() in invalid:
            return None
        return city

    @staticmethod
    def _safe_int(value: Any) -> int | None:
        if value is None or value == "":
            return None
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _safe_decimal(value: Any) -> float | None:
        if value is None or value == "":
            return None
        try:
            return round(float(value), 2)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _hash_payload(payload: dict[str, Any]) -> str:
        data = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
        return hashlib.sha256(data.encode("utf-8")).hexdigest()

    def _build_report(self, data: ExtractedData, dry_run: bool) -> dict[str, Any]:
        fk_checks = {}
        if not dry_run:
            fk_checks = {
                "properties_with_missing_provider": self._count_sql(
                    """
                    SELECT COUNT(*)
                    FROM properties p
                    LEFT JOIN users u ON u.id = p.provider_id
                    WHERE p.deleted_at IS NULL AND u.id IS NULL
                    """
                ),
                "properties_with_missing_location": self._count_sql(
                    """
                    SELECT COUNT(*)
                    FROM properties p
                    LEFT JOIN locations l ON l.id = p.location_id
                    WHERE p.deleted_at IS NULL AND l.id IS NULL
                    """
                ),
                "property_amenities_with_missing_refs": self._count_sql(
                    """
                    SELECT COUNT(*)
                    FROM property_amenities pa
                    LEFT JOIN properties p ON p.id = pa.property_id
                    LEFT JOIN amenities a ON a.id = pa.amenity_id
                    WHERE pa.deleted_at IS NULL
                      AND (p.id IS NULL OR a.id IS NULL)
                    """
                ),
            }

        report = {
            "source_file": str(self.source_path),
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "dry_run": dry_run,
            "source_counts": {
                "users": len(data.users),
                "regions": len(data.regions),
                "cities": len(data.cities),
                "house_types": len(data.house_types),
                "houses": len(data.houses),
                "facilities": len(data.facilities),
            },
            "migration_stats": self.stats.__dict__,
            "fk_checks": fk_checks,
            "anomalies_count": len(self.anomalies),
            "anomalies": self.anomalies[:200],
        }
        return report

    def _write_report(self, report: dict[str, Any]) -> None:
        self.report_dir.mkdir(parents=True, exist_ok=True)

        json_path = self.report_dir / "migration_report.json"
        md_path = self.report_dir / "migration_report.md"

        json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

        lines = [
            "# Legacy Migration Report",
            "",
            f"- Generated: {report['generated_at']}",
            f"- Source: {report['source_file']}",
            f"- Dry run: {report['dry_run']}",
            "",
            "## Source Counts",
        ]

        for key, value in report["source_counts"].items():
            lines.append(f"- {key}: {value}")

        lines.append("")
        lines.append("## Migration Stats")
        for key, value in report["migration_stats"].items():
            lines.append(f"- {key}: {value}")

        if report["fk_checks"]:
            lines.append("")
            lines.append("## FK Checks")
            for key, value in report["fk_checks"].items():
                lines.append(f"- {key}: {value}")

        lines.append("")
        lines.append(f"## Anomalies: {report['anomalies_count']}")
        if report["anomalies"]:
            for anomaly in report["anomalies"][:20]:
                lines.append(f"- [{anomaly['category']}] {anomaly['message']}")
        else:
            lines.append("- None")

        md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    def _count_sql(self, sql: str) -> int:
        return int(self.db.execute(text(sql)).scalar() or 0)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Legacy SQL backup migration ETL")
    parser.add_argument("--source", type=Path, default=PROJECT_ROOT / "residencemg_backup.sql")
    parser.add_argument("--report-dir", type=Path, default=PROJECT_ROOT / "logs" / "migration")
    parser.add_argument("--dry-run", action="store_true", help="Parse + transform profile only")
    parser.add_argument("--apply", action="store_true", help="Apply ETL changes to database")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.dry_run and args.apply:
        raise SystemExit("Use either --dry-run or --apply, not both")

    apply_changes = bool(args.apply)

    if not args.source.exists():
        raise SystemExit(f"Source file not found: {args.source}")

    db = SessionLocal()
    try:
        etl = LegacyMigrationETL(
            db=db,
            source_path=args.source,
            apply_changes=apply_changes,
            report_dir=args.report_dir,
        )
        report = etl.run()
        print(json.dumps({
            "dry_run": report["dry_run"],
            "source_counts": report["source_counts"],
            "migration_stats": report["migration_stats"],
            "anomalies_count": report["anomalies_count"],
        }, indent=2, ensure_ascii=False))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
