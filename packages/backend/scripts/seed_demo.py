"""Seed the local DB with a handful of demo hosts, ~10 published
properties, and a handful of published experiences spread across them.

Idempotent: every seed host is identified by an `auth_user_id` prefixed
with `seed_host_` (plus the legacy `seed_demo_host` from the previous
single-host version of this script). On each run we:

1. Ensure each host in `SEED_HOSTS` exists.
2. Wipe every property + experience owned by any seed host (cascade
   clears photos), plus their associated `media` rows.
3. Re-insert the canonical demo set, with each listing/experience tied
   to its assigned host via `host_key`.

Photos are stored directly as `media.key` (full URLs): properties use
`picsum.photos`, experiences use known-good Cameroon Unsplash imagery. The
storage layer treats full URLs as a pass-through, so the public URL resolves
without any S3/Supabase setup. See `app/core/storage.public_or_signed_url`.

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
    ExperienceMediaItem,
    ExperiencePrice,
    ExperienceStatus,
)
from app.modules.media.models import Media
from app.modules.properties.models import (
    CancellationPolicy,
    Property,
    PropertyMediaItem,
    PropertyPrice,
    PropertyStatus,
)
from app.modules.users.models import User

# Pre-`seed_host_*` script versions used a single host with this id.
# Kept here so the wipe step also clears its leftover data on re-run.
LEGACY_HOST_AUTH_IDS: list[str] = ["seed_demo_host"]

# Each host is referenced by `key` from LISTINGS / EXPERIENCES below.
# Avatars use pravatar's deterministic image index so demo hosts stay
# visually distinct across re-seeds.
SEED_HOSTS: list[dict[str, Any]] = [
    {
        "key": "mvondo",
        "auth_user_id": "seed_host_mvondo",
        "email": "daniel.mvondo@ganitel.local",
        "display_name": "Daniel Mvondo",
        "avatar_url": "https://i.pravatar.cc/200?img=12",
        "language": "fr",
    },
    {
        "key": "ekambi",
        "auth_user_id": "seed_host_ekambi",
        "email": "christelle.ekambi@ganitel.local",
        "display_name": "Christelle Ekambi",
        "avatar_url": "https://i.pravatar.cc/200?img=45",
        "language": "fr",
    },
    {
        "key": "sow",
        "auth_user_id": "seed_host_sow",
        "email": "babacar.sow@ganitel.local",
        "display_name": "Babacar Sow",
        "avatar_url": "https://i.pravatar.cc/200?img=33",
        "language": "fr",
    },
    {
        "key": "faye",
        "auth_user_id": "seed_host_faye",
        "email": "coumba.faye@ganitel.local",
        "display_name": "Coumba Faye",
        "avatar_url": "https://i.pravatar.cc/200?img=49",
        "language": "fr",
    },
    {
        "key": "konan",
        "auth_user_id": "seed_host_konan",
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


def _unsplash(photo_id: str, w: int = 1200) -> str:
    """Full Unsplash URL stored as media.key (pass-through in storage). The
    frontend image helper re-sizes via query params, so a base URL is enough."""
    return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w={w}&q=80"


# Known-good Cameroon imagery (Edouard TAMBA's Unsplash portfolio) — already
# used live on the landing page, so these resolve reliably.
CM_PHOTO_IDS: list[str] = [
    "photo-1659947234291-13d4843d0e75",
    "photo-1615463531521-201b9e68ae96",
    "photo-1615463668140-d294c94ec8ef",
    "photo-1615463669098-521a22047a1e",
    "photo-1615463738213-b9381d217b4e",
    "photo-1637244018403-785e7fa8707a",
]


def _cm_photos(*indices: int) -> list[str]:
    return [_unsplash(CM_PHOTO_IDS[i % len(CM_PHOTO_IDS)]) for i in indices]


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


# Twelve published experiences across Cameroon — enough to fill both home
# rails (Featured + Unforgettable). Distinct shape from LISTINGS:
# duration_minutes replaces bedrooms/beds/bathrooms; photos are Unsplash URLs.
_INCLUDED = (
    "- Guide local expérimenté\n- Équipement et sécurité\n"
    "- Boissons et collation\n- Transferts depuis le point de rendez-vous"
)
_ELIGIBILITY = (
    "Ouvert à partir de 8 ans. Bonne condition physique de base recommandée. "
    "Non recommandé aux femmes enceintes pour les activités sportives."
)

EXPERIENCES: list[dict[str, Any]] = [
    {
        "host_key": "ekambi",
        "title": "Kayak au coucher de soleil vers les chutes de la Lobé",
        "description": (
            "Pagayez à travers les mangroves sereines tandis que le soleil se "
            "couche sur l'Atlantique, jusqu'aux célèbres chutes de la Lobé qui "
            "se jettent directement dans l'océan."
        ),
        "experience_type": "Nautique",
        "city": "Kribi",
        "country_code": "CM",
        "lat": 2.9404,
        "lng": 9.9097,
        "capacity": 8,
        "duration_minutes": 180,
        "what_is_included": _INCLUDED,
        "eligibility": _ELIGIBILITY,
        "itinerary": (
            "1. Briefing sécurité et initiation au kayak.\n"
            "2. Traversée guidée des mangroves.\n"
            "3. Approche des chutes de la Lobé.\n"
            "4. Pause photo et retour au coucher du soleil."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("25000"),
        "photos": _cm_photos(2, 5, 4),
    },
    {
        "host_key": "ekambi",
        "title": "Sentiers cachés de la forêt tropicale",
        "description": (
            "Explorez les mangroves luxuriantes et les chemins secrets de la "
            "jungle de Kribi en compagnie d'un guide naturaliste."
        ),
        "experience_type": "Nature",
        "city": "Kribi",
        "country_code": "CM",
        "lat": 2.9521,
        "lng": 9.9180,
        "capacity": 10,
        "duration_minutes": 240,
        "what_is_included": _INCLUDED,
        "eligibility": _ELIGIBILITY,
        "itinerary": (
            "1. Départ depuis le village.\n2. Randonnée guidée en forêt.\n"
            "3. Découverte de la faune et de la flore.\n4. Retour et rafraîchissements."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("30000"),
        "photos": _cm_photos(3, 4, 1),
    },
    {
        "host_key": "ekambi",
        "title": "Masterclass de fruits de mer traditionnels",
        "description": (
            "Apprenez les mélanges d'épices authentiques de Kribi et les "
            "techniques de cuisson du poisson braisé, suivi d'une dégustation "
            "face à l'océan."
        ),
        "experience_type": "Gastronomie",
        "city": "Kribi",
        "country_code": "CM",
        "lat": 2.9388,
        "lng": 9.9105,
        "capacity": 6,
        "duration_minutes": 180,
        "what_is_included": _INCLUDED,
        "eligibility": "Ouvert à tous. Régimes alimentaires sur demande à la réservation.",
        "itinerary": (
            "1. Marché aux poissons du matin.\n2. Préparation des épices.\n"
            "3. Cuisson au feu de bois.\n4. Dégustation à table."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("20000"),
        "photos": _cm_photos(0, 2, 5),
    },
    {
        "host_key": "ekambi",
        "title": "Traversée en pirogue vers les chutes de la Lobé",
        "description": (
            "Une traversée tranquille en pirogue traditionnelle jusqu'au pied "
            "des chutes de la Lobé, l'une des rares cascades au monde à se jeter "
            "dans la mer."
        ),
        "experience_type": "Nautique",
        "city": "Kribi",
        "country_code": "CM",
        "lat": 2.8861,
        "lng": 9.8772,
        "capacity": 8,
        "duration_minutes": 120,
        "what_is_included": _INCLUDED,
        "eligibility": _ELIGIBILITY,
        "itinerary": (
            "1. Embarquement au village de pêcheurs.\n2. Navigation vers les chutes.\n"
            "3. Arrêt baignade.\n4. Retour."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.MODERATE,
        "price": Decimal("15000"),
        "photos": _cm_photos(5, 2, 3),
    },
    {
        "host_key": "mvondo",
        "title": "Exploration du fleuve Nyong",
        "description": (
            "Un voyage paisible au cœur du système fluvial du Cameroun, entre "
            "villages riverains, oiseaux et forêt-galerie."
        ),
        "experience_type": "Nature",
        "city": "Yaoundé",
        "country_code": "CM",
        "lat": 3.5833,
        "lng": 11.5167,
        "capacity": 10,
        "duration_minutes": 480,
        "what_is_included": _INCLUDED,
        "eligibility": _ELIGIBILITY,
        "itinerary": (
            "1. Transfert depuis Yaoundé.\n2. Navigation sur le Nyong.\n"
            "3. Déjeuner en bord de fleuve.\n4. Visite d'un village riverain."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.MODERATE,
        "price": Decimal("45000"),
        "photos": _cm_photos(4, 3, 0),
    },
    {
        "host_key": "ekambi",
        "title": "Marche culturelle à Grand Batanga",
        "description": (
            "Histoire et patrimoine du peuple Batanga, à travers ses villages "
            "côtiers, ses traditions de pêche et ses récits."
        ),
        "experience_type": "Culture",
        "city": "Kribi",
        "country_code": "CM",
        "lat": 2.8667,
        "lng": 9.8833,
        "capacity": 12,
        "duration_minutes": 120,
        "what_is_included": _INCLUDED,
        "eligibility": "Ouvert à tous, accessible aux familles.",
        "itinerary": (
            "1. Accueil par un aîné du village.\n2. Marche commentée.\n"
            "3. Rencontre avec des artisans.\n4. Collation traditionnelle."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("12000"),
        "photos": _cm_photos(1, 5, 4),
    },
    {
        "host_key": "mvondo",
        "title": "Randonnée sur les contreforts du mont Cameroun",
        "description": (
            "Une ascension guidée des contreforts du mont Cameroun, le plus haut "
            "sommet d'Afrique de l'Ouest, à travers forêts et coulées de lave."
        ),
        "experience_type": "Aventure",
        "city": "Buéa",
        "country_code": "CM",
        "lat": 4.1537,
        "lng": 9.2920,
        "capacity": 10,
        "duration_minutes": 360,
        "what_is_included": _INCLUDED,
        "eligibility": (
            "Bonne condition physique requise. À partir de 14 ans. "
            "Chaussures de marche indispensables."
        ),
        "itinerary": (
            "1. Briefing à Buéa.\n2. Montée guidée des contreforts.\n"
            "3. Pause panorama et déjeuner.\n4. Descente."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.MODERATE,
        "price": Decimal("35000"),
        "photos": _cm_photos(3, 1, 2),
    },
    {
        "host_key": "mvondo",
        "title": "Jardin botanique et faune de Limbé",
        "description": (
            "Une visite du jardin botanique historique de Limbé et de son centre "
            "de faune, à deux pas des plages de sable noir volcanique."
        ),
        "experience_type": "Nature",
        "city": "Limbé",
        "country_code": "CM",
        "lat": 4.0186,
        "lng": 9.2096,
        "capacity": 15,
        "duration_minutes": 180,
        "what_is_included": _INCLUDED,
        "eligibility": "Ouvert à tous, accessible aux familles.",
        "itinerary": (
            "1. Entrée au jardin botanique.\n2. Visite guidée des espèces.\n"
            "3. Centre de faune.\n4. Temps libre en bord de mer."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("18000"),
        "photos": _cm_photos(4, 2, 5),
    },
    {
        "host_key": "ekambi",
        "title": "Tournée gastronomique nocturne de Douala",
        "description": (
            "Une plongée gourmande dans les rues animées de Douala à la tombée "
            "de la nuit : brochettes, poisson braisé, jus de gingembre."
        ),
        "experience_type": "Gastronomie",
        "city": "Douala",
        "country_code": "CM",
        "lat": 4.0511,
        "lng": 9.7679,
        "capacity": 8,
        "duration_minutes": 180,
        "what_is_included": _INCLUDED,
        "eligibility": "Ouvert à tous. Régimes alimentaires sur demande.",
        "itinerary": (
            "1. Rendez-vous à Akwa.\n2. Dégustations de rue.\n3. Marché de nuit.\n4. Dessert local."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("16000"),
        "photos": _cm_photos(0, 5, 1),
    },
    {
        "host_key": "ekambi",
        "title": "Yoga sur la plage à l'aube",
        "description": (
            "Une séance de yoga en douceur sur le sable de Kribi, au lever du "
            "soleil, bercée par le bruit des vagues."
        ),
        "experience_type": "Bien-être",
        "city": "Kribi",
        "country_code": "CM",
        "lat": 2.9350,
        "lng": 9.9070,
        "capacity": 12,
        "duration_minutes": 90,
        "what_is_included": (
            "- Professeur de yoga certifié\n- Tapis et accessoires\n"
            "- Tisane et fruits\n- Petit-déjeuner léger"
        ),
        "eligibility": "Tous niveaux. Arrivée 15 minutes avant le début.",
        "itinerary": (
            "1. Accueil et installation.\n2. Échauffement.\n"
            "3. Séance face à l'océan.\n4. Relaxation et collation."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.FLEXIBLE,
        "price": Decimal("10000"),
        "photos": _cm_photos(2, 4, 3),
    },
    {
        "host_key": "mvondo",
        "title": "Sentier mémoriel de Bimbia",
        "description": (
            "Une marche chargée d'histoire sur le site de l'ancien port négrier "
            "de Bimbia, guidée par un historien local."
        ),
        "experience_type": "Culture",
        "city": "Limbé",
        "country_code": "CM",
        "lat": 3.9833,
        "lng": 9.3167,
        "capacity": 12,
        "duration_minutes": 150,
        "what_is_included": _INCLUDED,
        "eligibility": "À partir de 12 ans. Marche sur terrain naturel.",
        "itinerary": (
            "1. Accueil et contexte historique.\n2. Marche sur le sentier.\n"
            "3. Visite des vestiges.\n4. Temps de recueillement."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.MODERATE,
        "price": Decimal("14000"),
        "photos": _cm_photos(1, 3, 0),
    },
    {
        "host_key": "ekambi",
        "title": "Safari en barque dans la mangrove du Wouri",
        "description": (
            "Une exploration en barque de l'estuaire du Wouri, entre palétuviers, "
            "oiseaux et villages de pêcheurs aux portes de Douala."
        ),
        "experience_type": "Nautique",
        "city": "Douala",
        "country_code": "CM",
        "lat": 4.0300,
        "lng": 9.6900,
        "capacity": 10,
        "duration_minutes": 240,
        "what_is_included": _INCLUDED,
        "eligibility": _ELIGIBILITY,
        "itinerary": (
            "1. Embarquement sur le Wouri.\n2. Traversée de la mangrove.\n"
            "3. Observation des oiseaux.\n4. Halte dans un village de pêcheurs."
        ),
        "cancellation_policy": ExperienceCancellationPolicy.MODERATE,
        "price": Decimal("28000"),
        "photos": _cm_photos(5, 0, 2),
    },
]

log = get_logger(__name__)


async def _ensure_demo_hosts(session: Any) -> dict[str, User]:
    """Create-or-fetch every host in SEED_HOSTS. Returns a dict keyed by
    `key` so listings/experiences can look up their owner by host_key."""
    hosts_by_key: dict[str, User] = {}
    for cfg in SEED_HOSTS:
        stmt = select(User).where(User.auth_user_id == cfg["auth_user_id"])
        user = (await session.execute(stmt)).scalar_one_or_none()
        if user is None:
            user = User(
                auth_user_id=cfg["auth_user_id"],
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
                    select(PropertyMediaItem.media_id).where(
                        PropertyMediaItem.property_id.in_(prop_ids)
                    )
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
                    select(ExperienceMediaItem.media_id).where(
                        ExperienceMediaItem.experience_id.in_(exp_ids)
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
    current SEED_HOSTS plus any LEGACY_HOST_AUTH_IDS still in the DB.
    Used by the wipe step so re-runs also clean up data left behind by
    earlier versions of this script."""
    ids: list[Any] = [u.id for u in current_hosts.values()]
    if LEGACY_HOST_AUTH_IDS:
        legacy = (
            (
                await session.execute(
                    select(User.id).where(User.auth_user_id.in_(LEGACY_HOST_AUTH_IDS))
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
        content_language="fr",
        status=PropertyStatus.PUBLISHED,
        published_at=datetime.now(UTC),
    )
    session.add(prop)
    await session.flush()  # populate prop.id

    session.add(
        PropertyPrice(
            property_id=prop.id,
            currency=_currency_for(listing["country_code"]),
            amount=listing["price"],
        )
    )

    for position, media in enumerate(photos):
        session.add(PropertyMediaItem(property_id=prop.id, media_id=media.id, position=position))

    return prop


async def _create_experience(session: Any, host: User, item: dict[str, Any]) -> Experience:
    photos: list[Media] = []
    for url in item["photos"]:
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
        what_is_included=item.get("what_is_included", ""),
        eligibility=item.get("eligibility", ""),
        itinerary=item.get("itinerary", ""),
        cancellation_policy=item["cancellation_policy"],
        content_language="fr",
        status=ExperienceStatus.PUBLISHED,
        published_at=datetime.now(UTC),
    )
    session.add(exp)
    await session.flush()

    # Per-person price (group_size=1) per the per-person pricing model.
    session.add(
        ExperiencePrice(
            experience_id=exp.id,
            currency=_currency_for(item["country_code"]),
            amount=item["price"],
            group_size=1,
        )
    )

    for position, media in enumerate(photos):
        session.add(ExperienceMediaItem(experience_id=exp.id, media_id=media.id, position=position))

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
