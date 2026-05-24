"""HTTP endpoints for media uploads and draft cleanup."""

from uuid import UUID

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.modules.media.schemas import MediaUploadIn, MediaUploadOut
from app.modules.media.service import create_upload, delete_unattached_draft

router = APIRouter(prefix="/media", tags=["media"])


@router.post("", response_model=MediaUploadOut, status_code=status.HTTP_201_CREATED)
async def request_upload(
    body: MediaUploadIn, user: CurrentUser, session: DbSession
) -> MediaUploadOut:
    return await create_upload(session, user, body)


@router.delete("/draft/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_draft(draft_id: UUID, user: CurrentUser, session: DbSession) -> None:
    await delete_unattached_draft(session, user, draft_id)
