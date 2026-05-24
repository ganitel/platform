"""S3-compatible object storage — AWS S3, Supabase Storage (S3 protocol), Cloudflare R2, or MinIO.

Supabase expects path-style addressing and SigV4; we set ``addressing_style: path`` accordingly.
We never proxy file bytes through the backend. Frontend gets a presigned PUT URL,
uploads directly. On read we return a presigned GET URL (keys that are already ``http(s)`` URLs are returned as-is).
"""

from contextlib import asynccontextmanager
from typing import Any, Literal
from urllib.parse import urlencode

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


async def upload_object(*, key: str, body: bytes, content_type: str) -> None:
    """Server-side upload. Used when the client can't presign — e.g. an
    unauthenticated form submission where the backend mints the key and
    streams the file straight into the bucket."""
    s = get_settings()
    async with s3_client() as client:
        await client.put_object(
            Bucket=s.S3_BUCKET,
            Key=key,
            Body=body,
            ContentType=content_type,
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


def public_url(key: str) -> str:
    """Return the permanent public URL for an object in the public Supabase bucket.

    Keys that already look like absolute URLs (seed/demo data) are returned verbatim.
    """
    if key.startswith(("http://", "https://")):
        return key
    s = get_settings()
    if not s.SUPABASE_PROJECT_URL:
        raise RuntimeError("SUPABASE_PROJECT_URL is not configured")
    return f"{s.SUPABASE_PROJECT_URL.rstrip('/')}/storage/v1/object/public/{s.S3_BUCKET}/{key}"


def image_transform_url(
    key: str,
    *,
    width: int | None = None,
    height: int | None = None,
    quality: int | None = None,
    fmt: Literal["webp", "avif"] | None = None,
) -> str:
    """Build a Supabase image transformation URL. Falls back to `public_url`
    when SUPABASE_IMAGE_TRANSFORMS_ENABLED is false (e.g. the free plan).

    Callers always pass the variant they want; flipping the flag activates
    real transforms without any call-site changes.
    """
    s = get_settings()
    if not s.SUPABASE_IMAGE_TRANSFORMS_ENABLED:
        return public_url(key)
    if key.startswith(("http://", "https://")):
        return key
    if not s.SUPABASE_PROJECT_URL:
        raise RuntimeError("SUPABASE_PROJECT_URL is not configured")
    params: dict[str, str] = {}
    if width is not None:
        params["width"] = str(width)
    if height is not None:
        params["height"] = str(height)
    if quality is not None:
        params["quality"] = str(quality)
    if fmt is not None:
        params["format"] = fmt
    base = (
        f"{s.SUPABASE_PROJECT_URL.rstrip('/')}/storage/v1/render/image/public/{s.S3_BUCKET}/{key}"
    )
    return f"{base}?{urlencode(params)}" if params else base


async def ensure_bucket_exists() -> None:
    """Idempotent — creates the bucket if it doesn't exist. Used in dev startup.

    Only a 404 ("NoSuchBucket") is treated as missing. Anything else
    (403 / permission denied, transient 5xx) is re-raised so misconfiguration
    surfaces loudly.
    """
    from botocore.exceptions import ClientError

    s = get_settings()
    async with s3_client() as client:
        try:
            await client.head_bucket(Bucket=s.S3_BUCKET)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code")
            if code not in {"404", "NoSuchBucket"}:
                raise
            await client.create_bucket(Bucket=s.S3_BUCKET)
