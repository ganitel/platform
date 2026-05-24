"""Per-listing media caps: 20 total, sub-cap of 3 videos."""

from decimal import Decimal

import pytest

from app.core.errors import ConflictError
from app.core.money import Currency, Money
from app.modules.properties import service as prop_service
from app.modules.properties.schemas import GeoPoint, PropertyCreateIn
from tests.integration.test_listing_media_flow import _request_upload, _seed_user


@pytest.mark.asyncio
async def test_cannot_attach_21st_item(db_session):
    user = await _seed_user(db_session)
    medias = [
        await _request_upload(db_session, user, kind="image", mime="image/jpeg") for _ in range(20)
    ]
    payload = PropertyCreateIn(
        title="test",
        property_type="villa",
        city="Douala",
        country_code="CM",
        location=GeoPoint(lat=4, lng=9),
        capacity=2,
        prices=[Money(amount=Decimal("1"), currency=Currency.XAF)],
        media_ids=[m.id for m in medias],
    )
    prop = await prop_service.create_draft(db_session, user, payload)
    fresh = await prop_service.get(db_session, prop.id)
    extra = await _request_upload(db_session, user, kind="image", mime="image/jpeg")
    with pytest.raises(ConflictError) as exc_info:
        await prop_service.attach_media(db_session, fresh, user, media_id=extra.id, position=20)
    assert exc_info.value.code == "media.cap_exceeded"


@pytest.mark.asyncio
async def test_cannot_attach_4th_video(db_session):
    user = await _seed_user(db_session)
    vids = []
    for _ in range(3):
        vids.append(
            await _request_upload(
                db_session, user, kind="video", mime="video/mp4", duration_ms=5_000
            )
        )
    payload = PropertyCreateIn(
        title="test",
        property_type="villa",
        city="Douala",
        country_code="CM",
        location=GeoPoint(lat=4, lng=9),
        capacity=2,
        prices=[Money(amount=Decimal("1"), currency=Currency.XAF)],
        media_ids=[v.id for v in vids],
    )
    prop = await prop_service.create_draft(db_session, user, payload)
    fresh = await prop_service.get(db_session, prop.id)
    fourth = await _request_upload(
        db_session, user, kind="video", mime="video/mp4", duration_ms=5_000
    )
    with pytest.raises(ConflictError) as exc_info:
        await prop_service.attach_media(db_session, fresh, user, media_id=fourth.id, position=3)
    assert exc_info.value.code == "media.video_cap_exceeded"
