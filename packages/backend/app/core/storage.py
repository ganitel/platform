"""S3-compatible object storage — AWS S3, Supabase Storage (S3 protocol), Cloudflare R2, or MinIO.

Supabase expects path-style addressing and SigV4; we set ``addressing_style: path`` accordingly.
We never proxy file bytes through the backend. Frontend gets a presigned PUT URL,
uploads directly. On read we return a presigned GET URL (keys that are already ``http(s)`` URLs are returned as-is).
"""

from contextlib import asynccontextmanager
from typing import Any

import aioboto3
from botocore.config import Config

from app.core.config import Settings, get_settings


def _client_kwargs(s: Settings) -> dict[str, Any]:
    cfg = Config(signature_version="s3v4", s3={"addressing_style": "path"})
    return {
        "endpoint_url": s.S3_ENDPOINT_URL,
        "region_name": s.S3_REGION,
        "aws_access_key_id": s.S3_ACCESS_KEY_ID,
        "aws_secret_access_key": s.S3_SECRET_ACCESS_KEY,
        "config": cfg,
    }


@asynccontextmanager
async def s3_client():
    s = get_settings()
    session = aioboto3.Session()
    async with session.client("s3", **_client_kwargs(s)) as client:
        yield client


async def presign_put(*, key: str, content_type: str) -> str:
    s = get_settings()
    async with s3_client() as client:
        return await client.generate_presigned_url(
            "put_object",
            Params={"Bucket": s.S3_BUCKET, "Key": key, "ContentType": content_type},
            ExpiresIn=s.MEDIA_PUT_URL_TTL_SECONDS,
        )


async def public_or_signed_url(key: str) -> str:
    # Seed/demo escape hatch: if `key` is already a full URL, return it verbatim.
    # Real S3 keys never start with `http://` or `https://`, so this is safe in prod.
    if key.startswith(("http://", "https://")):
        return key
    s = get_settings()

    async with s3_client() as client:
        return await client.generate_presigned_url(
            "get_object",
            Params={"Bucket": s.S3_BUCKET, "Key": key},
            ExpiresIn=s.MEDIA_GET_URL_TTL_SECONDS,
        )


async def ensure_bucket_exists() -> None:
    """Idempotent — creates the bucket if missing. Used in dev startup."""
    s = get_settings()
    async with s3_client() as client:
        try:
            await client.head_bucket(Bucket=s.S3_BUCKET)
        except client.exceptions.ClientError:
            await client.create_bucket(Bucket=s.S3_BUCKET)
