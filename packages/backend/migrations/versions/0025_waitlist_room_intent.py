"""add room_type_id to waitlist_emails — records which room a prelaunch
visitor wanted to book

Revision ID: 0025_waitlist_room_intent
Revises: 0024_experience_bookings
Create Date: 2026-06-07
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0025_waitlist_room_intent"
down_revision: str | Sequence[str] | None = "0024_experience_bookings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "waitlist_emails",
        sa.Column(
            "room_type_id",
            sa.Uuid(),
            sa.ForeignKey("room_types.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("waitlist_emails", "room_type_id")
