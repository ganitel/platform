"""Idempotency-Key handling for state-change endpoints.

Clients send `Idempotency-Key: <random>`. The backend stores the response
keyed by (user_id, key). Within the TTL, replays return the cached response.

Scope: same user only — keys cannot be reused across users. This is the
24-hour cache. Re-using a key for a *different* request body silently
returns the old response (caller's bug). Tighten later if needed.
"""

import json
import logging
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.idempotency.models import IdempotencyRecord

logger = logging.getLogger(__name__)
TTL = timedelta(hours=24)


async def replay_or_run(
    session: AsyncSession,
    *,
    user_id: UUID,
    key: str | None,
    fn: Callable[[], Awaitable[Any]],
    serialize: Callable[[Any], dict] | None = None,
) -> Any:
    """If `key` is None, just runs `fn`. Otherwise looks up cached response or runs+caches."""
    if not key:
        return await fn()

    existing = (
        await session.execute(
            select(IdempotencyRecord).where(
                IdempotencyRecord.key == key,
                IdempotencyRecord.user_id == user_id,
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        if existing.expires_at > datetime.now(UTC):
            return JSONResponse(
                status_code=existing.response_status,
                content=json.loads(existing.response_body),
            )
        # expired — drop and re-run
        await session.delete(existing)
        await session.flush()

    result = await fn()

    body = serialize(result) if serialize else _default_serialize(result)
    record = IdempotencyRecord(
        key=key,
        user_id=user_id,
        response_status=200,
        response_body=json.dumps(body, default=str),
        expires_at=datetime.now(UTC) + TTL,
    )
    session.add(record)
    await session.commit()
    return result


def _default_serialize(result: Any) -> dict:
    if hasattr(result, "model_dump"):
        return result.model_dump(mode="json")
    if isinstance(result, dict):
        return result
    return {"data": str(result)}
