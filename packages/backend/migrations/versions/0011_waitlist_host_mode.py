"""add host mode columns to waitlist_emails

Revision ID: 0011_waitlist_host_mode
Revises: 0010_waitlist_budget_currency
Create Date: 2026-05-11

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011_waitlist_host_mode"
down_revision: str | Sequence[str] | None = "0010_waitlist_budget_currency"


def upgrade() -> None:
    op.add_column(
        "waitlist_emails",
        sa.Column("role", sa.String(16), nullable=True),
    )
    op.add_column(
        "waitlist_emails",
        sa.Column("host_city", sa.String(120), nullable=True),
    )
    op.add_column(
        "waitlist_emails",
        sa.Column("host_inventory", sa.String(16), nullable=True),
    )
    op.add_column(
        "waitlist_emails",
        sa.Column("host_status", sa.String(32), nullable=True),
    )

    op.drop_constraint("uq_waitlist_email_property", "waitlist_emails", type_="unique")
    op.drop_constraint("uq_waitlist_email_experience", "waitlist_emails", type_="unique")
    op.create_unique_constraint(
        "uq_waitlist_email_property",
        "waitlist_emails",
        ["email", "property_id", "role"],
    )
    op.create_unique_constraint(
        "uq_waitlist_email_experience",
        "waitlist_emails",
        ["email", "experience_id", "role"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_waitlist_email_experience", "waitlist_emails", type_="unique")
    op.drop_constraint("uq_waitlist_email_property", "waitlist_emails", type_="unique")
    op.create_unique_constraint(
        "uq_waitlist_email_property",
        "waitlist_emails",
        ["email", "property_id"],
    )
    op.create_unique_constraint(
        "uq_waitlist_email_experience",
        "waitlist_emails",
        ["email", "experience_id"],
    )

    op.drop_column("waitlist_emails", "host_status")
    op.drop_column("waitlist_emails", "host_inventory")
    op.drop_column("waitlist_emails", "host_city")
    op.drop_column("waitlist_emails", "role")
