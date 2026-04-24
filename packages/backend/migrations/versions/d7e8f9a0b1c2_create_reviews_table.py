"""create_reviews_table

Revision ID: d7e8f9a0b1c2
Revises: e4c5d6f7a8b9
Create Date: 2026-02-15 11:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d7e8f9a0b1c2"
down_revision: str | None = "e4c5d6f7a8b9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column("service_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("booking_id", sa.UUID(), nullable=True),
        sa.Column("overall_rating", sa.Numeric(precision=3, scale=2), nullable=False),
        sa.Column(
            "cleanliness_rating", sa.Numeric(precision=3, scale=2), nullable=True
        ),
        sa.Column(
            "communication_rating", sa.Numeric(precision=3, scale=2), nullable=True
        ),
        sa.Column("checkin_rating", sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column("accuracy_rating", sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column("location_rating", sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column("value_rating", sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("updated_by", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("service_id", "user_id", name="uq_review_one_per_user"),
    )
    op.create_index(
        op.f("ix_reviews_booking_id"), "reviews", ["booking_id"], unique=False
    )
    op.create_index(
        op.f("ix_reviews_service_id"), "reviews", ["service_id"], unique=False
    )
    op.create_index(op.f("ix_reviews_user_id"), "reviews", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_reviews_user_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_service_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_booking_id"), table_name="reviews")
    op.drop_table("reviews")
