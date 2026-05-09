"""waitlist_emails table for prelaunch email capture

Revision ID: 0007_waitlist
Revises: 0006_rename_clerk_to_auth
Create Date: 2026-05-01

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007_waitlist"
down_revision: str | Sequence[str] | None = "0006_rename_clerk_to_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "waitlist_emails",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("name", sa.String(120), nullable=True),
        sa.Column("property_id", sa.Uuid(), nullable=True),
        sa.Column("experience_id", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["property_id"],
            ["properties.id"],
            name=op.f("fk_waitlist_emails_property_id_properties"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["experience_id"],
            ["experiences.id"],
            name=op.f("fk_waitlist_emails_experience_id_experiences"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_waitlist_emails")),
        sa.UniqueConstraint("email", "property_id", name="uq_waitlist_email_property"),
        sa.UniqueConstraint("email", "experience_id", name="uq_waitlist_email_experience"),
    )
    op.create_index(op.f("ix_waitlist_emails_email"), "waitlist_emails", ["email"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_waitlist_emails_email"), table_name="waitlist_emails")
    op.drop_table("waitlist_emails")
