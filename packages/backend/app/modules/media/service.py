"""Media operations: presigned upload URL minting and the `to_public`
mapper used by callers (property photos, avatars, …)."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.storage import presign_put, public_or_signed_url
from app.modules.media.models import Media
from app.modules.media.schemas import MediaPublic, MediaUploadOut
from app.modules.users.models import User

_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/heic": "heic",
}


def _make_key(user_id: str, mime_type: str) -> str:
    ext = _EXTENSIONS.get(mime_type, "bin")
    return f"u/{user_id}/{uuid4().hex}.{ext}"


async def create_upload(
    session: AsyncSession, user: User, *, mime_type: str, size_bytes: int | None
) -> MediaUploadOut:
    s = get_settings()
    key = _make_key(str(user.id), mime_type)
    media = Media(
        owner_user_id=user.id,
        bucket=s.S3_BUCKET,
        key=key,
        mime_type=mime_type,
        size_bytes=size_bytes,
    )
    session.add(media)
    await session.commit()
    await session.refresh(media)
    upload_url = await presign_put(key=key, content_type=mime_type)
    return MediaUploadOut(
        media_id=media.id, upload_url=upload_url, expires_in=s.MEDIA_PUT_URL_TTL_SECONDS
    )


async def to_public(media: Media) -> MediaPublic:
    url = await public_or_signed_url(media.key)
    return MediaPublic.model_validate({**media.__dict__, "url": url})
