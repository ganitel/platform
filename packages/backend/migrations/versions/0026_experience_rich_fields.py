"""experiences: add rich content fields + group-size pricing

New columns on experiences:
  - what_is_included  TEXT NOT NULL DEFAULT ''
  - eligibility       TEXT NOT NULL DEFAULT ''
  - itinerary         TEXT NOT NULL DEFAULT ''
  - start_time        TIME (nullable)

Changes to experience_prices:
  - add group_size    INTEGER NOT NULL DEFAULT 1  (1 = per person; 2-10 = group override)
  - drop unique(experience_id, currency)
  - add  unique(experience_id, currency, group_size)
  - add  CHECK(group_size BETWEEN 1 AND 10)

Revision ID: 0026_experience_rich_fields
Revises: 0025_waitlist_room_intent
Create Date: 2026-06-18
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0026_experience_rich_fields"
down_revision: str | Sequence[str] | None = "0025_waitlist_room_intent"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "experiences", sa.Column("what_is_included", sa.Text(), nullable=False, server_default="")
    )
    op.add_column(
        "experiences", sa.Column("eligibility", sa.Text(), nullable=False, server_default="")
    )
    op.add_column(
        "experiences", sa.Column("itinerary", sa.Text(), nullable=False, server_default="")
    )
    op.add_column("experiences", sa.Column("start_time", sa.Time(), nullable=True))

    op.add_column(
        "experience_prices",
        sa.Column("group_size", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_check_constraint(
        "ck_experience_prices_group_size",
        "experience_prices",
        "group_size BETWEEN 1 AND 10",
    )
    op.drop_constraint(
        "uq_experience_prices_experience_currency", "experience_prices", type_="unique"
    )
    op.create_unique_constraint(
        "uq_experience_prices_experience_currency_group",
        "experience_prices",
        ["experience_id", "currency", "group_size"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_experience_prices_experience_currency_group", "experience_prices", type_="unique"
    )
    op.drop_constraint("ck_experience_prices_group_size", "experience_prices", type_="check")
    op.create_unique_constraint(
        "uq_experience_prices_experience_currency",
        "experience_prices",
        ["experience_id", "currency"],
    )
    op.drop_column("experience_prices", "group_size")

    op.drop_column("experiences", "start_time")
    op.drop_column("experiences", "itinerary")
    op.drop_column("experiences", "eligibility")
    op.drop_column("experiences", "what_is_included")
