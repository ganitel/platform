"""
Ganitel V2 Backend - File Upload Service
"""
import uuid
from pathlib import Path
from typing import Any

from fastapi import UploadFile

from app.config import get_settings
from app.infrastructure.services.storage_provider import get_storage_provider

settings = get_settings()


class UploadService:
    """Service for handling file uploads using storage providers"""

    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    ALLOWED_VIDEO_TYPES = {"video/mp4", "video/mpeg", "video/quicktime"}
    MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE

    @classmethod
    async def validate_file(cls, file: UploadFile, allowed_types: set) -> bytes:
        """
        Validate file type and size

        Returns:
            bytes: File contents
        """
        if file.content_type not in allowed_types:
            raise ValueError(f"Invalid file type. Allowed: {', '.join(allowed_types)}")

        contents = await file.read()
        if len(contents) > cls.MAX_FILE_SIZE:
             # Reset file pointer for potential future reads if needed,
             # though we return contents here.
            await file.seek(0)
            raise ValueError(f"File size exceeds {cls.MAX_FILE_SIZE / (1024 * 1024):.1f}MB")

        return contents

    @classmethod
    async def upload_image(
        cls,
        file: UploadFile,
        subdirectory: str = "images",
        prefix: str = ""
    ) -> dict:
        """
        Upload an image file using the configured storage provider
        """
        contents = await cls.validate_file(file, cls.ALLOWED_IMAGE_TYPES)

        # Generate unique filename
        file_extension = Path(file.filename).suffix.lower()
        if not file_extension:
            # Fallback based on content type
            ext_map = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
                "image/jpg": ".jpg"
            }
            file_extension = ext_map.get(file.content_type, ".bin")

        unique_filename = f"{prefix}{uuid.uuid4()}{file_extension}"

        # Use storage provider
        storage = get_storage_provider()
        url_or_path = await storage.upload_file(contents, unique_filename, subdirectory)

        return {
            "url": url_or_path,
            "filename": unique_filename,
            "size": len(contents),
            "content_type": file.content_type
        }

    @classmethod
    async def upload_multiple_images(
        cls,
        files: list[UploadFile],
        subdirectory: str = "images",
        prefix: str = ""
    ) -> list[dict[str, Any]]:
        """Upload multiple image files, handling exceptions per file"""
        results = []
        for file in files:
            try:
                result = await cls.upload_image(file, subdirectory, prefix)
                results.append({
                    "file": file.filename,
                    "result": result,
                    "error": None
                })
            except Exception as exc:
                # Log the error, keep going with other files
                results.append({
                    "file": file.filename,
                    "result": None,
                    "error": str(exc)
                })
                # Optional: logger.exception("Failed to upload %s", file.filename)
        return results

    @classmethod
    async def delete_file(cls, file_path_or_url: str) -> bool:
        """Delete a file using the configured storage provider"""
        storage = get_storage_provider()
        return await storage.delete_file(file_path_or_url)
