"""add browse-path indexes on properties and experiences

Revision ID: 0020_browse_indexes
Revises: 0019_listing_media
Create Date: 2026-05-24
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0020_browse_indexes"
down_revision: str | Sequence[str] | None = "0019_listing_media"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_properties_status_published_at "
        "ON properties (status, published_at DESC NULLS LAST)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_properties_base_price_amount "
        "ON properties (base_price_amount)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_experiences_status_published_at "
        "ON experiences (status, published_at DESC NULLS LAST)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_experiences_base_price_amount "
        "ON experiences (base_price_amount)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_experiences_base_price_amount")
    op.execute("DROP INDEX IF EXISTS ix_experiences_status_published_at")
    op.execute("DROP INDEX IF EXISTS ix_properties_base_price_amount")
    op.execute("DROP INDEX IF EXISTS ix_properties_status_published_at")
