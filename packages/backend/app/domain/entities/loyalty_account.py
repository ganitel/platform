"""
Ganitel V2 Backend - Loyalty Account Entity
"""

from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.base import AuditableEntity


class LoyaltyAccount(AuditableEntity):
    """
    Loyalty Account entity for loyalty program
    """

    __tablename__ = "loyalty_accounts"

    # Relationships
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Points Information
    current_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_points_earned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_points_redeemed: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    # Tier Information
    tier_level: Mapped[str] = mapped_column(
        String(20), default="bronze", nullable=False
    )  # bronze, silver, gold, platinum
    tier_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    def add_points(self, points: int):
        """Add points to account"""
        self.current_points += points
        self.total_points_earned += points
        self._update_tier()

    def redeem_points(self, points: int):
        """Redeem points from account"""
        if self.current_points < points:
            raise ValueError("Insufficient points")
        self.current_points -= points
        self.total_points_redeemed += points

    def _update_tier(self):
        """Update tier based on total points"""
        if self.total_points_earned >= 10000:
            self.tier_level = "platinum"
        elif self.total_points_earned >= 5000:
            self.tier_level = "gold"
        elif self.total_points_earned >= 1000:
            self.tier_level = "silver"
        else:
            self.tier_level = "bronze"

    def __repr__(self):
        return f"<LoyaltyAccount(id={self.id}, user_id={self.user_id}, points={self.current_points})>"
