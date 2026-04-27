"""experiences + experience_photos

Revision ID: 0005_experiences
Revises: 0004_bathrooms_int
Create Date: 2026-04-27

A separate module from properties: distinct shape (no bedrooms /
amenities, has duration_minutes), distinct lifecycle. Reuses the media
table for photos.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005_experiences"
down_revision: str | Sequence[str] | None = "0004_bathrooms_int"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    experience_status = postgresql.ENUM(
        "draft", "published", "unlisted", "removed", name="experience_status", create_type=True
    )
    experience_cancellation = postgresql.ENUM(
        "flexible",
        "moderate",
        "strict",
        name="experience_cancellation_policy",
        create_type=True,
    )
    experience_status.create(op.get_bind(), checkfirst=True)
    experience_cancellation.create(op.get_bind(), checkfirst=True)

    op.execute(
        """
        CREATE TABLE experiences (
            id              uuid PRIMARY KEY,
            host_id         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            title           varchar(180) NOT NULL,
            description     text NOT NULL DEFAULT '',
            experience_type varchar(40) NOT NULL,
            city            varchar(120) NOT NULL,
            country_code    varchar(2) NOT NULL,
            location        geography(Point, 4326) NOT NULL,
            capacity        integer NOT NULL,
            duration_minutes integer NOT NULL,
            cancellation_policy experience_cancellation_policy NOT NULL DEFAULT 'moderate',
            base_price_amount   numeric(19,4) NOT NULL,
            base_price_currency varchar(3) NOT NULL,
            content_language    varchar(2) NOT NULL DEFAULT 'fr',
            status              experience_status NOT NULL DEFAULT 'draft',
            search_tsv tsvector GENERATED ALWAYS AS (
                to_tsvector('simple',
                    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,'')
                )
            ) STORED,
            created_at      timestamptz NOT NULL DEFAULT now(),
            updated_at      timestamptz NOT NULL DEFAULT now(),
            published_at    timestamptz,
            CONSTRAINT ck_experiences_capacity_positive   CHECK (capacity >= 1),
            CONSTRAINT ck_experiences_duration_positive   CHECK (duration_minutes >= 1),
            CONSTRAINT ck_experiences_price_non_negative  CHECK (base_price_amount >= 0)
        )
        """
    )
    op.create_index("ix_experiences_host_id", "experiences", ["host_id"])
    op.create_index("ix_experiences_experience_type", "experiences", ["experience_type"])
    op.create_index("ix_experiences_city", "experiences", ["city"])
    op.create_index("ix_experiences_country_code", "experiences", ["country_code"])
    op.create_index("ix_experiences_status", "experiences", ["status"])
    op.execute("CREATE INDEX ix_experiences_location_gist ON experiences USING GIST (location)")
    op.execute("CREATE INDEX ix_experiences_search_tsv_gin ON experiences USING GIN (search_tsv)")

    op.create_table(
        "experience_photos",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "experience_id",
            sa.Uuid(),
            sa.ForeignKey("experiences.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "media_id",
            sa.Uuid(),
            sa.ForeignKey("media.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index("ix_experience_photos_experience_id", "experience_photos", ["experience_id"])


def downgrade() -> None:
    op.drop_index("ix_experience_photos_experience_id", table_name="experience_photos")
    op.drop_table("experience_photos")
    op.execute("DROP INDEX IF EXISTS ix_experiences_search_tsv_gin")
    op.execute("DROP INDEX IF EXISTS ix_experiences_location_gist")
    op.drop_index("ix_experiences_status", table_name="experiences")
    op.drop_index("ix_experiences_country_code", table_name="experiences")
    op.drop_index("ix_experiences_city", table_name="experiences")
    op.drop_index("ix_experiences_experience_type", table_name="experiences")
    op.drop_index("ix_experiences_host_id", table_name="experiences")
    op.drop_table("experiences")
    op.execute("DROP TYPE IF EXISTS experience_cancellation_policy")
    op.execute("DROP TYPE IF EXISTS experience_status")
