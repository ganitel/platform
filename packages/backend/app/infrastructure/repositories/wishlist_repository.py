"""
Ganitel V2 Backend - Wishlist Repository Implementation
"""
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.wishlist import Wishlist
from app.domain.repositories.wishlist_repository import IWishlistRepository


class WishlistRepository(IWishlistRepository):
    """SQLAlchemy implementation of Wishlist Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, wishlist: Wishlist) -> Wishlist:
        """Create a new wishlist item"""
        self.db.add(wishlist)
        self.db.commit()
        self.db.refresh(wishlist)
        return wishlist

    def get_by_id(self, wishlist_id: UUID) -> Wishlist | None:
        """Get wishlist by ID"""
        return self.db.query(Wishlist).filter(Wishlist.id == wishlist_id).first()

    def get_by_user_id(self, user_id: UUID, skip: int = 0, limit: int = 100) -> list[Wishlist]:
        """Get wishlist by user ID"""
        return self.db.query(Wishlist).filter(
            Wishlist.user_id == user_id
        ).order_by(Wishlist.created_at.desc()).offset(skip).limit(limit).all()

    def get_by_user_and_service(self, user_id: UUID, service_id: UUID) -> Wishlist | None:
        """Get wishlist item by user and service"""
        return self.db.query(Wishlist).filter(
            Wishlist.user_id == user_id,
            Wishlist.service_id == service_id
        ).first()

    def remove_by_user_and_service(self, user_id: UUID, service_id: UUID) -> bool:
        """Remove wishlist item"""
        wishlist = self.get_by_user_and_service(user_id, service_id)
        if wishlist:
            self.db.delete(wishlist)
            self.db.commit()
            return True
        return False

    def update(self, wishlist: Wishlist) -> Wishlist:
        """Update wishlist"""
        from datetime import datetime
        wishlist.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(wishlist)
        return wishlist

    def get_all(self, skip: int = 0, limit: int = 100):
        """Get all wishlist items"""
        return self.db.query(Wishlist).offset(skip).limit(limit).all()

    def delete(self, wishlist_id: UUID) -> bool:
        """Delete wishlist"""
        wishlist = self.get_by_id(wishlist_id)
        if wishlist:
            self.db.delete(wishlist)
            self.db.commit()
            return True
        return False

