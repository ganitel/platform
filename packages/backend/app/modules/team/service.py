from collections.abc import Sequence
from typing import cast
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.core.storage import public_or_signed_url, upload_object
from app.modules.team.models import TeamAdmin, TeamMember
from app.modules.team.schemas import (
    TITLE_OPTIONS,
    TeamMemberOut,
    TeamMemberUpdate,
    TeamRole,
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


async def list_active(session: AsyncSession, role: TeamRole | None = None) -> Sequence[TeamMember]:
    stmt = select(TeamMember).where(TeamMember.is_active.is_(True))
    if role is not None:
        stmt = stmt.where(TeamMember.role == role)
    stmt = stmt.order_by(TeamMember.display_order, TeamMember.created_at)
    result = await session.execute(stmt)
    return result.scalars().all()


async def get_by_id(session: AsyncSession, team_member_id: UUID) -> TeamMember:
    member = await session.get(TeamMember, team_member_id)
    if member is None:
        raise NotFoundError(code="team_member.not_found")
    return member


async def create_submission(
    session: AsyncSession,
    *,
    name: str,
    bio_fr: str,
    city: str,
    country: str,
    age: int,
    image_bytes: bytes,
    image_content_type: str,
) -> TeamMember:
    if image_content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError(code="image.type_unsupported")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValidationError(code="image.too_large")
    if len(image_bytes) == 0:
        raise ValidationError(code="image.empty")

    extension = _extension_for(image_content_type)
    key = f"team/{uuid4().hex}.{extension}"
    await upload_object(key=key, body=image_bytes, content_type=image_content_type)

    member = TeamMember(
        name=name,
        role="tour_guide",
        title_fr="Guide touristique",
        title_en="Tour guide",
        bio_fr=bio_fr,
        avatar_url=key,
        city=city,
        country=country,
        age=age,
        display_order=1000,
        is_active=False,
    )
    session.add(member)
    await session.commit()
    await session.refresh(member)
    return member


async def apply_review_update(
    session: AsyncSession, member: TeamMember, patch: TeamMemberUpdate
) -> TeamMember:
    data = patch.model_dump(exclude_unset=True)
    # title_key fans out to the two locale columns so the form stays simple
    # (pick one option) but the data model keeps separate fr/en strings.
    title_key = data.pop("title_key", None)
    if title_key is not None:
        title_fr, title_en = TITLE_OPTIONS[title_key]
        member.title_fr = title_fr
        member.title_en = title_en
    for field, value in data.items():
        setattr(member, field, value)
    await session.commit()
    await session.refresh(member)
    return member


async def approve(session: AsyncSession, member: TeamMember) -> TeamMember:
    member.is_active = True
    await session.commit()
    await session.refresh(member)
    return member


async def reject(session: AsyncSession, member: TeamMember) -> None:
    # Once a member is active they're shown publicly on /about — a stale
    # reject link from an old email mustn't quietly delete them. Use the
    # admin UI / DB to deactivate active members instead.
    if member.is_active:
        raise ConflictError(code="team_member.already_active")
    await session.delete(member)
    await session.commit()


async def list_admin_emails(session: AsyncSession) -> list[str]:
    stmt = select(TeamAdmin.email)
    result = await session.execute(stmt)
    # Always emit normalized emails — Resend, JWT claims, and lookups all
    # compare case-insensitively; storing lowercase keeps them consistent.
    return [email.lower() for (email,) in result.all()]


async def assert_admin_active(session: AsyncSession, admin_email: str) -> None:
    """The review token is signed, but admins can be removed from
    team_admins after a token is minted. Re-check on every gated request
    so a revoked admin's lingering link can't act on submissions."""
    # Case-insensitive match: an admin row "lvndry@protonmail.com" must
    # match a token claim "Lvndry@protonmail.com". Email RFC 5321 says
    # the local-part is technically case-sensitive, but every mainstream
    # provider treats it case-insensitively in practice and our seed
    # uses lowercase.
    normalized = admin_email.strip().lower()
    stmt = select(TeamAdmin.id).where(func.lower(TeamAdmin.email) == normalized)
    result = await session.execute(stmt)
    if result.first() is None:
        raise ForbiddenError(code="admin.revoked")


async def to_public(member: TeamMember) -> TeamMemberOut:
    avatar = await public_or_signed_url(member.avatar_url) if member.avatar_url else None
    return TeamMemberOut(
        id=member.id,
        name=member.name,
        role=cast(TeamRole, member.role),
        title_fr=member.title_fr,
        title_en=member.title_en,
        bio_fr=member.bio_fr,
        bio_en=member.bio_en,
        avatar_url=avatar,
        city=member.city,
        country=member.country,
        age=member.age,
    )


def _extension_for(content_type: str) -> str:
    return {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }[content_type]
