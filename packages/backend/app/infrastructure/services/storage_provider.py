"""
Ganitel V2 Backend - Storage Provider Abstraction
"""
import os
import re
from abc import ABC, abstractmethod
from pathlib import Path

import aioboto3
from botocore.config import Config

from app.config import get_settings

settings = get_settings()


SAFE_DIRECTORY_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
SAFE_FILENAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


def _sanitize_subdirectory(subdirectory: str) -> str:
    if not isinstance(subdirectory, str):
        raise ValueError("Invalid subdirectory")

    raw_value = subdirectory.strip()
    if raw_value.startswith(("/", "\\")):
        raise ValueError("Invalid subdirectory")

    if re.match(r"^[A-Za-z]:[\\/]", raw_value):
        raise ValueError("Invalid subdirectory")

    normalized = raw_value.replace("\\", "/").strip("/")
    if not normalized:
        raise ValueError("Invalid subdirectory")

    basename = os.path.basename(normalized)
    if basename != normalized or basename in {".", ".."}:
        raise ValueError("Invalid subdirectory")

    if not SAFE_DIRECTORY_PATTERN.fullmatch(basename):
        raise ValueError("Invalid subdirectory")

    return basename


def _sanitize_filename(filename: str) -> str:
    if not isinstance(filename, str):
        raise ValueError("Invalid filename")

    normalized = filename.replace("\\", "/").strip()
    if not normalized:
        raise ValueError("Invalid filename")

    basename = os.path.basename(normalized)
    if basename != normalized or basename in {".", ".."}:
        raise ValueError("Invalid filename")

    if not SAFE_FILENAME_PATTERN.fullmatch(basename):
        raise ValueError("Invalid filename")

    return basename


def _resolve_within_base(base_dir: Path, *parts: str) -> Path:
    base_resolved = base_dir.resolve()
    candidate = base_resolved.joinpath(*parts).resolve()

    try:
        candidate.relative_to(base_resolved)
    except ValueError as exc:
        raise ValueError("Invalid storage path") from exc

    return candidate

class StorageProvider(ABC):
    """Abstract base class for storage providers"""

    @abstractmethod
    async def upload_file(self, file_content: bytes, filename: str, subdirectory: str) -> str:
        """Upload a file and return its URL or path"""
        pass

    @abstractmethod
    async def delete_file(self, file_path_or_url: str) -> bool:
        """Delete a file from storage"""
        pass


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage provider"""

    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def upload_file(self, file_content: bytes, filename: str, subdirectory: str) -> str:
        safe_subdirectory = _sanitize_subdirectory(subdirectory)
        safe_filename = _sanitize_filename(filename)

        dest_dir = _resolve_within_base(self.upload_dir, safe_subdirectory)
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = _resolve_within_base(self.upload_dir, safe_subdirectory, safe_filename)

        with open(dest_path, "wb") as f:
            f.write(file_content)

        return f"/uploads/{safe_subdirectory}/{safe_filename}"

    async def delete_file(self, file_path: str) -> bool:
        # Expected format: /uploads/subdirectory/filename
        if not file_path.startswith("/uploads/"):
            return False

        rel_path = file_path.removeprefix("/uploads/").strip("/")
        if "/" not in rel_path:
            return False

        subdirectory, filename = rel_path.rsplit("/", 1)

        try:
            safe_subdirectory = _sanitize_subdirectory(subdirectory)
            safe_filename = _sanitize_filename(filename)
            full_path = _resolve_within_base(self.upload_dir, safe_subdirectory, safe_filename)
        except ValueError:
            return False

        if full_path.exists() and full_path.is_file():
            full_path.unlink()
            return True
        return False


class R2StorageProvider(StorageProvider):
    """Cloudflare R2 storage provider (S3 compatible)"""

    def __init__(self):
        self.session = aioboto3.Session()
        self.bucket_name = settings.R2_BUCKET_NAME
        self.public_url = settings.R2_PUBLIC_URL.rstrip("/")

        # Build endpoint URL if not provided
        self.endpoint_url = settings.R2_ENDPOINT_URL
        if not self.endpoint_url and settings.R2_ACCOUNT_ID:
            self.endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    async def upload_file(self, file_content: bytes, filename: str, subdirectory: str) -> str:
        safe_subdirectory = _sanitize_subdirectory(subdirectory)
        safe_filename = _sanitize_filename(filename)
        key = f"{safe_subdirectory}/{safe_filename}"

        async with self.session.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4')
        ) as s3:
            await s3.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_content,
                # ACL='public-read' is not always supported/needed on R2 if bucket is public
            )

        return f"{self.public_url}/{key}"

    async def delete_file(self, file_url: str) -> bool:
        # Extract key from URL
        if not file_url.startswith(self.public_url):
            return False

        key = file_url.replace(f"{self.public_url}/", "")

        async with self.session.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4')
        ) as s3:
            try:
                await s3.delete_object(Bucket=self.bucket_name, Key=key)
                return True
            except Exception:
                return False


def get_storage_provider() -> StorageProvider:
    """Factory to get the configured storage provider"""
    if settings.STORAGE_TYPE == "r2":
        return R2StorageProvider()
    return LocalStorageProvider(upload_dir=settings.UPLOAD_DIR)
