"""add budget_currency to waitlist_emails

Revision ID: 0010_waitlist_budget_currency
Revises: 0009_waitlist_phone
Create Date: 2026-05-11

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010_waitlist_budget_currency"
down_revision: str | Sequence[str] | None = "0009_waitlist_phone"


def upgrade() -> None:
    op.add_column(
        "waitlist_emails",
        sa.Column("budget_currency", sa.String(8), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("waitlist_emails", "budget_currency")
