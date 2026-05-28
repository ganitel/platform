"""Room-type CRUD: create, update, soft-delete, list, media attach/detach/reorder.

Permissions: only the property host or an admin may mutate. Reads are
gated at the caller (route) level.
"""

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.core.money import Money
from app.modules.bookings.models import ACTIVE_STATUSES, Booking
from app.modules.media.models import Media, MediaKind
from app.modules.properties.models import (
    Property,
    PropertyKind,
    RoomType,
    RoomTypeMediaItem,
    RoomTypePrice,
)
from app.modules.properties.schemas import RoomTypeCreateIn, RoomTypeUpdateIn
from app.modules.users.models import User


def _ensure_owner(user: User, property: Property) -> None:
    if property.host_id != user.id and not user.is_admin:
        raise ForbiddenError(code="property.not_owner")


def _ensure_hotel(property: Property) -> None:
    if property.kind != PropertyKind.HOTEL:
        raise ValidationError(code="room.requires_hotel")


async def _max_active_slot(session: AsyncSession, room_id: UUID) -> int | None:
    stmt = (
        select(func.max(Booking.room_slot_index))
        .where(Booking.room_type_id == room_id)
        .where(Booking.status.in_(ACTIVE_STATUSES))
    )
    result = (await session.execute(stmt)).scalar_one_or_none()
    if result is None:
        return None
    return int(result)


async def create_room(
    session: AsyncSession,
    property: Property,
    user: User,
    payload: RoomTypeCreateIn,
) -> RoomType:
    _ensure_owner(user, property)
    _ensure_hotel(property)

    room = RoomType(
        property_id=property.id,
        title=payload.title,
        description=payload.description,
        bed_config=[b.model_dump() for b in payload.bed_config],
        max_guests=payload.max_guests,
        amenities=payload.amenities,
        private_bathroom=payload.private_bathroom,
        inventory_count=payload.inventory_count,
        position=payload.position,
        active=payload.active,
    )
    session.add(room)
    await session.flush()

    for price in payload.prices:
        session.add(
            RoomTypePrice(
                room_type_id=room.id,
                currency=price.currency.value,
                amount=price.amount,
            )
        )

    for idx, media_id in enumerate(payload.media_ids):
        media = await session.get(Media, media_id)
        if media is None or (media.owner_user_id != user.id and not user.is_admin):
            raise NotFoundError(code="media.not_found")
        session.add(RoomTypeMediaItem(room_type_id=room.id, media_id=media_id, position=idx))

    await session.commit()
    await session.refresh(room)
    return room


async def update_room(
    session: AsyncSession,
    property: Property,
    user: User,
    room: RoomType,
    patch: RoomTypeUpdateIn,
) -> RoomType:
    _ensure_owner(user, property)
    _ensure_hotel(property)
    if room.property_id != property.id:
        raise NotFoundError(code="room.not_found")

    data = patch.model_dump(exclude_unset=True)

    if "bed_config" in data and data["bed_config"] is not None:
        room.bed_config = data.pop("bed_config")

    if "prices" in data and data["prices"] is not None:
        new_prices = data.pop("prices")
        await session.execute(delete(RoomTypePrice).where(RoomTypePrice.room_type_id == room.id))
        await session.flush()
        for raw in new_prices:
            price = Money.model_validate(raw)
            session.add(
                RoomTypePrice(
                    room_type_id=room.id,
                    currency=price.currency.value,
                    amount=price.amount,
                )
            )

    if "inventory_count" in data:
        new_count = data["inventory_count"]
        max_slot = await _max_active_slot(session, room.id)
        if max_slot is not None and max_slot >= new_count:
            raise ConflictError(
                code="room.inventory_below_active_bookings",
                extra={"min": max_slot + 1},
            )

    for key, value in data.items():
        setattr(room, key, value)

    await session.commit()
    await session.refresh(room)
    return room


async def soft_delete_room(
    session: AsyncSession,
    property: Property,
    user: User,
    room: RoomType,
) -> RoomType:
    _ensure_owner(user, property)
    if room.property_id != property.id:
        raise NotFoundError(code="room.not_found")

    count_stmt = (
        select(func.count())
        .select_from(Booking)
        .where(Booking.room_type_id == room.id)
        .where(Booking.status.in_(ACTIVE_STATUSES))
    )
    active_count = int((await session.execute(count_stmt)).scalar_one())
    if active_count > 0:
        raise ConflictError(
            code="room.has_active_bookings",
            extra={"active_bookings": active_count},
        )

    room.active = False
    await session.commit()
    await session.refresh(room)
    return room


async def get_room(session: AsyncSession, room_id: UUID) -> RoomType:
    stmt = (
        select(RoomType)
        .options(
            selectinload(RoomType.prices),
            selectinload(RoomType.media).selectinload(RoomTypeMediaItem.media),
        )
        .where(RoomType.id == room_id)
    )
    room = (await session.execute(stmt)).scalar_one_or_none()
    if room is None:
        raise NotFoundError(code="room.not_found")
    return room


async def attach_room_media(
    session: AsyncSession,
    property: Property,
    user: User,
    room: RoomType,
    *,
    media_id: UUID,
    position: int,
) -> RoomTypeMediaItem:
    _ensure_owner(user, property)
    if room.property_id != property.id:
        raise NotFoundError(code="room.not_found")

    media = await session.get(Media, media_id)
    if media is None:
        raise NotFoundError(code="media.not_found")
    if media.owner_user_id != user.id and not user.is_admin:
        raise ForbiddenError(code="media.not_owner")

    if len(room.media) >= 20:
        raise ConflictError(code="media.cap_exceeded")
    if media.kind == MediaKind.VIDEO:
        current_videos = sum(1 for it in room.media if it.media.kind == MediaKind.VIDEO)
        if current_videos >= 3:
            raise ConflictError(code="media.video_cap_exceeded")

    item = RoomTypeMediaItem(room_type_id=room.id, media_id=media_id, position=position)
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


async def detach_room_media(
    session: AsyncSession,
    property: Property,
    user: User,
    room: RoomType,
    item_id: UUID,
) -> None:
    _ensure_owner(user, property)
    if room.property_id != property.id:
        raise NotFoundError(code="room.not_found")

    item = await session.get(RoomTypeMediaItem, item_id)
    if item is None or item.room_type_id != room.id:
        raise NotFoundError(code="media_item.not_found")
    await session.delete(item)
    await session.commit()


async def reorder_room_media(
    session: AsyncSession,
    property: Property,
    user: User,
    room: RoomType,
    order: list[tuple[UUID, int]],
) -> None:
    """Atomic reorder. The set of ids must exactly match the room's
    current media items; partial overlap raises ValidationError."""
    _ensure_owner(user, property)
    if room.property_id != property.id:
        raise NotFoundError(code="room.not_found")

    existing = {it.id: it for it in room.media}
    requested = {item_id for item_id, _ in order}
    if requested != set(existing.keys()):
        raise ValidationError(code="media.reorder_mismatch")
    if len({pos for _, pos in order}) != len(order):
        raise ValidationError(code="media.reorder_duplicate_positions")
    for item_id, pos in order:
        existing[item_id].position = pos
    await session.commit()
