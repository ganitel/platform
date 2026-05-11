"""extra team_members fields + team_admins table

Adds `city`, `country`, `age` columns to `team_members` for the self-serve
admin form, plus a `team_admins` table holding addresses that get the
review-email notification on each submission.

Revision ID: 0014_team_admin_form
Revises: 0013_cofounder_avatars
Create Date: 2026-05-11

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0014_team_admin_form"
down_revision: str | Sequence[str] | None = "0013_cofounder_avatars"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("team_members", sa.Column("city", sa.String(120), nullable=True))
    op.add_column("team_members", sa.Column("country", sa.String(120), nullable=True))
    op.add_column("team_members", sa.Column("age", sa.Integer(), nullable=True))

    team_admins = op.create_table(
        "team_admins",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("name", sa.String(120), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_team_admins")),
        sa.UniqueConstraint("email", name=op.f("uq_team_admins_email")),
    )

    op.bulk_insert(
        team_admins,
        [
            {
                "id": "f1a2b3c4-d5e6-4a8b-9c0d-1e2f3a4b5c6d",
                "email": "lvndry@proton.me",
                "name": "Landry Monga",
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("team_admins")
    op.drop_column("team_members", "age")
    op.drop_column("team_members", "country")
    op.drop_column("team_members", "city")
