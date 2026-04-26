"""Static reference data — labels here, codes stored on listings.

Adding/removing entries does not require a migration; the codes that listings
reference must remain stable. Treat removals as deprecations.
"""

from typing import TypedDict


class Amenity(TypedDict):
    code: str
    label_en: str
    label_fr: str
    category: str


AMENITIES: list[Amenity] = [
    # Internet
    {"code": "wifi", "label_en": "Wi-Fi", "label_fr": "Wi-Fi", "category": "internet"},
    # Kitchen
    {"code": "kitchen", "label_en": "Kitchen", "label_fr": "Cuisine", "category": "kitchen"},
    {"code": "fridge", "label_en": "Refrigerator", "label_fr": "Réfrigérateur", "category": "kitchen"},
    {"code": "microwave", "label_en": "Microwave", "label_fr": "Micro-ondes", "category": "kitchen"},
    {"code": "stove", "label_en": "Stove", "label_fr": "Cuisinière", "category": "kitchen"},
    # Climate
    {"code": "ac", "label_en": "Air conditioning", "label_fr": "Climatisation", "category": "climate"},
    {"code": "heating", "label_en": "Heating", "label_fr": "Chauffage", "category": "climate"},
    {"code": "fan", "label_en": "Fan", "label_fr": "Ventilateur", "category": "climate"},
    # Bathroom
    {"code": "hot_water", "label_en": "Hot water", "label_fr": "Eau chaude", "category": "bathroom"},
    {"code": "shower", "label_en": "Shower", "label_fr": "Douche", "category": "bathroom"},
    {"code": "bathtub", "label_en": "Bathtub", "label_fr": "Baignoire", "category": "bathroom"},
    # Laundry
    {"code": "washer", "label_en": "Washer", "label_fr": "Lave-linge", "category": "laundry"},
    {"code": "dryer", "label_en": "Dryer", "label_fr": "Sèche-linge", "category": "laundry"},
    # Entertainment
    {"code": "tv", "label_en": "TV", "label_fr": "Télévision", "category": "entertainment"},
    # Workspace
    {"code": "workspace", "label_en": "Dedicated workspace", "label_fr": "Espace de travail", "category": "work"},
    # Parking
    {"code": "free_parking", "label_en": "Free parking", "label_fr": "Parking gratuit", "category": "parking"},
    {"code": "paid_parking", "label_en": "Paid parking", "label_fr": "Parking payant", "category": "parking"},
    # Pool & outdoor
    {"code": "pool", "label_en": "Pool", "label_fr": "Piscine", "category": "outdoor"},
    {"code": "garden", "label_en": "Garden", "label_fr": "Jardin", "category": "outdoor"},
    {"code": "balcony", "label_en": "Balcony", "label_fr": "Balcon", "category": "outdoor"},
    {"code": "terrace", "label_en": "Terrace", "label_fr": "Terrasse", "category": "outdoor"},
    # Safety
    {"code": "smoke_alarm", "label_en": "Smoke alarm", "label_fr": "Détecteur de fumée", "category": "safety"},
    {"code": "first_aid_kit", "label_en": "First aid kit", "label_fr": "Trousse de secours", "category": "safety"},
    {"code": "security_cameras", "label_en": "Exterior security cameras", "label_fr": "Caméras de sécurité extérieures", "category": "safety"},
    # Power
    {"code": "backup_generator", "label_en": "Backup generator", "label_fr": "Groupe électrogène", "category": "power"},
]

PROPERTY_TYPES: list[dict[str, str]] = [
    {"code": "apartment", "label_en": "Apartment", "label_fr": "Appartement"},
    {"code": "house", "label_en": "House", "label_fr": "Maison"},
    {"code": "villa", "label_en": "Villa", "label_fr": "Villa"},
    {"code": "room", "label_en": "Private room", "label_fr": "Chambre privée"},
    {"code": "studio", "label_en": "Studio", "label_fr": "Studio"},
    {"code": "guesthouse", "label_en": "Guesthouse", "label_fr": "Maison d'hôtes"},
]

CANCELLATION_POLICIES: list[dict[str, str]] = [
    {"code": "flexible", "label_en": "Flexible", "label_fr": "Flexible"},
    {"code": "moderate", "label_en": "Moderate", "label_fr": "Modérée"},
    {"code": "strict", "label_en": "Strict", "label_fr": "Stricte"},
]
