"""bookings + payments + idempotency + outbox

Revision ID: 0003_bookings_payments
Revises: 0002_properties_media
Create Date: 2026-04-25

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_bookings_payments"
down_revision: str | Sequence[str] | None = "0002_properties_media"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    # Idempotency
    op.create_table(
        "idempotency_records",
        sa.Column("key", sa.String(120), primary_key=True),
        sa.Column(
            "user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("response_status", sa.Integer(), nullable=False),
        sa.Column("response_body", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_idempotency_records_user_id", "idempotency_records", ["user_id"])
    op.create_index("ix_idempotency_records_expires_at", "idempotency_records", ["expires_at"])

    # Outbox
    op.create_table(
        "outbox_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("aggregate_type", sa.String(40), nullable=False),
        sa.Column("aggregate_id", sa.Uuid(), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("dispatched_at", sa.DateTime(timezone=True)),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text()),
    )
    op.create_index("ix_outbox_events_event_type", "outbox_events", ["event_type"])
    op.create_index("ix_outbox_events_aggregate_id", "outbox_events", ["aggregate_id"])
    op.create_index("ix_outbox_events_created_at", "outbox_events", ["created_at"])
    # Pending events index — workers fetch these
    op.execute(
        "CREATE INDEX ix_outbox_events_pending ON outbox_events (created_at) WHERE dispatched_at IS NULL"
    )

    # Status enums — create_type=False so SA does NOT try to auto-create them
    # again when referenced from create_table below.
    payment_status = postgresql.ENUM(
        "pending",
        "authorized",
        "captured",
        "failed",
        "refunded",
        name="payment_status",
        create_type=False,
    )
    booking_status = postgresql.ENUM(
        "pending_payment",
        "confirmed",
        "cancelled_by_guest",
        "cancelled_by_host",
        "cancelled_expired",
        "completed",
        "disputed",
        name="booking_status",
        create_type=False,
    )
    payment_status.create(op.get_bind(), checkfirst=True)
    booking_status.create(op.get_bind(), checkfirst=True)

    # Bookings — created BEFORE payments because payments has FK to bookings,
    # but bookings.payment_id also FKs to payments. Solution: create bookings without
    # the payment FK, create payments, then add the FK.
    op.create_table(
        "bookings",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "guest_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
        ),
        sa.Column(
            "property_id",
            sa.Uuid(),
            sa.ForeignKey("properties.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("check_in_date", sa.Date(), nullable=False),
        sa.Column("check_out_date", sa.Date(), nullable=False),
        sa.Column("guest_count", sa.Integer(), nullable=False),
        sa.Column("subtotal_amount", sa.Numeric(19, 4), nullable=False),
        sa.Column("subtotal_currency", sa.String(3), nullable=False),
        sa.Column("total_amount", sa.Numeric(19, 4), nullable=False),
        sa.Column("total_currency", sa.String(3), nullable=False),
        sa.Column("host_payout_amount", sa.Numeric(19, 4), nullable=False),
        sa.Column("host_payout_currency", sa.String(3), nullable=False),
        sa.Column("fx_rate_used", sa.Numeric(20, 10)),
        sa.Column("fx_snapshot_at", sa.DateTime(timezone=True)),
        sa.Column("status", booking_status, nullable=False, server_default="pending_payment"),
        sa.Column("payment_id", sa.Uuid()),  # FK added after payments table is created
        sa.Column("hold_expires_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("confirmed_at", sa.DateTime(timezone=True)),
        sa.Column("cancelled_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("check_out_date > check_in_date", name="ck_bookings_dates_ordered"),
        sa.CheckConstraint("guest_count >= 1", name="ck_bookings_guest_count_positive"),
        sa.CheckConstraint("subtotal_amount >= 0", name="ck_bookings_subtotal_non_negative"),
    )
    op.create_index("ix_bookings_guest_id", "bookings", ["guest_id"])
    op.create_index("ix_bookings_property_id", "bookings", ["property_id"])
    op.create_index("ix_bookings_status", "bookings", ["status"])
    op.create_index("ix_bookings_hold_expires_at", "bookings", ["hold_expires_at"])
    op.create_index("ix_bookings_payment_id", "bookings", ["payment_id"])

    # Date-overlap exclusion: only ACTIVE bookings (pending_payment, confirmed) block dates.
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

    # Payments
    op.create_table(
        "payments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "booking_id",
            sa.Uuid(),
            sa.ForeignKey("bookings.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(40), nullable=False),
        sa.Column("provider_intent_id", sa.String(255)),
        sa.Column("idempotency_key", sa.String(80), nullable=False),
        sa.Column("amount", sa.Numeric(19, 4), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("status", payment_status, nullable=False, server_default="pending"),
        sa.Column("raw_init_response", postgresql.JSONB()),
        sa.Column("raw_last_event", postgresql.JSONB()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("captured_at", sa.DateTime(timezone=True)),
        sa.Column("failed_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_payments_booking_id", "payments", ["booking_id"])
    op.create_index(
        "ix_payments_provider_intent_id", "payments", ["provider_intent_id"], unique=True
    )
    op.create_index("ix_payments_status", "payments", ["status"])

    # Now bookings.payment_id can FK to payments
    op.create_foreign_key(
        "fk_bookings_payment_id_payments",
        "bookings",
        "payments",
        ["payment_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_bookings_payment_id_payments", "bookings", type_="foreignkey")
    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_provider_intent_id", table_name="payments")
    op.drop_index("ix_payments_booking_id", table_name="payments")
    op.drop_table("payments")
    op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap")
    op.drop_index("ix_bookings_payment_id", table_name="bookings")
    op.drop_index("ix_bookings_hold_expires_at", table_name="bookings")
    op.drop_index("ix_bookings_status", table_name="bookings")
    op.drop_index("ix_bookings_property_id", table_name="bookings")
    op.drop_index("ix_bookings_guest_id", table_name="bookings")
    op.drop_table("bookings")
    op.execute("DROP TYPE IF EXISTS booking_status")
    op.execute("DROP TYPE IF EXISTS payment_status")
    op.execute("DROP INDEX IF EXISTS ix_outbox_events_pending")
    op.drop_index("ix_outbox_events_created_at", table_name="outbox_events")
    op.drop_index("ix_outbox_events_aggregate_id", table_name="outbox_events")
    op.drop_index("ix_outbox_events_event_type", table_name="outbox_events")
    op.drop_table("outbox_events")
    op.drop_index("ix_idempotency_records_expires_at", table_name="idempotency_records")
    op.drop_index("ix_idempotency_records_user_id", table_name="idempotency_records")
    op.drop_table("idempotency_records")
