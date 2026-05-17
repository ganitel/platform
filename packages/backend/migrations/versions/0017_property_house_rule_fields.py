"""add structured house-rule fields to properties

Revision ID: 0017_property_house_rule_fields
Revises: 0016_property_listing_metadata
Create Date: 2026-05-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0017_property_house_rule_fields"
down_revision: str | Sequence[str] | None = "0016_property_listing_metadata"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "properties",
        sa.Column("pets_allowed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("smoking_allowed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("properties", sa.Column("check_in_time", sa.Time(), nullable=True))
    op.add_column("properties", sa.Column("check_out_time", sa.Time(), nullable=True))


def downgrade() -> None:
    op.drop_column("properties", "check_out_time")
    op.drop_column("properties", "check_in_time")
    op.drop_column("properties", "smoking_allowed")
    op.drop_column("properties", "pets_allowed")
