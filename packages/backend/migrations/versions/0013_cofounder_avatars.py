"""set cofounder avatar URLs

Revision ID: 0013_cofounder_avatars
Revises: 0012_team_members
Create Date: 2026-05-11

"""

from collections.abc import Sequence

from alembic import op

revision: str = "0013_cofounder_avatars"
down_revision: str | Sequence[str] | None = "0012_team_members"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


COFOUNDER_LANDRY_ID = "8c4f3a9b-1c2d-4e5f-8a9b-0c1d2e3f4a5b"
COFOUNDER_GILDAS_ID = "9d5e4b1a-2d3e-4f6a-9b0c-1d2e3f4a5b6c"

LANDRY_AVATAR_URL = "https://yhidrktnkfwvxoxetnob.supabase.co/storage/v1/object/sign/uploads/team/landry.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNjYzYTUxZC00Y2QzLTQ2OGItOGZmYi0zODk2YThhNWM1ZjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1cGxvYWRzL3RlYW0vbGFuZHJ5LmpwZWciLCJpYXQiOjE3Nzg1MTkwNjcsImV4cCI6ODA4NTcxOTA2N30.MlrDsEMf29LWtTgrgHgUfuEGFzk8EtOd2mqWacbpyCM"
GILDAS_AVATAR_URL = "https://yhidrktnkfwvxoxetnob.supabase.co/storage/v1/object/sign/uploads/team/gildaspp.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNjYzYTUxZC00Y2QzLTQ2OGItOGZmYi0zODk2YThhNWM1ZjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1cGxvYWRzL3RlYW0vZ2lsZGFzcHAucG5nIiwiaWF0IjoxNzc4NTE5MTgwLCJleHAiOjgwODU3MTkxODB9.KTwHQMbpkn_A9_99_MbrHV9LswYM2ptXmlc-l1gis-Q"


def upgrade() -> None:
    op.execute(
        f"UPDATE team_members SET avatar_url = '{LANDRY_AVATAR_URL}' "
        f"WHERE id = '{COFOUNDER_LANDRY_ID}'"
    )
    op.execute(
        f"UPDATE team_members SET avatar_url = '{GILDAS_AVATAR_URL}' "
        f"WHERE id = '{COFOUNDER_GILDAS_ID}'"
    )


def downgrade() -> None:
    op.execute(
        f"UPDATE team_members SET avatar_url = NULL "
        f"WHERE id IN ('{COFOUNDER_LANDRY_ID}', '{COFOUNDER_GILDAS_ID}')"
    )
