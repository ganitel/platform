from typing import Any

from fastapi import APIRouter

from app.modules.reference.data import AMENITIES, CANCELLATION_POLICIES, PROPERTY_TYPES

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/amenities")
async def list_amenities() -> list[dict[str, Any]]:
    return [{**a} for a in AMENITIES]


@router.get("/property-types")
async def list_property_types() -> list[dict[str, str]]:
    return list(PROPERTY_TYPES)


@router.get("/cancellation-policies")
async def list_cancellation_policies() -> list[dict[str, str]]:
    return list(CANCELLATION_POLICIES)
