"""Seed the local DB with a demo host and ~10 published properties.

Idempotent: identifies the demo host by `clerk_user_id="seed_demo_host"`,
wipes that host's previous properties (cascade clears their photos), and
re-inserts the canonical demo set. Run repeatedly without accumulating dupes.

Photos use seeded `picsum.photos` URLs stored directly as `media.key`. The
storage layer treats full URLs as a pass-through, so the public URL resolves
without any S3/Supabase setup. See `app/core/storage.public_or_signed_url`.

Usage:
    uv run python -m scripts.seed_demo
    # or
    make seed

Experiences are not yet seeded — the experiences module doesn't exist yet.
"""

import asyncio
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy import delete, select

from app.core.db import dispose_engine, get_session
from app.core.logging import configure_logging, get_logger
from app.modules.media.models import Media
from app.modules.properties.models import (
    CancellationPolicy,
    Property,
    PropertyPhoto,
    PropertyStatus,
)
from app.modules.users.models import User

DEMO_HOST_CLERK_ID = "seed_demo_host"
DEMO_HOST_DISPLAY_NAME = "Aïcha (demo host)"
DEMO_HOST_EMAIL = "demo-host@ganitel.local"
DEMO_HOST_AVATAR = "https://i.pravatar.cc/200?img=47"


def _picsum(seed: str, w: int = 1200, h: int = 800) -> str:
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"


def _photo_set(seed_prefix: str, count: int = 5) -> list[str]:
    return [_picsum(f"{seed_prefix}-{i}") for i in range(count)]


