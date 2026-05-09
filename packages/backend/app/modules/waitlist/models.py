from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class WaitlistEntry(Base):
    __tablename__ = "waitlist_emails"
    __table_args__ = (
        UniqueConstraint("email", "property_id", name="uq_waitlist_email_property"),
        UniqueConstraint("email", "experience_id", name="uq_waitlist_email_experience"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(32))
    property_id: Mapped[UUID | None] = mapped_column(
        Uuid(), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True
    )
    experience_id: Mapped[UUID | None] = mapped_column(
        Uuid(), ForeignKey("experiences.id", ondelete="SET NULL"), nullable=True
    )
    interest: Mapped[str | None] = mapped_column(String(32))
    headcount: Mapped[int | None] = mapped_column(Integer())
    budget_range: Mapped[str | None] = mapped_column(String(32))
    notes: Mapped[str | None] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
