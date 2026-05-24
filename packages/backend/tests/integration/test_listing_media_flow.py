"""Full happy path: create draft → upload 3 images + 1 video → create
property with media_ids → fetch detail and assert order and cover."""

from __future__ import annotations

from decimal import Decimal
from unittest.mock import AsyncMock, patch
from uuid import UUID, uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.money import Currency, Money
from app.modules.media.models import Media, MediaKind
from app.modules.media.schemas import MediaKind as SchemaMediaKind
from app.modules.media.schemas import MediaMimeType, MediaUploadIn
from app.modules.media.service import create_upload
from app.modules.properties import service as prop_service
from app.modules.properties.schemas import GeoPoint, PropertyCreateIn
from app.modules.users.models import User


async def _seed_user(session: AsyncSession) -> User:
    user = User(
        id=uuid4(),
        auth_user_id=uuid4().hex,
        email=f"admin-{uuid4().hex[:6]}@example.test",
        is_admin=True,
        is_host=True,
        display_name="Test admin",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def _request_upload(
    session: AsyncSession,
    user: User,
    *,
    kind: SchemaMediaKind,
    mime: MediaMimeType,
    draft_id: UUID | None = None,
    duration_ms: int | None = None,
    poster_media_id: UUID | None = None,
) -> Media:
    with patch(
        "app.modules.media.service.presign_put",
        new=AsyncMock(return_value="https://upload.example/presigned"),
    ):
        out = await create_upload(
            session,
            user,
            MediaUploadIn(
                mime_type=mime,
                kind=kind,
                size_bytes=1000,
                draft_id=draft_id,
                duration_ms=duration_ms,
                poster_media_id=poster_media_id,
            ),
        )
    media = await session.get(Media, out.media_id)
    assert media is not None
    return media


@pytest.mark.asyncio
async def test_create_property_with_media_attaches_in_order(db_session):
    user = await _seed_user(db_session)
    draft_id = uuid4()

    img1 = await _request_upload(
        db_session, user, kind="image", mime="image/jpeg", draft_id=draft_id
    )
    img2 = await _request_upload(
        db_session, user, kind="image", mime="image/jpeg", draft_id=draft_id
    )
    poster = await _request_upload(
        db_session, user, kind="image", mime="image/jpeg", draft_id=draft_id
    )
    vid = await _request_upload(
        db_session,
        user,
        kind="video",
        mime="video/mp4",
        duration_ms=10_000,
        poster_media_id=poster.id,
        draft_id=draft_id,
    )

    payload = PropertyCreateIn(
        title="Test villa",
        property_type="villa",
        city="Douala",
        country_code="CM",
        location=GeoPoint(lat=4.05, lng=9.7),
        capacity=4,
        base_price=Money(amount=Decimal("50000"), currency=Currency.XAF),
        media_ids=[img1.id, vid.id, img2.id],
    )

    prop = await prop_service.create_draft(db_session, user, payload)
    fresh = await prop_service.get(db_session, prop.id)
    assert [it.media_id for it in fresh.media] == [img1.id, vid.id, img2.id]
    assert [it.media.kind for it in fresh.media] == [
        MediaKind.IMAGE,
        MediaKind.VIDEO,
        MediaKind.IMAGE,
    ]

    with patch(
        "app.modules.media.service.public_url",
        side_effect=lambda key: f"https://cdn.example/{key}",
    ):
        detail = await prop_service.to_detail(db_session, fresh, user)

    assert detail.cover_media is not None
    assert detail.cover_media.id == img1.id  # position 0
    assert detail.media[1].kind == "video"
    assert detail.media[1].poster_url is not None