# Each entry is everything needed to materialise one Property + its photos.
# Coordinates are real (rough city center / neighbourhood points).
LISTINGS: list[dict[str, Any]] = [
    {
        "title": "Loft lumineux face à la mer — Bonapriso",
        "description": (
            "Loft de 70 m² au dernier étage avec vue panoramique sur le Wouri. "
            "Cuisine équipée, climatisation, Wi-Fi haut débit, balcon. Idéal pour "
            "un voyage d'affaires ou une escale week-end à Douala."
        ),
        "property_type": "apartment",
        "city": "Douala",
        "country_code": "CM",
        "lat": 4.0451,
        "lng": 9.6913,
        "capacity": 2,
        "bedrooms": 1,
        "beds": 1,
        "bathrooms": Decimal("1"),
        "amenities": ["wifi", "ac", "kitchen", "fridge", "hot_water", "balcony", "smoke_alarm"],
        "house_rules": "Non-fumeur. Pas de soirées.",
        "cancellation_policy": CancellationPolicy.MODERATE,
        "price": Decimal("38000"),
        "photos_seed": "douala-loft",
    },
    {
        "title": "Villa avec piscine — Bastos",
        "description": (
            "Villa familiale de 4 chambres dans le quartier diplomatique de Yaoundé. "
            "Piscine privée, jardin tropical, parking sécurisé, générateur de secours."
        ),
        "property_type": "villa",
        "city": "Yaoundé",
        "country_code": "CM",
        "lat": 3.8867,
        "lng": 11.5167,
        "capacity": 8,
        "bedrooms": 4,
        "beds": 5,
        "bathrooms": Decimal("3"),
        "amenities": [
            "wifi", "ac", "kitchen", "pool", "garden", "free_parking",
            "backup_generator", "washer", "tv", "security_cameras",
        ],
        "house_rules": "Pas d'événements sans accord préalable.",
        "cancellation_policy": CancellationPolicy.STRICT,
        "price": Decimal("145000"),
        "photos_seed": "yaounde-villa",
    },
    {
        "title": "Bungalow pieds dans l'eau — Down Beach",
        "description": (
            "Bungalow en bois sur la plage de Limbé, à deux pas du sable noir "
            "volcanique. Réveil au son des vagues. Petit-déjeuner local inclus."
        ),
        "property_type": "guesthouse",
        "city": "Limbé",
        "country_code": "CM",
        "lat": 4.0186,
        "lng": 9.2096,
        "capacity": 2,
        "bedrooms": 1,
        "beds": 1,
        "bathrooms": Decimal("1"),
        "amenities": ["wifi", "fan", "hot_water", "garden", "terrace"],
        "house_rules": None,
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("28000"),
        "photos_seed": "limbe-bungalow",
    },
    {
        "title": "Studio cosy — centre Kribi",
        "description": (
            "Studio rénové à 5 minutes à pied de la plage de Kribi. Parfait pour "
            "un séjour solo ou en couple. Ventilateur, eau chaude, cuisine équipée."
        ),
        "property_type": "studio",
        "city": "Kribi",
        "country_code": "CM",
        "lat": 2.9404,
        "lng": 9.9097,
        "capacity": 2,
        "bedrooms": 0,
        "beds": 1,
        "bathrooms": Decimal("1"),
        "amenities": ["wifi", "fan", "kitchen", "fridge", "hot_water"],
        "house_rules": "Check-in à partir de 14h.",
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("18000"),
        "photos_seed": "kribi-studio",
    },
    {
        "title": "Maison d'hôtes coloniale — Akwa",
        "description": (
            "Maison d'hôtes de charme dans une bâtisse coloniale rénovée. "
            "5 chambres, salon commun, terrasse couverte, petit-déjeuner copieux."
        ),
        "property_type": "guesthouse",
        "city": "Douala",
        "country_code": "CM",
        "lat": 4.0490,
        "lng": 9.7026,
        "capacity": 10,
        "bedrooms": 5,
        "beds": 6,
        "bathrooms": Decimal("4"),
        "amenities": [
            "wifi", "ac", "kitchen", "hot_water", "terrace", "garden",
            "paid_parking", "smoke_alarm", "backup_generator",
        ],
        "house_rules": "Silence de 22h à 7h.",
        "cancellation_policy": CancellationPolicy.MODERATE,
        "price": Decimal("32000"),
        "photos_seed": "douala-akwa",
    },
    {
        "title": "Chambre privée — Mermoz",
        "description": (
            "Chambre privée dans une maison familiale de Dakar, quartier calme et "
            "verdoyant. Salle de bain partagée, accès cuisine, Wi-Fi rapide."
        ),
        "property_type": "room",
        "city": "Dakar",
        "country_code": "SN",
        "lat": 14.7167,
        "lng": -17.4677,
        "capacity": 1,
        "bedrooms": 1,
        "beds": 1,
        "bathrooms": Decimal("0.5"),
        "amenities": ["wifi", "ac", "kitchen", "hot_water", "workspace", "fan"],
        "house_rules": "Non-fumeur. Visiteurs sur demande.",
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("15000"),
        "photos_seed": "dakar-room",
    },
    {
        "title": "Appartement design — Almadies",
        "description": (
            "Appartement de 2 chambres avec vue océan, dans le quartier branché "
            "des Almadies. Décoration contemporaine, terrasse, parking sécurisé."
        ),
        "property_type": "apartment",
        "city": "Dakar",
        "country_code": "SN",
        "lat": 14.7397,
        "lng": -17.5202,
        "capacity": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": Decimal("2"),
        "amenities": [
            "wifi", "ac", "kitchen", "fridge", "microwave", "hot_water",
            "terrace", "free_parking", "tv", "security_cameras",
        ],
        "house_rules": "Pas de fêtes.",
        "cancellation_policy": CancellationPolicy.MODERATE,
        "price": Decimal("55000"),
        "photos_seed": "dakar-almadies",
    },
    {
        "title": "Maison de pêcheur — Saint-Louis",
        "description": (
            "Maison traditionnelle restaurée sur l'île de Saint-Louis, classée "
            "UNESCO. Patio intérieur, atmosphère paisible, hôte local francophone."
        ),
        "property_type": "house",
        "city": "Saint-Louis",
        "country_code": "SN",
        "lat": 16.0322,
        "lng": -16.4889,
        "capacity": 4,
        "bedrooms": 2,
        "beds": 3,
        "bathrooms": Decimal("1"),
        "amenities": ["wifi", "fan", "kitchen", "hot_water", "garden", "terrace"],
        "house_rules": None,
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("25000"),
        "photos_seed": "saintlouis-house",
    },
    {
        "title": "Penthouse Cocody — Riviera",
        "description": (
            "Penthouse de 3 chambres avec rooftop privé surplombant la lagune "
            "Ébrié. Climatisation, dressing, espace bureau, accès piscine."
        ),
        "property_type": "apartment",
        "city": "Abidjan",
        "country_code": "CI",
        "lat": 5.3593,
        "lng": -3.9810,
        "capacity": 6,
        "bedrooms": 3,
        "beds": 3,
        "bathrooms": Decimal("2"),
        "amenities": [
            "wifi", "ac", "kitchen", "fridge", "microwave", "hot_water",
            "pool", "terrace", "tv", "workspace", "free_parking", "security_cameras",
        ],
        "house_rules": "Lisse de 22h à 7h.",
        "cancellation_policy": CancellationPolicy.STRICT,
        "price": Decimal("90000"),
        "photos_seed": "abidjan-cocody",
    },
    {
        "title": "Studio étudiant — Plateau",
        "description": (
            "Studio fonctionnel au cœur du Plateau, idéal pour court séjour "
            "professionnel. Connexion fibre, espace de travail, ventilateur."
        ),
        "property_type": "studio",
        "city": "Abidjan",
        "country_code": "CI",
        "lat": 5.3199,
        "lng": -4.0177,
        "capacity": 2,
        "bedrooms": 0,
        "beds": 1,
        "bathrooms": Decimal("1"),
        "amenities": ["wifi", "fan", "kitchen", "hot_water", "workspace"],
        "house_rules": "Non-fumeur.",
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("16000"),
        "photos_seed": "abidjan-plateau",
    },
]

