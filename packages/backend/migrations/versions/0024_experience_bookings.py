"""experience bookings table; payments table generalized to support both booking types

Revision ID: 0024_experience_bookings
Revises: 0023_hotels_and_rooms
Create Date: 2026-05-31
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0024_experience_bookings"
down_revision: str | Sequence[str] | None = "0023_hotels_and_rooms"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    experience_booking_status = postgresql.ENUM(
        "requested",
        "pending_payment",
        "confirmed",
        "host_declined",
        "cancelled_by_guest",
        "cancelled_by_host",
        "cancelled_expired",
        "completed",
        "disputed",
        name="experience_booking_status",
        create_type=True,
    )
    experience_booking_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "experience_bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "guest_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "experience_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("experiences.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "host_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("requested_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("party_size", sa.Integer(), nullable=False),
        sa.Column("subtotal_amount", sa.Numeric(19, 4), nullable=False),
        sa.Column("subtotal_currency", sa.String(3), nullable=False),
        sa.Column("total_amount", sa.Numeric(19, 4), nullable=False),
        sa.Column("total_currency", sa.String(3), nullable=False),
        sa.Column("host_payout_amount", sa.Numeric(19, 4), nullable=False),
        sa.Column("host_payout_currency", sa.String(3), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(name="experience_booking_status", create_type=False),
            nullable=False,
            server_default="requested",
        ),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("confirm_deadline_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("hold_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("host_confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("party_size >= 1", name="ck_experience_bookings_party_size_positive"),
        sa.CheckConstraint(
            "subtotal_amount >= 0", name="ck_experience_bookings_subtotal_non_negative"
        ),
        sa.CheckConstraint("total_amount >= 0", name="ck_experience_bookings_total_non_negative"),
        sa.CheckConstraint(
            "host_payout_amount >= 0", name="ck_experience_bookings_payout_non_negative"
        ),
    )

    op.create_index(
        "ix_experience_bookings_guest_id_created_at",
        "experience_bookings",
        ["guest_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_experience_bookings_host_id_status",
        "experience_bookings",
        ["host_id", "status"],
    )
    op.create_index(
        "ix_experience_bookings_experience_date_status",
        "experience_bookings",
        ["experience_id", "requested_date", "status"],
    )

    op.alter_column(
        "payments",
        "booking_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )
    op.add_column(
        "payments",
        sa.Column(
            "experience_booking_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("experience_bookings.id", ondelete="RESTRICT"),
            nullable=True,
        ),
    )
    op.create_index(
        "ix_payments_experience_booking_id",
        "payments",
        ["experience_booking_id"],
    )
    op.create_check_constraint(
        "ck_payments_target_xor",
        "payments",
        "(booking_id IS NOT NULL)::int + (experience_booking_id IS NOT NULL)::int = 1",
    )

    # Defer the experience_bookings.payment_id FK so the create_table doesn't
    # require the payments column to exist yet.
    op.create_foreign_key(
        "fk_experience_bookings_payment_id_payments",
        "experience_bookings",
        "payments",
        ["payment_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_experience_bookings_payment_id_payments",
        "experience_bookings",
        type_="foreignkey",
    )
    op.drop_constraint("ck_payments_target_xor", "payments", type_="check")
    op.drop_index("ix_payments_experience_booking_id", table_name="payments")
    op.drop_column("payments", "experience_booking_id")
    op.alter_column(
        "payments",
        "booking_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )

    op.drop_index("ix_experience_bookings_experience_date_status", table_name="experience_bookings")
    op.drop_index("ix_experience_bookings_host_id_status", table_name="experience_bookings")
    op.drop_index("ix_experience_bookings_guest_id_created_at", table_name="experience_bookings")
    op.drop_table("experience_bookings")
    sa.Enum(name="experience_booking_status").drop(op.get_bind(), checkfirst=True)
