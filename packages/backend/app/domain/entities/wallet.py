"""
Ganitel V2 Backend - Wallet Entity
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class Wallet(AuditableEntity):
    """
    Wallet entity for user in-app wallet
    """

    __tablename__ = "wallets"

    # Relationships
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Balance Information
    current_balance: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )
    withdrawn: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )
    received: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )
    gross_balance: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )
    deposits: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )
    bonuses: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=0.0, nullable=False
    )

    def add_balance(self, amount: Decimal, is_bonus: bool = False):
        """Add balance to wallet"""
        self.current_balance += amount
        self.gross_balance += amount
        self.received += amount
        if is_bonus:
            self.bonuses += amount
        else:
            self.deposits += amount

    def withdraw_balance(self, amount: Decimal):
        """Withdraw balance from wallet"""
        if self.current_balance < amount:
            raise ValueError("Insufficient balance")
        self.current_balance -= amount
        self.withdrawn += amount

    def __repr__(self):
        return f"<Wallet(id={self.id}, user_id={self.user_id}, balance={self.current_balance})>"