log = get_logger(__name__)


async def _ensure_demo_host(session: Any) -> User:
    stmt = select(User).where(User.clerk_user_id == DEMO_HOST_CLERK_ID)
    user = (await session.execute(stmt)).scalar_one_or_none()
    if user is not None:
        return user
    user = User(
        clerk_user_id=DEMO_HOST_CLERK_ID,
        email=DEMO_HOST_EMAIL,
        phone=None,
        display_name=DEMO_HOST_DISPLAY_NAME,
        avatar_url=DEMO_HOST_AVATAR,
        language="fr",
        is_host=True,
        is_admin=False,
        status="active",
    )
    session.add(user)
    await session.flush()
    return user


async def _wipe_demo_listings(session: Any, host_id: Any) -> int:
    """Drop all properties owned by the demo host (cascade clears photos),
    plus their associated Media rows. Returns the count of removed properties."""
    rows = (
        await session.execute(select(Property.id).where(Property.host_id == host_id))
    ).scalars().all()
    if not rows:
        return 0

    # Find media used by demo properties so we can purge it after.
    media_ids = (
        await session.execute(
            select(PropertyPhoto.media_id).where(PropertyPhoto.property_id.in_(rows))
        )
    ).scalars().all()

    await session.execute(delete(Property).where(Property.id.in_(rows)))
    if media_ids:
        await session.execute(delete(Media).where(Media.id.in_(media_ids)))
    return len(rows)


async def _create_listing(session: Any, host: User, listing: dict[str, Any]) -> Property:
    photos: list[Media] = []
    for url in _photo_set(listing["photos_seed"]):
        m = Media(
            owner_user_id=host.id,
            bucket="seed",
            key=url,  # full URL — pass-through in storage layer
            mime_type="image/jpeg",
            size_bytes=None,
        )
        session.add(m)
        photos.append(m)
    await session.flush()  # populate media.id

    prop = Property(
        host_id=host.id,
        title=listing["title"],
        description=listing["description"],
        property_type=listing["property_type"],
        city=listing["city"],
        country_code=listing["country_code"],
        location=from_shape(Point(listing["lng"], listing["lat"]), srid=4326),
        capacity=listing["capacity"],
        bedrooms=listing["bedrooms"],
        beds=listing["beds"],
        bathrooms=listing["bathrooms"],
        amenities=listing["amenities"],
        house_rules=listing["house_rules"],
        cancellation_policy=listing["cancellation_policy"],
        base_price_amount=listing["price"],
        base_price_currency="XAF" if listing["country_code"] in {"CM", "CI"} else "XOF",
        content_language="fr",
        status=PropertyStatus.PUBLISHED,
        published_at=datetime.now(UTC),
    )
    session.add(prop)
    await session.flush()  # populate prop.id

    for position, media in enumerate(photos):
        session.add(
            PropertyPhoto(property_id=prop.id, media_id=media.id, position=position)
        )

    return prop


async def main() -> None:
    configure_logging(debug=True)
    try:
        async for session in get_session():
            host = await _ensure_demo_host(session)
            wiped = await _wipe_demo_listings(session, host.id)
            for listing in LISTINGS:
                await _create_listing(session, host, listing)
            await session.commit()
            break

        log.info(
            "seed.complete",
            host_id=str(host.id),
            wiped=wiped,
            inserted=len(LISTINGS),
        )
        print(
            f"✓ seed complete — host={host.display_name!r}, "
            f"wiped={wiped}, inserted={len(LISTINGS)}"
        )
    finally:
        await dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
