"""properties + media + postgis

Revision ID: 0002_properties_media
Revises: 0001_init_users
Create Date: 2026-04-25

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_properties_media"
down_revision: str | Sequence[str] | None = "0001_init_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "media",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("owner_user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bucket", sa.String(120), nullable=False),
        sa.Column("key", sa.String(512), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.BigInteger()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_media_owner_user_id", "media", ["owner_user_id"])

    property_status = postgresql.ENUM(
        "draft", "published", "unlisted", "removed", name="property_status", create_type=True
    )
    cancellation_policy = postgresql.ENUM(
        "flexible", "moderate", "strict", name="cancellation_policy", create_type=True
    )
    property_status.create(op.get_bind(), checkfirst=True)
    cancellation_policy.create(op.get_bind(), checkfirst=True)

    op.execute(
        """
        CREATE TABLE properties (
            id              uuid PRIMARY KEY,
            host_id         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            title           varchar(180) NOT NULL,
            description     text NOT NULL DEFAULT '',
            property_type   varchar(40) NOT NULL,
            city            varchar(120) NOT NULL,
            country_code    varchar(2) NOT NULL,
            location        geography(Point, 4326) NOT NULL,
            capacity        integer NOT NULL,
            bedrooms        integer NOT NULL DEFAULT 0,
            beds            integer NOT NULL DEFAULT 0,
            bathrooms       numeric(4,1) NOT NULL DEFAULT 0,
            amenities       varchar(40)[] NOT NULL DEFAULT '{}',
            house_rules     text,
            cancellation_policy cancellation_policy NOT NULL DEFAULT 'moderate',
            base_price_amount   numeric(19,4) NOT NULL,
            base_price_currency varchar(3) NOT NULL,
            content_language    varchar(2) NOT NULL DEFAULT 'fr',
            status              property_status NOT NULL DEFAULT 'draft',
            search_tsv tsvector GENERATED ALWAYS AS (
                to_tsvector('simple',
                    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,'')
                )
            ) STORED,
            created_at      timestamptz NOT NULL DEFAULT now(),
            updated_at      timestamptz NOT NULL DEFAULT now(),
            published_at    timestamptz,
            CONSTRAINT ck_properties_capacity_positive    CHECK (capacity >= 1),
            CONSTRAINT ck_properties_price_non_negative   CHECK (base_price_amount >= 0)
        )
        """
    )
    op.create_index("ix_properties_host_id", "properties", ["host_id"])
    op.create_index("ix_properties_property_type", "properties", ["property_type"])
    op.create_index("ix_properties_city", "properties", ["city"])
    op.create_index("ix_properties_country_code", "properties", ["country_code"])
    op.create_index("ix_properties_status", "properties", ["status"])
    op.execute("CREATE INDEX ix_properties_location_gist ON properties USING GIST (location)")
    op.execute("CREATE INDEX ix_properties_amenities_gin ON properties USING GIN (amenities)")
    op.execute("CREATE INDEX ix_properties_search_tsv_gin ON properties USING GIN (search_tsv)")

    op.create_table(
        "property_photos",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("property_id", sa.Uuid(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("media_id", sa.Uuid(), sa.ForeignKey("media.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_property_photos_property_id", "property_photos", ["property_id"])


def downgrade() -> None:
    op.drop_index("ix_property_photos_property_id", table_name="property_photos")
    op.drop_table("property_photos")
    op.execute("DROP INDEX IF EXISTS ix_properties_search_tsv_gin")
    op.execute("DROP INDEX IF EXISTS ix_properties_amenities_gin")
    op.execute("DROP INDEX IF EXISTS ix_properties_location_gist")
    op.drop_index("ix_properties_status", table_name="properties")
    op.drop_index("ix_properties_country_code", table_name="properties")
    op.drop_index("ix_properties_city", table_name="properties")
    op.drop_index("ix_properties_property_type", table_name="properties")
    op.drop_index("ix_properties_host_id", table_name="properties")
    op.drop_table("properties")
    op.execute("DROP TYPE IF EXISTS cancellation_policy")
    op.execute("DROP TYPE IF EXISTS property_status")
    op.drop_index("ix_media_owner_user_id", table_name="media")
    op.drop_table("media")
