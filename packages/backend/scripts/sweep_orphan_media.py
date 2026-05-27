"""Delete unattached draft media older than the threshold (default 24h).

Targets draft `media` rows that are older than `--max-age-hours` and are
not referenced by listings, including video poster images referenced by
attached listing videos.

Run nightly via systemd/cron:

    uv run python -m scripts.sweep_orphan_media
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

import typer
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.storage import s3_client
from app.modules.media.service import unattached_draft_media_query

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
                    unattached_draft_media_query(
                        older_than=cutoff,
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
