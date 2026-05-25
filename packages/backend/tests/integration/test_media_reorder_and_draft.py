from decimal import Decimal
from uuid import uuid4

import pytest

from app.core.errors import ValidationError
from app.core.money import Currency, Money
from app.modules.media.models import Media
from app.modules.media.service import delete_unattached_draft
from app.modules.properties import service as prop_service
from app.modules.properties.schemas import GeoPoint, PropertyCreateIn
from tests.integration.test_listing_media_flow import _request_upload, _seed_user


@pytest.mark.asyncio
async def test_reorder_rejects_partial_set(db_session):
    user = await _seed_user(db_session)
    medias = [
        await _request_upload(db_session, user, kind="image", mime="image/jpeg") for _ in range(3)
    ]
    prop = await prop_service.create_draft(
        db_session,
        user,
        PropertyCreateIn(
            title="test",
            property_type="villa",
            city="Douala",
            country_code="CM",
            location=GeoPoint(lat=4, lng=9),
            capacity=2,
            prices=[Money(amount=Decimal("1"), currency=Currency.XAF)],
            media_ids=[m.id for m in medias],
        ),
    )
    fresh = await prop_service.get(db_session, prop.id)
    item_ids = [it.id for it in fresh.media]
    # Drop one — should be rejected
    bad = [(item_ids[0], 0), (item_ids[1], 1)]
    with pytest.raises(ValidationError):
        await prop_service.reorder_media(db_session, fresh, user, bad)
    # State is unchanged
    reloaded = await prop_service.get(db_session, prop.id)
    assert [it.position for it in reloaded.media] == [0, 1, 2]


@pytest.mark.asyncio
async def test_delete_draft_skips_attached(db_session):
    """Media attached to a listing must not be deleted by the draft sweep."""
    user = await _seed_user(db_session)
    draft_id = uuid4()
    attached = await _request_upload(
        db_session, user, kind="image", mime="image/jpeg", draft_id=draft_id
    )
    unattached = await _request_upload(
        db_session, user, kind="image", mime="image/jpeg", draft_id=draft_id
    )
    await prop_service.create_draft(
        db_session,
        user,
        PropertyCreateIn(
            title="test",
            property_type="villa",
            city="Douala",
            country_code="CM",
            location=GeoPoint(lat=4, lng=9),
            capacity=2,
            prices=[Money(amount=Decimal("1"), currency=Currency.XAF)],
            media_ids=[attached.id],
        ),
    )

    from unittest.mock import AsyncMock, MagicMock, patch

    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=AsyncMock())
    cm.__aexit__ = AsyncMock(return_value=None)
    with patch("app.core.storage.s3_client", return_value=cm):
        deleted = await delete_unattached_draft(db_session, user, draft_id)
    assert deleted == 1
    # Attached one still exists
    assert await db_session.get(Media, attached.id) is not None
    # Unattached one gone
    assert await db_session.get(Media, unattached.id) is None


@pytest.mark.asyncio
async def test_delete_draft_skips_poster_for_attached_video(db_session):
    """A video's generated poster remains live when only the video is attached."""
    user = await _seed_user(db_session)
    draft_id = uuid4()
    poster = await _request_upload(
        db_session, user, kind="image", mime="image/jpeg", draft_id=draft_id
    )
    video = await _request_upload(
        db_session,
        user,
        kind="video",
        mime="video/mp4",
        draft_id=draft_id,
        duration_ms=10_000,
        poster_media_id=poster.id,
    )
    unattached = await _request_upload(
        db_session, user, kind="image", mime="image/jpeg", draft_id=draft_id
    )
    await prop_service.create_draft(
        db_session,
        user,
        PropertyCreateIn(
            title="test",
            property_type="villa",
            city="Douala",
            country_code="CM",
            location=GeoPoint(lat=4, lng=9),
            capacity=2,
            prices=[Money(amount=Decimal("1"), currency=Currency.XAF)],
            media_ids=[video.id],
        ),
    )

    from unittest.mock import AsyncMock, MagicMock, patch

    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=AsyncMock())
    cm.__aexit__ = AsyncMock(return_value=None)
    with patch("app.core.storage.s3_client", return_value=cm):
        deleted = await delete_unattached_draft(db_session, user, draft_id)
    assert deleted == 1
    assert await db_session.get(Media, video.id) is not None
    assert await db_session.get(Media, poster.id) is not None
    assert await db_session.get(Media, unattached.id) is None
