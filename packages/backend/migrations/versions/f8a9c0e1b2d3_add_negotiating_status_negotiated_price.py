"""add_negotiating_status_negotiated_price

Revision ID: f8a9c0e1b2d3
Revises: e3b7a4d2c9f1
Create Date: 2026-02-15 10:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f8a9c0e1b2d3"
down_revision: str | None = "e3b7a4d2c9f1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add negotiated_price column to bookings table
    op.add_column(
        "bookings",
        sa.Column("negotiated_price", sa.Numeric(precision=10, scale=2), nullable=True),
    )


def downgrade() -> None:
    # Drop negotiated_price column
    op.drop_column("bookings", "negotiated_price")
