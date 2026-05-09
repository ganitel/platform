"""add phone to waitlist_emails

Revision ID: 0009_waitlist_phone
Revises: 0008_waitlist_extended
Create Date: 2026-05-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009_waitlist_phone"
down_revision: str | Sequence[str] | None = "0008_waitlist_extended"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("waitlist_emails", sa.Column("phone", sa.String(32), nullable=True))


def downgrade() -> None:
    op.drop_column("waitlist_emails", "phone")
