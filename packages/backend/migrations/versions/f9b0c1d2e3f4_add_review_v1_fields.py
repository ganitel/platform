"""add_review_v1_fields

Revision ID: f9b0c1d2e3f4
Revises: d7e8f9a0b1c2
Create Date: 2026-02-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f9b0c1d2e3f4"
down_revision: Union[str, None] = "d7e8f9a0b1c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add property_id column
    op.add_column(
        "reviews",
        sa.Column("property_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key("fk_reviews_property_id", "reviews", "properties", ["property_id"], ["id"])
    op.create_index(op.f("ix_reviews_property_id"), "reviews", ["property_id"], unique=False)
    
    # Add V1 rating fields
    op.add_column(
        "reviews",
        sa.Column("comfort_rating", sa.Numeric(precision=3, scale=2), nullable=True),
    )
    op.add_column(
        "reviews",
        sa.Column("security_rating", sa.Numeric(precision=3, scale=2), nullable=True),
    )
    op.add_column(
        "reviews",
        sa.Column("accessibility_rating", sa.Numeric(precision=3, scale=2), nullable=True),
    )
    op.add_column(
        "reviews",
        sa.Column("host_response_rating", sa.Numeric(precision=3, scale=2), nullable=True),
    )


def downgrade() -> None:
    # Drop V1 rating fields
    op.drop_column("reviews", "host_response_rating")
    op.drop_column("reviews", "accessibility_rating")
    op.drop_column("reviews", "security_rating")
    op.drop_column("reviews", "comfort_rating")
    
    # Drop property_id
    op.drop_index(op.f("ix_reviews_property_id"), table_name="reviews")
    op.drop_constraint("fk_reviews_property_id", "reviews", type_="foreignkey")
    op.drop_column("reviews", "property_id")
