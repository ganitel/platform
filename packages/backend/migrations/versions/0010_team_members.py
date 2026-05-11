"""team_members table for the about page (cofounders + future tour guides)

Revision ID: 0010_team_members
Revises: 0009_waitlist_phone
Create Date: 2026-05-11

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010_team_members"
down_revision: str | Sequence[str] | None = "0009_waitlist_phone"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


COFOUNDER_LANDRY_ID = "8c4f3a9b-1c2d-4e5f-8a9b-0c1d2e3f4a5b"
COFOUNDER_GILDAS_ID = "9d5e4b1a-2d3e-4f6a-9b0c-1d2e3f4a5b6c"


def upgrade() -> None:
    team_members = op.create_table(
        "team_members",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("title_fr", sa.String(120), nullable=False),
        sa.Column("title_en", sa.String(120), nullable=False),
        sa.Column("bio_fr", sa.Text(), nullable=True),
        sa.Column("bio_en", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column(
            "display_order", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_team_members")),
    )
    op.create_index(
        op.f("ix_team_members_role"), "team_members", ["role"], unique=False
    )

    op.bulk_insert(
        team_members,
        [
            {
                "id": COFOUNDER_LANDRY_ID,
                "name": "Landry Monga",
                "role": "cofounder",
                "title_fr": "Co-fondateur",
                "title_en": "Co-founder",
                "bio_fr": None,
                "bio_en": None,
                "avatar_url": None,
                "display_order": 0,
                "is_active": True,
            },
            {
                "id": COFOUNDER_GILDAS_ID,
                "name": "Gildas Mbaku",
                "role": "cofounder",
                "title_fr": "Co-fondateur",
                "title_en": "Co-founder",
                "bio_fr": None,
                "bio_en": None,
                "avatar_url": None,
                "display_order": 1,
                "is_active": True,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_team_members_role"), table_name="team_members")
    op.drop_table("team_members")
