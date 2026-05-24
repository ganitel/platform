"""rename photo tables to media, add media kind + draft_id + poster + duration

Revision ID: 0019_listing_media
Revises: 0018_property_experience_address
Create Date: 2026-05-24
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0019_listing_media"
down_revision: str | Sequence[str] | None = "0018_property_experience_address"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    media_kind = sa.Enum("image", "video", name="media_kind")
    media_kind.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "media",
        sa.Column(
            "kind",
            media_kind,
            nullable=False,
            server_default="image",
        ),
    )
    op.add_column("media", sa.Column("draft_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_media_draft_id", "media", ["draft_id"])
    op.add_column(
        "media",
        sa.Column(
            "poster_media_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("media.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("media", sa.Column("duration_ms", sa.BigInteger(), nullable=True))

    op.rename_table("property_photos", "property_media")
    op.rename_table("experience_photos", "experience_media")

    op.execute(
        """
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY position, created_at) - 1 AS new_pos
            FROM property_media
        )
        UPDATE property_media pm SET position = ranked.new_pos
        FROM ranked WHERE pm.id = ranked.id;
        """
    )
    op.execute(
        """
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY experience_id ORDER BY position, created_at) - 1 AS new_pos
            FROM experience_media
        )
        UPDATE experience_media em SET position = ranked.new_pos
        FROM ranked WHERE em.id = ranked.id;
        """
    )


def downgrade() -> None:
    op.rename_table("experience_media", "experience_photos")
    op.rename_table("property_media", "property_photos")
    op.drop_column("media", "duration_ms")
    op.drop_column("media", "poster_media_id")
    op.drop_index("ix_media_draft_id", table_name="media")
    op.drop_column("media", "draft_id")
    op.drop_column("media", "kind")
    sa.Enum(name="media_kind").drop(op.get_bind(), checkfirst=True)
