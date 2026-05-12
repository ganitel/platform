import logging
from uuid import UUID

from fastapi import APIRouter, File, Form, Query, Response, UploadFile, status

from app.core.config import get_settings
from app.core.deps import DbSession
from app.modules.team import emails, service, tokens
from app.modules.team.schemas import (
    SubmissionResult,
    TeamMemberOut,
    TeamMemberUpdate,
    TeamRole,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/team-members", tags=["team"])


@router.get("", response_model=list[TeamMemberOut])
async def list_team_members(
    response: Response,
    session: DbSession,
    role: TeamRole | None = Query(default=None),
) -> list[TeamMemberOut]:
    members = await service.list_active(session, role=role)
    response.headers["Cache-Control"] = "public, s-maxage=300, stale-while-revalidate=600"
    return [await service.to_public(m) for m in members]


@router.post(
    "",
    response_model=SubmissionResult,
    status_code=status.HTTP_201_CREATED,
)
async def submit_team_member(
    session: DbSession,
    image: UploadFile = File(...),
    name: str = Form(..., min_length=1, max_length=120),
    bio_fr: str = Form(..., min_length=10, max_length=2000),
    city: str = Form(..., min_length=1, max_length=120),
    country: str = Form(..., min_length=1, max_length=120),
    age: int = Form(..., ge=16, le=100),
) -> SubmissionResult:
    body = await image.read()
    logger.info(
        "team.submit.received name=%s city=%s country=%s image_bytes=%d",
        name,
        city,
        country,
        len(body),
    )
    member = await service.create_submission(
        session,
        name=name,
        bio_fr=bio_fr,
        city=city,
        country=country,
        age=age,
        image_bytes=body,
        image_content_type=image.content_type or "application/octet-stream",
    )
    logger.info(
        "team.submit.created team_member_id=%s avatar_key=%s",
        member.id,
        member.avatar_url,
    )
    admin_emails = await service.list_admin_emails(session)
    logger.info("team.submit.admins count=%d", len(admin_emails))
    base = get_settings().APP_BASE_URL.rstrip("/")

    def build_review_url(admin: str) -> str:
        token = tokens.mint(team_member_id=member.id, admin_email=admin)
        return f"{base}/team-members/{member.id}/review?token={token}"

    sent, attempted = await emails.notify_admins(
        member, admin_emails=admin_emails, review_url_builder=build_review_url
    )
    logger.info(
        "team.submit.done team_member_id=%s admins_notified=%d/%d",
        member.id,
        sent,
        attempted,
    )
    return SubmissionResult(
        team_member_id=member.id,
        admins_attempted=attempted,
        admins_notified=sent,
    )


@router.get("/{team_member_id}/review", response_model=TeamMemberOut)
async def get_for_review(team_member_id: UUID, token: str, session: DbSession) -> TeamMemberOut:
    admin_email = tokens.verify(token, team_member_id=team_member_id)
    await service.assert_admin_active(session, admin_email)
    member = await service.get_by_id(session, team_member_id)
    return await service.to_public(member)


@router.patch("/{team_member_id}/review", response_model=TeamMemberOut)
async def update_via_review(
    team_member_id: UUID,
    token: str,
    body: TeamMemberUpdate,
    session: DbSession,
) -> TeamMemberOut:
    admin_email = tokens.verify(token, team_member_id=team_member_id)
    await service.assert_admin_active(session, admin_email)
    member = await service.get_by_id(session, team_member_id)
    await service.apply_review_update(session, member, body)
    return await service.to_public(member)


@router.post("/{team_member_id}/approve", response_model=TeamMemberOut)
async def approve_member(
    team_member_id: UUID,
    token: str,
    session: DbSession,
    body: TeamMemberUpdate | None = None,
) -> TeamMemberOut:
    admin_email = tokens.verify(token, team_member_id=team_member_id)
    await service.assert_admin_active(session, admin_email)
    member = await service.get_by_id(session, team_member_id)
    if body is not None:
        await service.apply_review_update(session, member, body)
    await service.approve(session, member)
    return await service.to_public(member)


@router.delete("/{team_member_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_member(team_member_id: UUID, token: str, session: DbSession) -> None:
    admin_email = tokens.verify(token, team_member_id=team_member_id)
    await service.assert_admin_active(session, admin_email)
    member = await service.get_by_id(session, team_member_id)
    await service.reject(session, member)
