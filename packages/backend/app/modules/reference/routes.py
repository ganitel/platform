from typing import Any

from fastapi import APIRouter

from app.modules.reference.data import (
    AMENITIES,
    BED_TYPES,
    CANCELLATION_POLICIES,
    EXPERIENCE_TYPES,
    HOTEL_CATEGORIES,
    PROPERTY_TYPES,
)

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/amenities")
async def list_amenities() -> list[dict[str, Any]]:
    return [{**a} for a in AMENITIES]


@router.get("/property-types")
async def list_property_types() -> list[dict[str, str]]:
    return list(PROPERTY_TYPES)


@router.get("/hotel-categories")
async def list_hotel_categories() -> list[dict[str, str]]:
    return list(HOTEL_CATEGORIES)


@router.get("/bed-types")
async def list_bed_types() -> list[dict[str, str]]:
    return list(BED_TYPES)


@router.get("/experience-types")
async def list_experience_types() -> list[dict[str, str]]:
    return list(EXPERIENCE_TYPES)


@router.get("/cancellation-policies")
async def list_cancellation_policies() -> list[dict[str, str]]:
    return list(CANCELLATION_POLICIES)
