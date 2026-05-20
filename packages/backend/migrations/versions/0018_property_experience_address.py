"""add optional address column to properties and experiences

Revision ID: 0018_property_experience_address
Revises: 0017_property_house_rule_fields
Create Date: 2026-05-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0018_property_experience_address"
down_revision: str | Sequence[str] | None = "0017_property_house_rule_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("address", sa.String(length=300), nullable=True))
    op.add_column("experiences", sa.Column("address", sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column("experiences", "address")
    op.drop_column("properties", "address")
