"""add_proximity

Revision ID: e4c5d6f7a8b9
Revises: f8a9c0e1b2d3
Create Date: 2026-02-15 11:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e4c5d6f7a8b9"
down_revision: str | None = "f8a9c0e1b2d3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create proximities table
    op.create_table(
        "proximities",
        sa.Column("property_id", sa.UUID(), nullable=False),
        sa.Column("destination_name", sa.String(length=100), nullable=False),
        sa.Column("minutes_away", sa.Integer(), nullable=False),
        sa.Column("travel_mode", sa.String(length=50), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indices
    op.create_index(op.f("ix_proximities_property_id"), "proximities", ["property_id"], unique=False)


def downgrade() -> None:
    # Drop indices
    op.drop_index(op.f("ix_proximities_property_id"), table_name="proximities")

    # Drop table
    op.drop_table("proximities")
