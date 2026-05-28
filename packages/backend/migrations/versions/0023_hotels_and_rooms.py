"""hotels: property kind, room_types, room prices/media, per-room bookings

Revision ID: 0023_hotels_and_rooms
Revises: 0022_waitlist_travel_party
Create Date: 2026-05-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0023_hotels_and_rooms"
down_revision: str | Sequence[str] | None = "0022_waitlist_travel_party"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    property_kind = postgresql.ENUM(
        "rental",
        "hotel",
        name="property_kind",
        create_type=False,
    )
    property_kind.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "properties",
        sa.Column(
            "kind",
            property_kind,
            nullable=False,
            server_default="rental",
        ),
    )

    op.alter_column("properties", "capacity", existing_type=sa.Integer(), nullable=True)
    op.alter_column("properties", "bedrooms", existing_type=sa.Integer(), nullable=True)
    op.alter_column("properties", "beds", existing_type=sa.Integer(), nullable=True)
    op.alter_column("properties", "bathrooms", existing_type=sa.Integer(), nullable=True)

    op.create_table(
        "room_types",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "property_id",
            sa.Uuid(),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "bed_config",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("max_guests", sa.Integer(), nullable=False),
        sa.Column(
            "amenities",
            postgresql.ARRAY(sa.String(40)),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column(
            "private_bathroom",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column("inventory_count", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint("max_guests >= 1 AND max_guests <= 16", name="ck_room_types_max_guests"),
        sa.CheckConstraint(
            "inventory_count >= 1 AND inventory_count <= 500",
            name="ck_room_types_inventory_count",
        ),
    )
    op.create_index("ix_room_types_property_id", "room_types", ["property_id"])

    op.create_table(
        "room_type_prices",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "room_type_id",
            sa.Uuid(),
            sa.ForeignKey("room_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("amount", sa.Numeric(19, 4), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("room_type_id", "currency", name="uq_room_type_prices_room_currency"),
    )
    op.create_index("ix_room_type_prices_room_type_id", "room_type_prices", ["room_type_id"])

    op.create_table(
        "room_type_media",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "room_type_id",
            sa.Uuid(),
            sa.ForeignKey("room_types.id", ondelete="CASCADE"),
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
    op.create_index("ix_room_type_media_room_type_id", "room_type_media", ["room_type_id"])

    op.add_column(
        "bookings",
        sa.Column(
            "room_type_id",
            sa.Uuid(),
            sa.ForeignKey("room_types.id", ondelete="RESTRICT"),
            nullable=True,
        ),
    )
    op.add_column("bookings", sa.Column("room_slot_index", sa.Integer(), nullable=True))
    op.create_index("ix_bookings_room_type_id", "bookings", ["room_type_id"])
    op.create_check_constraint(
        "ck_bookings_room_pair",
        "bookings",
        "(room_type_id IS NULL) = (room_slot_index IS NULL)",
    )

    op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap")
    op.execute(
        """
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_no_overlap
        EXCLUDE USING gist (
            property_id WITH =,
            daterange(check_in_date, check_out_date, '[)') WITH &&
        ) WHERE (
            room_type_id IS NULL
            AND status IN ('pending_payment', 'confirmed')
        )
        """
    )

    op.execute(
        """
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_room_no_overlap
        EXCLUDE USING gist (
            room_type_id WITH =,
            room_slot_index WITH =,
            daterange(check_in_date, check_out_date, '[)') WITH &&
        ) WHERE (
            room_type_id IS NOT NULL
            AND status IN ('pending_payment', 'confirmed')
        )
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_room_no_overlap")
    op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap")
    op.execute(
        """
        ALTER TABLE bookings
        ADD CONSTRAINT bookings_no_overlap
        EXCLUDE USING gist (
            property_id WITH =,
            daterange(check_in_date, check_out_date, '[)') WITH &&
        ) WHERE (status IN ('pending_payment', 'confirmed'))
        """
    )

    op.drop_constraint("ck_bookings_room_pair", "bookings", type_="check")
    op.drop_index("ix_bookings_room_type_id", table_name="bookings")
    op.drop_column("bookings", "room_slot_index")
    op.drop_column("bookings", "room_type_id")

    op.drop_index("ix_room_type_media_room_type_id", table_name="room_type_media")
    op.drop_table("room_type_media")

    op.drop_index("ix_room_type_prices_room_type_id", table_name="room_type_prices")
    op.drop_table("room_type_prices")

    op.drop_index("ix_room_types_property_id", table_name="room_types")
    op.drop_table("room_types")

    op.alter_column("properties", "bathrooms", existing_type=sa.Integer(), nullable=False)
    op.alter_column("properties", "beds", existing_type=sa.Integer(), nullable=False)
    op.alter_column("properties", "bedrooms", existing_type=sa.Integer(), nullable=False)
    op.alter_column("properties", "capacity", existing_type=sa.Integer(), nullable=False)

    op.drop_column("properties", "kind")
    op.execute("DROP TYPE IF EXISTS property_kind")
