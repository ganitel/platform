"""HTTP endpoint for media uploads. Returns a presigned URL the client
PUTs the file to directly, plus a `media_id` to reference the object
from other resources (property photos, avatar, …)."""

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.modules.media.schemas import MediaUploadIn, MediaUploadOut
from app.modules.media.service import create_upload

router = APIRouter(prefix="/media", tags=["media"])


@router.post("", response_model=MediaUploadOut, status_code=status.HTTP_201_CREATED)
async def request_upload(body: MediaUploadIn, user: CurrentUser, session: DbSession) -> MediaUploadOut:
    return await create_upload(session, user, mime_type=body.mime_type, size_bytes=body.size_bytes)
