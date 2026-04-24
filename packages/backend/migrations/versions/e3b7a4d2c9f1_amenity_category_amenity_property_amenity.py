"""amenity_category_amenity_property_amenity

Revision ID: e3b7a4d2c9f1
Revises: c2f1b6d9a4e7
Create Date: 2026-02-12 14:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e3b7a4d2c9f1"
down_revision: str | None = "c2f1b6d9a4e7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "amenity_categories",
        sa.Column("name_en", sa.String(length=100), nullable=False),
        sa.Column("name_fr", sa.String(length=100), nullable=False),
        sa.Column("icon_path", sa.String(length=255), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
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
    op.create_index(op.f("ix_amenity_categories_name_en"), "amenity_categories", ["name_en"], unique=True)
    op.create_index(op.f("ix_amenity_categories_name_fr"), "amenity_categories", ["name_fr"], unique=True)

    op.create_table(
        "amenities",
        sa.Column("category_id", sa.UUID(), nullable=False),
        sa.Column("name_en", sa.String(length=100), nullable=False),
        sa.Column("name_fr", sa.String(length=100), nullable=False),
        sa.Column("icon_path", sa.String(length=255), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["category_id"], ["amenity_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_amenities_category_id"), "amenities", ["category_id"], unique=False)
    op.create_index(op.f("ix_amenities_name_en"), "amenities", ["name_en"], unique=False)
    op.create_index(op.f("ix_amenities_name_fr"), "amenities", ["name_fr"], unique=False)

    op.create_table(
        "property_amenities",
        sa.Column("property_id", sa.UUID(), nullable=False),
        sa.Column("amenity_id", sa.UUID(), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["amenity_id"], ["amenities.id"]),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("property_id", "amenity_id", name="uq_property_amenity_pair"),
    )
    op.create_index(op.f("ix_property_amenities_amenity_id"), "property_amenities", ["amenity_id"], unique=False)
    op.create_index(op.f("ix_property_amenities_property_id"), "property_amenities", ["property_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_property_amenities_property_id"), table_name="property_amenities")
    op.drop_index(op.f("ix_property_amenities_amenity_id"), table_name="property_amenities")
    op.drop_table("property_amenities")

    op.drop_index(op.f("ix_amenities_name_fr"), table_name="amenities")
    op.drop_index(op.f("ix_amenities_name_en"), table_name="amenities")
    op.drop_index(op.f("ix_amenities_category_id"), table_name="amenities")
    op.drop_table("amenities")

    op.drop_index(op.f("ix_amenity_categories_name_fr"), table_name="amenity_categories")
    op.drop_index(op.f("ix_amenity_categories_name_en"), table_name="amenity_categories")
    op.drop_table("amenity_categories")
