from fastapi import APIRouter

from app.modules.reference.data import AMENITIES, CANCELLATION_POLICIES, PROPERTY_TYPES

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/amenities")
async def list_amenities() -> list[dict]:
    return list(AMENITIES)


@router.get("/property-types")
async def list_property_types() -> list[dict]:
    return list(PROPERTY_TYPES)


@router.get("/cancellation-policies")
async def list_cancellation_policies() -> list[dict]:
    return list(CANCELLATION_POLICIES)
