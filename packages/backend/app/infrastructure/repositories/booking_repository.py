"""
Ganitel V2 Backend - Booking Repository Implementation
"""

from datetime import date, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.domain.entities.booking import Booking, BookingStatus
from app.domain.repositories.booking_repository import IBookingRepository


class BookingRepository(IBookingRepository):
    """SQLAlchemy implementation of booking repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, booking: Booking) -> Booking:
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def get_by_id(self, booking_id: UUID) -> Booking | None:
        return (
            self.db.query(Booking)
            .filter(
                Booking.id == booking_id,
                Booking.deleted_at.is_(None),
            )
            .first()
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(Booking.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, booking: Booking) -> Booking:
        booking.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def delete(self, booking_id: UUID) -> bool:
        booking = self.get_by_id(booking_id)
        if booking:
            self.db.delete(booking)
            self.db.commit()
            return True
        return False

    def soft_delete(self, booking_id: UUID) -> bool:
        booking = self.get_by_id(booking_id)
        if booking:
            booking.soft_delete()
            self.db.commit()
            return True
        return False

    def count(self, filters: dict[str, Any] | None = None) -> int:
        query = self.db.query(Booking).filter(Booking.deleted_at.is_(None))
        if filters:
            for key, value in filters.items():
                if hasattr(Booking, key):
                    query = query.filter(getattr(Booking, key) == value)
        return query.count()

    def exists(self, booking_id: UUID) -> bool:
        return (
            self.db.query(Booking)
            .filter(
                Booking.id == booking_id,
                Booking.deleted_at.is_(None),
            )
            .first()
            is not None
        )

    def find_by_criteria(
        self, criteria: dict[str, Any], skip: int = 0, limit: int = 100
    ) -> list[Booking]:
        query = self.db.query(Booking).filter(Booking.deleted_at.is_(None))
        for key, value in criteria.items():
            if hasattr(Booking, key) and value is not None:
                query = query.filter(getattr(Booking, key) == value)
        return query.offset(skip).limit(limit).all()

    def get_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(
                Booking.user_id == user_id,
                Booking.deleted_at.is_(None),
            )
            .order_by(Booking.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # Alias for compatibility
    def get_by_user_id(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Booking]:
        return self.get_by_user(user_id, skip, limit)

    def get_by_service(
        self, service_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(
                Booking.service_id == service_id,
                Booking.deleted_at.is_(None),
            )
            .order_by(Booking.start_date.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def has_conflict(self, service_id: UUID, start_date: date, end_date: date) -> bool:
        overlap = (
            self.db.query(Booking)
            .filter(
                Booking.service_id == service_id,
                Booking.deleted_at.is_(None),
                Booking.status.in_(
                    [
                        BookingStatus.PENDING.value,
                        BookingStatus.CONFIRMED.value,
                        BookingStatus.COMPLETED.value,
                    ]
                ),
                or_(
                    and_(
                        Booking.start_date <= start_date, Booking.end_date > start_date
                    ),
                    and_(Booking.start_date < end_date, Booking.end_date >= end_date),
                    and_(
                        Booking.start_date >= start_date, Booking.end_date <= end_date
                    ),
                ),
            )
            .first()
        )
        return overlap is not None

    def update_status(self, booking_id: UUID, status: BookingStatus) -> bool:
        booking = self.get_by_id(booking_id)
        if not booking:
            return False
        booking.status = status.value
        booking.updated_at = datetime.utcnow()
        self.db.commit()
        return True

    def find_by_status(
        self, status: BookingStatus, skip: int = 0, limit: int = 100
    ) -> list[Booking]:
        return (
            self.db.query(Booking)
            .filter(
                Booking.status == status.value,
                Booking.deleted_at.is_(None),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def find_user_booking(self, user_id: UUID, booking_id: UUID) -> Booking | None:
        return (
            self.db.query(Booking)
            .filter(
                Booking.id == booking_id,
                Booking.user_id == user_id,
                Booking.deleted_at.is_(None),
            )
            .first()
        )
