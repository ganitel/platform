"""point Gildas's avatar at the renamed gildas.png object

The Storage file was renamed from gildaspp.png -> gildas.png; this UPDATE
swaps the signed URL stored on the row so the About page picks up the new path.

Revision ID: 0015_gildas_avatar_rename
Revises: 0014_team_admin_form
Create Date: 2026-05-11

"""

from collections.abc import Sequence

from alembic import op

revision: str = "0015_gildas_avatar_rename"
down_revision: str | Sequence[str] | None = "0014_team_admin_form"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


COFOUNDER_GILDAS_ID = "9d5e4b1a-2d3e-4f6a-9b0c-1d2e3f4a5b6c"
OLD_URL = "https://yhidrktnkfwvxoxetnob.supabase.co/storage/v1/object/sign/uploads/team/gildaspp.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNjYzYTUxZC00Y2QzLTQ2OGItOGZmYi0zODk2YThhNWM1ZjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1cGxvYWRzL3RlYW0vZ2lsZGFzcHAucG5nIiwiaWF0IjoxNzc4NTE5MTgwLCJleHAiOjgwODU3MTkxODB9.KTwHQMbpkn_A9_99_MbrHV9LswYM2ptXmlc-l1gis-Q"
NEW_URL = "https://yhidrktnkfwvxoxetnob.supabase.co/storage/v1/object/sign/uploads/team/gildas.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNjYzYTUxZC00Y2QzLTQ2OGItOGZmYi0zODk2YThhNWM1ZjQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1cGxvYWRzL3RlYW0vZ2lsZGFzLnBuZyIsImlhdCI6MTc3ODUyMDIyNCwiZXhwIjo4MDg1NzIwMjI0fQ.Au_I9SNU-WE_qG0opuESxZJJ_NGyM_p3DB3kPdyAKNI"


def upgrade() -> None:
    op.execute(
        f"UPDATE team_members SET avatar_url = '{NEW_URL}' WHERE id = '{COFOUNDER_GILDAS_ID}'"
    )


def downgrade() -> None:
    op.execute(
        f"UPDATE team_members SET avatar_url = '{OLD_URL}' WHERE id = '{COFOUNDER_GILDAS_ID}'"
    )
