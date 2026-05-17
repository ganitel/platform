"""add explicit listing metadata fields to properties

Revision ID: 0016_property_listing_metadata
Revises: 0015_gildas_avatar_rename
Create Date: 2026-05-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0016_property_listing_metadata"
down_revision: str | Sequence[str] | None = "0015_gildas_avatar_rename"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    parking_availability = postgresql.ENUM(
        "none", "free", "paid", name="parking_availability", create_type=True
    )
    kitchen_type = postgresql.ENUM(
        "none", "kitchenette", "full", name="kitchen_type", create_type=True
    )
    parking_availability.create(op.get_bind(), checkfirst=True)
    kitchen_type.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "properties",
        sa.Column(
            "parking_available",
            sa.Enum("none", "free", "paid", name="parking_availability"),
            nullable=False,
            server_default="none",
        ),
    )
    op.add_column(
        "properties", sa.Column("elevator", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column(
        "properties",
        sa.Column("accessible", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("private_bathroom", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column(
            "kitchen_type",
            sa.Enum("none", "kitchenette", "full", name="kitchen_type"),
            nullable=False,
            server_default="none",
        ),
    )
    op.add_column(
        "properties",
        sa.Column("events_allowed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("family_friendly", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "properties",
        sa.Column("child_friendly", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("properties", "child_friendly")
    op.drop_column("properties", "family_friendly")
    op.drop_column("properties", "events_allowed")
    op.drop_column("properties", "kitchen_type")
    op.drop_column("properties", "private_bathroom")
    op.drop_column("properties", "accessible")
    op.drop_column("properties", "elevator")
    op.drop_column("properties", "parking_available")
    op.execute("DROP TYPE IF EXISTS kitchen_type")
    op.execute("DROP TYPE IF EXISTS parking_availability")
