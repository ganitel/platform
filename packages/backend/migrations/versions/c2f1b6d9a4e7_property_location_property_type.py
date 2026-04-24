"""property_location_property_type

Revision ID: c2f1b6d9a4e7
Revises: 91e870784d19
Create Date: 2026-02-10 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c2f1b6d9a4e7"
down_revision: str | None = "91e870784d19"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "locations",
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("region", sa.String(length=100), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_locations_name"), "locations", ["name"], unique=True)

    op.create_table(
        "property_types",
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_property_types_name"), "property_types", ["name"], unique=True)

    op.create_table(
        "properties",
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("short_description", sa.String(length=500), nullable=True),
        sa.Column("provider_id", sa.UUID(), nullable=False),
        sa.Column("location_id", sa.UUID(), nullable=False),
        sa.Column("property_type_id", sa.UUID(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("latitude", sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column("longitude", sa.Numeric(precision=11, scale=8), nullable=True),
        sa.Column("base_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("price_per", sa.String(length=20), nullable=False),
        sa.Column("max_guests", sa.Integer(), nullable=True),
        sa.Column("bedrooms", sa.Integer(), nullable=True),
        sa.Column("bathrooms", sa.Integer(), nullable=True),
        sa.Column("beds", sa.Integer(), nullable=True),
        sa.Column("living_rooms", sa.Integer(), nullable=True),
        sa.Column("balconies", sa.Integer(), nullable=True),
        sa.Column("instant_book", sa.Boolean(), nullable=False),
        sa.Column("min_stay", sa.Integer(), nullable=False),
        sa.Column("max_stay", sa.Integer(), nullable=True),
        sa.Column("check_in_time", sa.String(length=10), nullable=True),
        sa.Column("check_out_time", sa.String(length=10), nullable=True),
        sa.Column("images", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"]),
        sa.ForeignKeyConstraint(["property_type_id"], ["property_types.id"]),
        sa.ForeignKeyConstraint(["provider_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_properties_location_id"), "properties", ["location_id"], unique=False)
    op.create_index(op.f("ix_properties_property_type_id"), "properties", ["property_type_id"], unique=False)
    op.create_index(op.f("ix_properties_provider_id"), "properties", ["provider_id"], unique=False)
    op.create_index(op.f("ix_properties_title"), "properties", ["title"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_properties_title"), table_name="properties")
    op.drop_index(op.f("ix_properties_provider_id"), table_name="properties")
    op.drop_index(op.f("ix_properties_property_type_id"), table_name="properties")
    op.drop_index(op.f("ix_properties_location_id"), table_name="properties")
    op.drop_table("properties")
    op.drop_index(op.f("ix_property_types_name"), table_name="property_types")
    op.drop_table("property_types")
    op.drop_index(op.f("ix_locations_name"), table_name="locations")
    op.drop_table("locations")
