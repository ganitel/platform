"""create property_prices + experience_prices, migrate from base_price columns

Revision ID: 0021_listing_prices
Revises: 0020_browse_indexes
Create Date: 2026-05-24
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0021_listing_prices"
down_revision: str | Sequence[str] | None = "0020_browse_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "property_prices",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("amount", sa.Numeric(19, 4), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("amount >= 0", name="ck_property_prices_amount_non_negative"),
        sa.UniqueConstraint("property_id", "currency", name="uq_property_prices_property_currency"),
    )
    op.create_index("ix_property_prices_currency_amount", "property_prices", ["currency", "amount"])
    op.create_table(
        "experience_prices",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "experience_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("experiences.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("amount", sa.Numeric(19, 4), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("amount >= 0", name="ck_experience_prices_amount_non_negative"),
        sa.UniqueConstraint(
            "experience_id", "currency", name="uq_experience_prices_experience_currency"
        ),
    )
    op.create_index(
        "ix_experience_prices_currency_amount", "experience_prices", ["currency", "amount"]
    )

    op.execute(
        """
        INSERT INTO property_prices (property_id, currency, amount)
        SELECT id, base_price_currency, base_price_amount
        FROM properties
        WHERE base_price_amount IS NOT NULL AND base_price_currency IS NOT NULL
        """
    )
    op.execute(
        """
        INSERT INTO experience_prices (experience_id, currency, amount)
        SELECT id, base_price_currency, base_price_amount
        FROM experiences
        WHERE base_price_amount IS NOT NULL AND base_price_currency IS NOT NULL
        """
    )

    op.execute("DROP INDEX IF EXISTS ix_properties_base_price_amount")
    op.execute("DROP INDEX IF EXISTS ix_experiences_base_price_amount")

    op.execute("ALTER TABLE properties DROP CONSTRAINT IF EXISTS ck_properties_price_non_negative")
    op.execute(
        "ALTER TABLE experiences DROP CONSTRAINT IF EXISTS ck_experiences_price_non_negative"
    )
    op.drop_column("properties", "base_price_currency")
    op.drop_column("properties", "base_price_amount")
    op.drop_column("experiences", "base_price_currency")
    op.drop_column("experiences", "base_price_amount")


def downgrade() -> None:
    op.add_column("properties", sa.Column("base_price_amount", sa.Numeric(19, 4), nullable=True))
    op.add_column(
        "properties", sa.Column("base_price_currency", sa.String(length=3), nullable=True)
    )
    op.add_column("experiences", sa.Column("base_price_amount", sa.Numeric(19, 4), nullable=True))
    op.add_column(
        "experiences", sa.Column("base_price_currency", sa.String(length=3), nullable=True)
    )

    op.execute(
        """
        UPDATE properties p
        SET base_price_amount = pp.amount,
            base_price_currency = pp.currency
        FROM (
            SELECT DISTINCT ON (property_id) property_id, currency, amount
            FROM property_prices ORDER BY property_id, created_at
        ) pp
        WHERE pp.property_id = p.id
        """
    )
    op.execute(
        """
        UPDATE experiences e
        SET base_price_amount = ep.amount,
            base_price_currency = ep.currency
        FROM (
            SELECT DISTINCT ON (experience_id) experience_id, currency, amount
            FROM experience_prices ORDER BY experience_id, created_at
        ) ep
        WHERE ep.experience_id = e.id
        """
    )

    op.execute("ALTER TABLE properties ALTER COLUMN base_price_amount SET NOT NULL")
    op.execute("ALTER TABLE properties ALTER COLUMN base_price_currency SET NOT NULL")
    op.execute("ALTER TABLE experiences ALTER COLUMN base_price_amount SET NOT NULL")
    op.execute("ALTER TABLE experiences ALTER COLUMN base_price_currency SET NOT NULL")
    op.execute(
        "ALTER TABLE properties ADD CONSTRAINT ck_properties_price_non_negative CHECK (base_price_amount >= 0)"
    )
    op.execute(
        "ALTER TABLE experiences ADD CONSTRAINT ck_experiences_price_non_negative CHECK (base_price_amount >= 0)"
    )

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_properties_base_price_amount "
        "ON properties (base_price_amount)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_experiences_base_price_amount "
        "ON experiences (base_price_amount)"
    )

    op.drop_table("experience_prices")
    op.drop_table("property_prices")
