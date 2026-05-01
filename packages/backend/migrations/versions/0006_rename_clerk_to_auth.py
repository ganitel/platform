"""rename clerk_user_id to auth_user_id

Revision ID: 0006_rename_clerk_to_auth
Revises: 0005_experiences
Create Date: 2026-05-01

"""

from collections.abc import Sequence

from alembic import op

revision: str = "0006_rename_clerk_to_auth"
down_revision: str | Sequence[str] | None = "0005_experiences"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_users_clerk_user_id", table_name="users")
    op.alter_column("users", "clerk_user_id", new_column_name="auth_user_id")
    op.create_index("ix_users_auth_user_id", "users", ["auth_user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_auth_user_id", table_name="users")
    op.alter_column("users", "auth_user_id", new_column_name="clerk_user_id")
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)
