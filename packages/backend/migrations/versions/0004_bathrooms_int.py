"""bathrooms: numeric(4,1) -> integer

Revision ID: 0004_bathrooms_int
Revises: 0003_bookings_payments
Create Date: 2026-04-27

A bathroom is countable; we never need fractional values. Existing
rows with half-bathrooms get rounded up via CEIL so a "0.5" becomes
"1" rather than collapsing to 0.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_bathrooms_int"
down_revision: str | Sequence[str] | None = "0003_bookings_payments"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "properties",
        "bathrooms",
        type_=sa.Integer(),
        existing_type=sa.Numeric(4, 1),
        existing_nullable=False,
        existing_server_default=sa.text("0"),
        postgresql_using="CEIL(bathrooms)::integer",
    )


def downgrade() -> None:
    op.alter_column(
        "properties",
        "bathrooms",
        type_=sa.Numeric(4, 1),
        existing_type=sa.Integer(),
        existing_nullable=False,
        existing_server_default=sa.text("0"),
        postgresql_using="bathrooms::numeric(4,1)",
    )
