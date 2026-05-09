"""extend waitlist_emails with interest, headcount, budget_range, notes

Revision ID: 0008_waitlist_extended
Revises: 0007_waitlist
Create Date: 2026-05-02

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008_waitlist_extended"
down_revision: str | Sequence[str] | None = "0007_waitlist"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("waitlist_emails", sa.Column("interest", sa.String(32), nullable=True))
    op.add_column("waitlist_emails", sa.Column("headcount", sa.Integer(), nullable=True))
    op.add_column("waitlist_emails", sa.Column("budget_range", sa.String(32), nullable=True))
    op.add_column("waitlist_emails", sa.Column("notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("waitlist_emails", "notes")
    op.drop_column("waitlist_emails", "budget_range")
    op.drop_column("waitlist_emails", "headcount")
    op.drop_column("waitlist_emails", "interest")
