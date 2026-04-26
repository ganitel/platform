"""init: users

Revision ID: 0001_init_users
Revises:
Create Date: 2026-04-25

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_init_users"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("clerk_user_id", sa.String(64), nullable=False),
        sa.Column("email", sa.String(255)),
        sa.Column("phone", sa.String(32)),
        sa.Column("display_name", sa.String(120), nullable=False),
        sa.Column("avatar_url", sa.Text()),
        sa.Column("language", sa.String(10), nullable=False, server_default="fr"),
        sa.Column("is_host", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_phone", "users", ["phone"])


def downgrade() -> None:
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_clerk_user_id", table_name="users")
    op.drop_table("users")
