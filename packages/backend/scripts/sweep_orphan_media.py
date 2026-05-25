"""Delete unattached draft media older than the threshold (default 24h).

Targets `media` rows where `draft_id IS NOT NULL`, no `property_media`
or `experience_media` row references the media id, no listing-attached
media row uses it as a poster, and `created_at` is older than
`--max-age-hours`.

Run nightly via systemd/cron:

    uv run python -m scripts.sweep_orphan_media
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

import typer
from sqlalchemy import delete, exists, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.storage import s3_client
from app.modules.experiences.models import ExperienceMediaItem
from app.modules.media.models import Media
from app.modules.media.service import _referenced_by_attached_media
from app.modules.properties.models import PropertyMediaItem

logger = logging.getLogger("sweep_orphan_media")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")


async def _delete_orphans(max_age_hours: int) -> int:
    s = get_settings()
    engine = create_async_engine(str(s.DATABASE_URL))
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    cutoff = datetime.now(UTC) - timedelta(hours=max_age_hours)

    async with session_factory() as session:
        rows = (
            (
                await session.execute(
                    select(Media).where(
                        Media.draft_id.is_not(None),
                        Media.created_at < cutoff,
                        ~exists().where(PropertyMediaItem.media_id == Media.id),
                        ~exists().where(ExperienceMediaItem.media_id == Media.id),
                        ~_referenced_by_attached_media(),
                    )
                )
            )
            .scalars()
            .all()
        )

        if not rows:
            logger.info("no orphans found")
            return 0

        ids: list[UUID] = [m.id for m in rows]
        keys = [m.key for m in rows]

        async with s3_client() as client:
            for batch_start in range(0, len(keys), 1000):
                batch = keys[batch_start : batch_start + 1000]
                await client.delete_objects(
                    Bucket=s.S3_BUCKET,
                    Delete={"Objects": [{"Key": k} for k in batch]},
                )

        await session.execute(delete(Media).where(Media.id.in_(ids)))
        await session.commit()

    await engine.dispose()
    logger.info("deleted %d orphan media rows", len(rows))
    return len(rows)


app = typer.Typer(add_completion=False)


@app.command()
def main(max_age_hours: int = 24) -> None:
    """Sweep orphaned draft media."""
    asyncio.run(_delete_orphans(max_age_hours))


if __name__ == "__main__":
    app()
