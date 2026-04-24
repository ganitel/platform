"""
Ganitel V2 Backend - Payment Repository Implementation
"""

from datetime import UTC
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.payment import Payment
from app.domain.repositories.payment_repository import IPaymentRepository


class PaymentRepository(IPaymentRepository):
    """SQLAlchemy implementation of Payment Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, payment: Payment) -> Payment:
        """Create a new payment"""
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def get_by_id(self, payment_id: UUID) -> Payment | None:
        """Get payment by ID"""
        return (
            self.db.query(Payment)
            .filter(Payment.id == payment_id, Payment.deleted_at.is_(None))
            .first()
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Payment]:
        """Get all payments with pagination"""
        return (
            self.db.query(Payment)
            .filter(Payment.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, payment: Payment) -> Payment:
        """Update an existing payment"""
        from datetime import datetime

        payment.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def delete(self, payment_id: UUID) -> bool:
        """Delete a payment (hard delete)"""
        payment = self.get_by_id(payment_id)
        if payment:
            self.db.delete(payment)
            self.db.commit()
            return True
        return False

    def soft_delete(self, payment_id: UUID) -> bool:
        """Soft delete a payment"""
        payment = self.get_by_id(payment_id)
        if payment:
            payment.soft_delete()
            self.db.commit()
            return True
        return False

    def count(self, filters: dict | None = None) -> int:
        """Count payments with optional filters"""
        query = self.db.query(Payment).filter(Payment.deleted_at.is_(None))
        if filters:
            for key, value in filters.items():
                if hasattr(Payment, key):
                    query = query.filter(getattr(Payment, key) == value)
        return query.count()

    def exists(self, payment_id: UUID) -> bool:
        """Check if payment exists"""
        return (
            self.db.query(Payment)
            .filter(Payment.id == payment_id, Payment.deleted_at.is_(None))
            .first()
            is not None
        )

    def find_by_criteria(
        self, criteria: dict, skip: int = 0, limit: int = 100
    ) -> list[Payment]:
        """Find payments by criteria"""
        query = self.db.query(Payment).filter(Payment.deleted_at.is_(None))

        for key, value in criteria.items():
            if hasattr(Payment, key) and value is not None:
                query = query.filter(getattr(Payment, key) == value)

        return query.offset(skip).limit(limit).all()

    def get_by_booking_id(self, booking_id: UUID) -> Payment | None:
        """Get payment by booking ID"""
        return (
            self.db.query(Payment)
            .filter(Payment.booking_id == booking_id, Payment.deleted_at.is_(None))
            .first()
        )

    def get_by_transaction_id(self, transaction_id: str) -> Payment | None:
        """Get payment by provider transaction ID"""
        return (
            self.db.query(Payment)
            .filter(
                Payment.transaction_id == transaction_id, Payment.deleted_at.is_(None)
            )
            .first()
        )

    def get_user_payments(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Payment]:
        """Get all payments for a user through their bookings"""
        from app.domain.entities.booking import Booking

        return (
            self.db.query(Payment)
            .join(Booking, Payment.booking_id == Booking.id)
            .filter(
                Booking.user_id == user_id,
                Payment.deleted_at.is_(None),
                Booking.deleted_at.is_(None),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
