"""add_legacy_migration_mapping_tables

Revision ID: a1b2c3d4e5f6
Revises: f9b0c1d2e3f5
Create Date: 2026-02-24 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "f9b0c1d2e3f5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _create_map_table(table_name: str) -> None:
    op.create_table(
        table_name,
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("old_id", sa.Integer(), nullable=False),
        sa.Column("new_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_hash", sa.String(length=64), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("old_id", name=f"uq_{table_name}_old_id"),
    )
    op.create_index(f"ix_{table_name}_new_id", table_name, ["new_id"], unique=False)


def _drop_map_table(table_name: str) -> None:
    op.drop_index(f"ix_{table_name}_new_id", table_name=table_name)
    op.drop_table(table_name)


def upgrade() -> None:
    _create_map_table("migration_map_users")
    _create_map_table("migration_map_locations")
    _create_map_table("migration_map_property_types")
    _create_map_table("migration_map_properties")
    _create_map_table("migration_map_amenities")


def downgrade() -> None:
    _drop_map_table("migration_map_amenities")
    _drop_map_table("migration_map_properties")
    _drop_map_table("migration_map_property_types")
    _drop_map_table("migration_map_locations")
    _drop_map_table("migration_map_users")
