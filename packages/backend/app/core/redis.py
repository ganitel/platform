"""Async Redis client factory + lifespan-managed pool.

Used for ephemeral state: rate limit counters, idempotency keys,
short-lived booking holds. Persistence lives in Postgres."""

from redis.asyncio import Redis

from app.core.config import get_settings

_redis: Redis | None = None


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis.from_url(
            str(get_settings().REDIS_URL),
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
