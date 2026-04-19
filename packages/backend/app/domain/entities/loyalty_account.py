"""
Ganitel V2 Backend - Loyalty Account Entity
"""
from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.domain.entities.base import AuditableEntity


class LoyaltyAccount(AuditableEntity):
    """
    Loyalty Account entity for loyalty program
    """
    __tablename__ = "loyalty_accounts"
    
    # Relationships
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Points Information
    current_points = Column(Integer, default=0, nullable=False)
    total_points_earned = Column(Integer, default=0, nullable=False)
    total_points_redeemed = Column(Integer, default=0, nullable=False)
    
    # Tier Information
    tier_level = Column(String(20), default="bronze", nullable=False)  # bronze, silver, gold, platinum
    tier_points = Column(Integer, default=0, nullable=False)
    
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

