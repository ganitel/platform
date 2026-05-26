"""add travel dates + adults/children to waitlist_emails

Revision ID: 0022_waitlist_travel_dates_and_party
Revises: 0021_listing_prices
Create Date: 2026-05-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0022_waitlist_travel_party"
down_revision: str | Sequence[str] | None = "0021_listing_prices"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("waitlist_emails", sa.Column("travel_start", sa.Date(), nullable=True))
    op.add_column("waitlist_emails", sa.Column("travel_end", sa.Date(), nullable=True))
    op.add_column("waitlist_emails", sa.Column("adults", sa.SmallInteger(), nullable=True))
    op.add_column("waitlist_emails", sa.Column("children", sa.SmallInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column("waitlist_emails", "children")
    op.drop_column("waitlist_emails", "adults")
    op.drop_column("waitlist_emails", "travel_end")
    op.drop_column("waitlist_emails", "travel_start")
