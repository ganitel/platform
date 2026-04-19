"""Add booking exclusion constraint to prevent overlapping bookings

Revision ID: f9b0c1d2e3f5
Revises: f9b0c1d2e3f4
Create Date: 2026-02-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f9b0c1d2e3f5"
down_revision: Union[str, None] = "f9b0c1d2e3f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add EXCLUSION constraint to prevent overlapping bookings for the same service
    # This constraint ensures that no two bookings for the same service can have overlapping date ranges
    # The constraint only applies to non-deleted bookings (WHERE deleted_at IS NULL)
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist;")
    op.execute(
        """
        ALTER TABLE bookings 
        ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
            service_id WITH =,
            daterange(start_date, end_date) WITH &&
        ) WHERE (deleted_at IS NULL);
        """
    )


def downgrade() -> None:
    # Drop the exclusion constraint
    op.execute(
        """
        ALTER TABLE bookings 
        DROP CONSTRAINT IF EXISTS no_overlapping_bookings;
        """
    )
