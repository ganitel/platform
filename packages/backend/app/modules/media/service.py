"""Media operations: presigned upload URL minting, draft cleanup,
and the `to_public` mapper used by callers (listing media, avatars, …)."""

from typing import cast
from uuid import UUID, uuid4

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.storage import presign_put, public_url
from app.modules.media.models import Media, MediaKind
from app.modules.media.schemas import MediaKind as SchemaMediaKind
from app.modules.media.schemas import MediaMimeType, MediaPublic, MediaUploadIn, MediaUploadOut
from app.modules.users.models import User

_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/webm": "webm",
}


def _make_key(user_id: str, mime_type: str) -> str:
    ext = _EXTENSIONS.get(mime_type, "bin")
    return f"u/{user_id}/{uuid4().hex}.{ext}"


async def create_upload(
    session: AsyncSession, user: User, payload: MediaUploadIn
) -> MediaUploadOut:
    s = get_settings()
    key = _make_key(str(user.id), payload.mime_type)
    media = Media(
        owner_user_id=user.id,
        bucket=s.S3_BUCKET,
        key=key,
        kind=MediaKind(payload.kind),
        mime_type=payload.mime_type,
        size_bytes=payload.size_bytes,
        duration_ms=payload.duration_ms,
        draft_id=payload.draft_id,
        poster_media_id=payload.poster_media_id,
    )
    session.add(media)
    await session.commit()
    await session.refresh(media)
    upload_url = await presign_put(key=key, content_type=payload.mime_type)
    return MediaUploadOut(
        media_id=media.id,
        upload_url=upload_url,
        expires_in=s.MEDIA_PUT_URL_TTL_SECONDS,
    )


async def to_public(media: Media, *, poster: Media | None = None) -> MediaPublic:
    return MediaPublic(
        id=media.id,
        url=public_url(media.key),
        mime_type=cast(MediaMimeType, media.mime_type),
        kind=cast(SchemaMediaKind, media.kind.value),
        poster_url=public_url(poster.key) if poster is not None else None,
        duration_ms=media.duration_ms,
        created_at=media.created_at,
    )


async def load_poster(session: AsyncSession, media: Media) -> Media | None:
    if media.kind != MediaKind.VIDEO or media.poster_media_id is None:
        return None
    return await session.get(Media, media.poster_media_id)


async def delete_unattached_draft(session: AsyncSession, user: User, draft_id: UUID) -> int:
    """Delete media tagged with this draft_id that is NOT referenced by any
    listing media. Returns the number of rows deleted. Idempotent."""
    from sqlalchemy import delete

    from app.modules.experiences.models import ExperienceMediaItem
    from app.modules.properties.models import PropertyMediaItem

    rows = (
        (
            await session.execute(
                select(Media).where(
                    Media.draft_id == draft_id,
                    Media.owner_user_id == user.id,
                    ~exists().where(PropertyMediaItem.media_id == Media.id),
                    ~exists().where(ExperienceMediaItem.media_id == Media.id),
                )
            )
        )
        .scalars()
        .all()
    )

    if not rows:
        return 0

    from app.core.storage import s3_client

    s = get_settings()
    async with s3_client() as client:
        # delete_objects accepts up to 1000 keys at a time
        for batch_start in range(0, len(rows), 1000):
            batch = rows[batch_start : batch_start + 1000]
            await client.delete_objects(
                Bucket=s.S3_BUCKET,
                Delete={"Objects": [{"Key": m.key} for m in batch]},
            )

    ids = [m.id for m in rows]
    await session.execute(delete(Media).where(Media.id.in_(ids)))
    await session.commit()
    return len(rows)
