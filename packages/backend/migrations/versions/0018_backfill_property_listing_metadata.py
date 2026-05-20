"""backfill property listing metadata from legacy amenities

Revision ID: 0018_backfill_property_listing_metadata
Revises: 0017_property_house_rule_fields
Create Date: 2026-05-20
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0018_backfill_property_listing_metadata"
down_revision: str | Sequence[str] | None = "0017_property_house_rule_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE properties
        SET parking_available = 'free'::parking_availability
        WHERE parking_available = 'none'::parking_availability
          AND amenities @> ARRAY['free_parking']::varchar[]
        """
    )
    op.execute(
        """
        UPDATE properties
        SET parking_available = 'paid'::parking_availability
        WHERE parking_available = 'none'::parking_availability
          AND amenities @> ARRAY['paid_parking']::varchar[]
        """
    )
    op.execute(
        """
        UPDATE properties
        SET kitchen_type = 'full'::kitchen_type
        WHERE kitchen_type = 'none'::kitchen_type
          AND amenities && ARRAY['kitchen', 'stove']::varchar[]
        """
    )
    op.execute(
        """
        UPDATE properties
        SET kitchen_type = 'kitchenette'::kitchen_type
        WHERE kitchen_type = 'none'::kitchen_type
          AND amenities && ARRAY['fridge', 'microwave']::varchar[]
        """
    )
    op.execute(
        """
        UPDATE properties
        SET pets_allowed = true
        WHERE pets_allowed = false
          AND amenities && ARRAY['pets_allowed', 'pet_friendly']::varchar[]
        """
    )
    op.execute(
        """
        UPDATE properties
        SET smoking_allowed = true
        WHERE smoking_allowed = false
          AND amenities && ARRAY['smoking_allowed', 'allows_smoking']::varchar[]
        """
    )


def downgrade() -> None:
    # The legacy amenity values remain on the row, so the data backfill is intentionally irreversible.
    pass
