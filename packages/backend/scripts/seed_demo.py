"""Seed the local DB with a handful of demo hosts, ~10 published
properties, and a handful of published experiences spread across them.

Idempotent: every seed host is identified by a `clerk_user_id` prefixed
with `seed_host_` (plus the legacy `seed_demo_host` from the previous
single-host version of this script). On each run we:

1. Ensure each host in `SEED_HOSTS` exists.
2. Wipe every property + experience owned by any seed host (cascade
   clears photos), plus their associated `media` rows.
3. Re-insert the canonical demo set, with each listing/experience tied
   to its assigned host via `host_key`.

Photos use seeded `picsum.photos` URLs stored directly as `media.key`.
The storage layer treats full URLs as a pass-through, so the public URL
resolves without any S3/Supabase setup. See
`app/core/storage.public_or_signed_url`.

Usage:
    uv run python -m scripts.seed_demo
    # or
    make seed
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
from app.modules.experiences.models import (
    Experience,
    ExperienceCancellationPolicy,
    ExperiencePhoto,
    ExperienceStatus,
)
from app.modules.media.models import Media
from app.modules.properties.models import (
    CancellationPolicy,
    Property,
    PropertyPhoto,
    PropertyStatus,
)
from app.modules.users.models import User

# Pre-`seed_host_*` script versions used a single host with this id.
# Kept here so the wipe step also clears its leftover data on re-run.
LEGACY_HOST_CLERK_IDS: list[str] = ["seed_demo_host"]

# Each host is referenced by `key` from LISTINGS / EXPERIENCES below.
# Avatars use pravatar's deterministic image index so demo hosts stay
# visually distinct across re-seeds.
SEED_HOSTS: list[dict[str, Any]] = [
    {
        "key": "mvondo",
        "clerk_user_id": "seed_host_mvondo",
        "email": "daniel.mvondo@ganitel.local",
        "display_name": "Daniel Mvondo",
        "avatar_url": "https://i.pravatar.cc/200?img=12",
        "language": "fr",
    },
    {
        "key": "ekambi",
        "clerk_user_id": "seed_host_ekambi",
        "email": "christelle.ekambi@ganitel.local",
        "display_name": "Christelle Ekambi",
        "avatar_url": "https://i.pravatar.cc/200?img=45",
        "language": "fr",
    },
    {
        "key": "sow",
        "clerk_user_id": "seed_host_sow",
        "email": "babacar.sow@ganitel.local",
        "display_name": "Babacar Sow",
        "avatar_url": "https://i.pravatar.cc/200?img=33",
        "language": "fr",
    },
    {
        "key": "faye",
        "clerk_user_id": "seed_host_faye",
        "email": "coumba.faye@ganitel.local",
        "display_name": "Coumba Faye",
        "avatar_url": "https://i.pravatar.cc/200?img=49",
        "language": "fr",
    },
    {
        "key": "konan",
        "clerk_user_id": "seed_host_konan",
        "email": "yao.konan@ganitel.local",
        "display_name": "Yao Konan",
        "avatar_url": "https://i.pravatar.cc/200?img=15",
        "language": "fr",
    },
]


def _picsum(seed: str, w: int = 1200, h: int = 800) -> str:
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"


def _photo_set(seed_prefix: str, count: int = 5) -> list[str]:
    return [_picsum(f"{seed_prefix}-{i}") for i in range(count)]


def _currency_for(country_code: str) -> str:
    return "XAF" if country_code in {"CM", "CI"} else "XOF"


# Each entry is everything needed to materialise one Property + its photos.
# Coordinates are real (rough city center / neighbourhood points).
# `host_key` references a host in SEED_HOSTS.
LISTINGS: list[dict[str, Any]] = [
    {
        "host_key": "mvondo",
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
        "bathrooms": 1,
        "amenities": ["wifi", "ac", "kitchen", "fridge", "hot_water", "balcony", "smoke_alarm"],
        "house_rules": "Non-fumeur. Pas de soirées.",
        "cancellation_policy": CancellationPolicy.MODERATE,
        "price": Decimal("38000"),
        "photos_seed": "douala-loft",
    },
    {
        "host_key": "ekambi",
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
        "bathrooms": 3,
        "amenities": [
            "wifi",
            "ac",
            "kitchen",
            "pool",
            "garden",
            "free_parking",
            "backup_generator",
            "washer",
            "tv",
            "security_cameras",
        ],
        "house_rules": "Pas d'événements sans accord préalable.",
        "cancellation_policy": CancellationPolicy.STRICT,
        "price": Decimal("145000"),
        "photos_seed": "yaounde-villa",
    },
    {
        "host_key": "ekambi",
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
        "bathrooms": 1,
        "amenities": ["wifi", "fan", "hot_water", "garden", "terrace"],
        "house_rules": None,
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("28000"),
        "photos_seed": "limbe-bungalow",
    },
    {
        "host_key": "ekambi",
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
        "bathrooms": 1,
        "amenities": ["wifi", "fan", "kitchen", "fridge", "hot_water"],
        "house_rules": "Check-in à partir de 14h.",
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("18000"),
        "photos_seed": "kribi-studio",
    },
    {
        "host_key": "mvondo",
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
        "bathrooms": 4,
        "amenities": [
            "wifi",
            "ac",
            "kitchen",
            "hot_water",
            "terrace",
            "garden",
            "paid_parking",
            "smoke_alarm",
            "backup_generator",
        ],
        "house_rules": "Silence de 22h à 7h.",
        "cancellation_policy": CancellationPolicy.MODERATE,
        "price": Decimal("32000"),
        "photos_seed": "douala-akwa",
    },
    {
        "host_key": "sow",
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
        "bathrooms": 1,
        "amenities": ["wifi", "ac", "kitchen", "hot_water", "workspace", "fan"],
        "house_rules": "Non-fumeur. Visiteurs sur demande.",
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("15000"),
        "photos_seed": "dakar-room",
    },
    {
        "host_key": "sow",
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
        "bathrooms": 2,
        "amenities": [
            "wifi",
            "ac",
            "kitchen",
            "fridge",
            "microwave",
            "hot_water",
            "terrace",
            "free_parking",
            "tv",
            "security_cameras",
        ],
        "house_rules": "Pas de fêtes.",
        "cancellation_policy": CancellationPolicy.MODERATE,
        "price": Decimal("55000"),
        "photos_seed": "dakar-almadies",
    },
    {
        "host_key": "faye",
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
        "bathrooms": 1,
        "amenities": ["wifi", "fan", "kitchen", "hot_water", "garden", "terrace"],
        "house_rules": None,
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("25000"),
        "photos_seed": "saintlouis-house",
    },
    {
        "host_key": "konan",
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
        "bathrooms": 2,
        "amenities": [
            "wifi",
            "ac",
            "kitchen",
            "fridge",
            "microwave",
            "hot_water",
            "pool",
            "terrace",
            "tv",
            "workspace",
            "free_parking",
            "security_cameras",
        ],
        "house_rules": "Lisse de 22h à 7h.",
        "cancellation_policy": CancellationPolicy.STRICT,
        "price": Decimal("90000"),
        "photos_seed": "abidjan-cocody",
    },
    {
        "host_key": "konan",
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
        "bathrooms": 1,
        "amenities": ["wifi", "fan", "kitchen", "hot_water", "workspace"],
        "house_rules": "Non-fumeur.",
        "cancellation_policy": CancellationPolicy.FLEXIBLE,
        "price": Decimal("16000"),
        "photos_seed": "abidjan-plateau",
    },
]


# Six published experiences across CM / SN / CI. Distinct shape from
# LISTINGS — duration_minutes replaces bedrooms/beds/bathrooms.
EXPERIENCES: list[dict[str, Any]] = [
    {
        "host_key": "ekambi",
        "title": "Cours de cuisine traditionnelle — Bonanjo",
        "description": (
            "Trois heures aux côtés d'une cheffe douala : marché du matin, ndolé "
            "et poisson braisé à la flamme, dégustation à table autour d'un thé "
            "à la menthe. Tablier fourni, recettes à emporter."
        ),
        "experience_type": "workshop",
        "city": "Douala",
        "country_code": "CM",
        "lat": 4.0464,
        "lng": 9.6960,
        "capacity": 6,
        "duration_minutes": 180,
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("12000"),
        "photos_seed": "douala-cooking",
    },
    {
        "host_key": "sow",
        "title": "Visite guidée du marché Sandaga",
        "description": (
            "Une plongée de deux heures et demie dans le poumon commerçant de "
            "Dakar — étoffes wax, épices, tisanes, percussions. Guide local "
            "francophone, dégustation de bissap incluse."
        ),
        "experience_type": "tour",
        "city": "Dakar",
        "country_code": "SN",
        "lat": 14.6760,
        "lng": -17.4408,
        "capacity": 8,
        "duration_minutes": 150,
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("8000"),
        "photos_seed": "dakar-sandaga",
    },
    {
        "host_key": "faye",
        "title": "Pirogue au coucher de soleil — Joal-Fadiouth",
        "description": (
            "Deux heures à bord d'une pirogue traditionnelle entre les bolongs "
            "et l'île aux coquillages. Apéritif servi à bord ; capitaine "
            "lebou natif du village."
        ),
        "experience_type": "boat_trip",
        "city": "Joal-Fadiouth",
        "country_code": "SN",
        "lat": 14.1647,
        "lng": -16.8367,
        "capacity": 6,
        "duration_minutes": 120,
        "cancellation_policy": ExperienceCancellationPolicy.MODERATE,
        "price": Decimal("18000"),
        "photos_seed": "joal-pirogue",
    },
    {
        "host_key": "faye",
        "title": "Atelier de teinture indigo",
        "description": (
            "Quatre heures dans un atelier de Saint-Louis pour apprendre la "
            "teinture à l'indigo et au pagne tissé. Repartez avec votre "
            "carré de tissu teint à la main et séché au soleil."
        ),
        "experience_type": "workshop",
        "city": "Saint-Louis",
        "country_code": "SN",
        "lat": 16.0303,
        "lng": -16.5023,
        "capacity": 4,
        "duration_minutes": 240,
        "cancellation_policy": ExperienceCancellationPolicy.MODERATE,
        "price": Decimal("22000"),
        "photos_seed": "saintlouis-indigo",
    },
    {
        "host_key": "faye",
        "title": "Bain de son sous les baobabs",
        "description": (
            "Une heure trente d'écoute allongée sous les baobabs de la réserve "
            "de Bandia, avec bols tibétains, gongs et chants. Coussin et "
            "couverture fournis ; arrivée 15 minutes avant."
        ),
        "experience_type": "sound_bath",
        "city": "Bandia",
        "country_code": "SN",
        "lat": 14.5833,
        "lng": -17.0167,
        "capacity": 8,
        "duration_minutes": 90,
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("14000"),
        "photos_seed": "bandia-soundbath",
    },
    {
        "host_key": "konan",
        "title": "Plantations de cacao — N'duékro",
        "description": (
            "Six heures avec une coopérative de planteurs : visite des cabosses, "
            "fermentation, séchage, dégustation. Déjeuner ivoirien partagé "
            "(attiéké poisson) en bord de plantation."
        ),
        "experience_type": "tour",
        "city": "Yamoussoukro",
        "country_code": "CI",
        "lat": 6.8276,
        "lng": -5.2893,
        "capacity": 10,
        "duration_minutes": 360,
        "cancellation_policy": ExperienceCancellationPolicy.MODERATE,
        "price": Decimal("25000"),
        "photos_seed": "yamoussoukro-cacao",
    },
]

log = get_logger(__name__)


async def _ensure_demo_hosts(session: Any) -> dict[str, User]:
    """Create-or-fetch every host in SEED_HOSTS. Returns a dict keyed by
    `key` so listings/experiences can look up their owner by host_key."""
    hosts_by_key: dict[str, User] = {}
    for cfg in SEED_HOSTS:
        stmt = select(User).where(User.clerk_user_id == cfg["clerk_user_id"])
        user = (await session.execute(stmt)).scalar_one_or_none()
        if user is None:
            user = User(
                clerk_user_id=cfg["clerk_user_id"],
                email=cfg["email"],
                phone=None,
                display_name=cfg["display_name"],
                avatar_url=cfg["avatar_url"],
                language=cfg["language"],
                is_host=True,
                is_admin=False,
                status="active",
            )
            session.add(user)
            await session.flush()
        hosts_by_key[cfg["key"]] = user
    return hosts_by_key


async def _wipe_demo_data(session: Any, host_ids: list[Any]) -> tuple[int, int]:
    """Drop all properties + experiences owned by the given seed host ids
    (cascade clears photos), plus their associated Media rows. Returns
    (properties_removed, experiences_removed)."""
    if not host_ids:
        return 0, 0

    media_ids: list[Any] = []

    prop_ids = (
        (await session.execute(select(Property.id).where(Property.host_id.in_(host_ids))))
        .scalars()
        .all()
    )
    if prop_ids:
        media_ids.extend(
            (
                await session.execute(
                    select(PropertyPhoto.media_id).where(PropertyPhoto.property_id.in_(prop_ids))
                )
            )
            .scalars()
            .all()
        )
        await session.execute(delete(Property).where(Property.id.in_(prop_ids)))

    exp_ids = (
        (await session.execute(select(Experience.id).where(Experience.host_id.in_(host_ids))))
        .scalars()
        .all()
    )
    if exp_ids:
        media_ids.extend(
            (
                await session.execute(
                    select(ExperiencePhoto.media_id).where(
                        ExperiencePhoto.experience_id.in_(exp_ids)
                    )
                )
            )
            .scalars()
            .all()
        )
        await session.execute(delete(Experience).where(Experience.id.in_(exp_ids)))

    if media_ids:
        await session.execute(delete(Media).where(Media.id.in_(media_ids)))

    return len(prop_ids), len(exp_ids)


async def _all_seed_host_ids(session: Any, current_hosts: dict[str, User]) -> list[Any]:
    """Collect ids for every host that has ever been a seed host —
    current SEED_HOSTS plus any LEGACY_HOST_CLERK_IDS still in the DB.
    Used by the wipe step so re-runs also clean up data left behind by
    earlier versions of this script."""
    ids: list[Any] = [u.id for u in current_hosts.values()]
    if LEGACY_HOST_CLERK_IDS:
        legacy = (
            (
                await session.execute(
                    select(User.id).where(User.clerk_user_id.in_(LEGACY_HOST_CLERK_IDS))
                )
            )
            .scalars()
            .all()
        )
        ids.extend(legacy)
    return ids


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
        base_price_currency=_currency_for(listing["country_code"]),
        content_language="fr",
        status=PropertyStatus.PUBLISHED,
        published_at=datetime.now(UTC),
    )
    session.add(prop)
    await session.flush()  # populate prop.id

    for position, media in enumerate(photos):
        session.add(PropertyPhoto(property_id=prop.id, media_id=media.id, position=position))

    return prop


async def _create_experience(session: Any, host: User, item: dict[str, Any]) -> Experience:
    photos: list[Media] = []
    for url in _photo_set(item["photos_seed"], count=4):
        m = Media(
            owner_user_id=host.id,
            bucket="seed",
            key=url,
            mime_type="image/jpeg",
            size_bytes=None,
        )
        session.add(m)
        photos.append(m)
    await session.flush()

    exp = Experience(
        host_id=host.id,
        title=item["title"],
        description=item["description"],
        experience_type=item["experience_type"],
        city=item["city"],
        country_code=item["country_code"],
        location=from_shape(Point(item["lng"], item["lat"]), srid=4326),
        capacity=item["capacity"],
        duration_minutes=item["duration_minutes"],
        cancellation_policy=item["cancellation_policy"],
        base_price_amount=item["price"],
        base_price_currency=_currency_for(item["country_code"]),
        content_language="fr",
        status=ExperienceStatus.PUBLISHED,
        published_at=datetime.now(UTC),
    )
    session.add(exp)
    await session.flush()

    for position, media in enumerate(photos):
        session.add(ExperiencePhoto(experience_id=exp.id, media_id=media.id, position=position))

    return exp


async def main() -> None:
    configure_logging(debug=True)
    try:
        async for session in get_session():
            hosts = await _ensure_demo_hosts(session)

            seed_host_ids = await _all_seed_host_ids(session, hosts)
            wiped_props, wiped_exps = await _wipe_demo_data(session, seed_host_ids)

            for listing in LISTINGS:
                host = hosts[listing["host_key"]]
                await _create_listing(session, host, listing)
            for item in EXPERIENCES:
                host = hosts[item["host_key"]]
                await _create_experience(session, host, item)

            await session.commit()
            break

        log.info(
            "seed.complete",
            host_count=len(hosts),
            wiped_properties=wiped_props,
            wiped_experiences=wiped_exps,
            inserted_properties=len(LISTINGS),
            inserted_experiences=len(EXPERIENCES),
        )
        host_names = ", ".join(sorted(u.display_name for u in hosts.values()))
        print(
            f"✓ seed complete — hosts=[{host_names}], "
            f"properties={len(LISTINGS)} (wiped {wiped_props}), "
            f"experiences={len(EXPERIENCES)} (wiped {wiped_exps})"
        )
    finally:
        await dispose_engine()


if __name__ == "__main__":
    asyncio.run(main())
