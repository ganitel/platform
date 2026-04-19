"""
Ganitel V2 Backend - OAuth temporary exchange code utilities
"""
import json
import secrets
from typing import Dict

import redis


OAUTH_EXCHANGE_KEY_PREFIX = "oauth_exchange_code"
OAUTH_EXCHANGE_TTL_SECONDS = 60


def _build_exchange_key(code: str) -> str:
    return f"{OAUTH_EXCHANGE_KEY_PREFIX}:{code}"


def create_oauth_exchange_code(
    redis_client: redis.Redis,
    user_id: str,
    provider: str,
    ttl_seconds: int = OAUTH_EXCHANGE_TTL_SECONDS,
) -> str:
    """Create a short-lived one-time OAuth exchange code in Redis."""
    code = secrets.token_urlsafe(32)
    payload = {
        "user_id": user_id,
        "provider": provider,
    }
    redis_client.setex(_build_exchange_key(code), ttl_seconds, json.dumps(payload))
    return code


def consume_oauth_exchange_code(redis_client: redis.Redis, code: str) -> Dict[str, str]:
    """Consume a one-time OAuth exchange code and return associated payload."""
    key = _build_exchange_key(code)

    if hasattr(redis_client, "getdel"):
        raw_payload = redis_client.getdel(key)
    else:
        raw_payload = redis_client.get(key)
        if raw_payload:
            redis_client.delete(key)

    if not raw_payload:
        raise ValueError("Invalid or expired OAuth exchange code")

    try:
        payload = json.loads(raw_payload)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid OAuth exchange payload") from exc

    if not payload.get("user_id") or not payload.get("provider"):
        raise ValueError("Incomplete OAuth exchange payload")

    return payload
