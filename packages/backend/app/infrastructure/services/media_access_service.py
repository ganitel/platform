"""Media access authorization and resolution service."""

from pathlib import Path
from typing import Any
from urllib.parse import quote

from sqlalchemy.orm import Session

from app.config import get_settings
from app.domain.entities.property import Property
from app.domain.entities.service import Service, ServiceStatus
from app.domain.entities.user import User, UserType

settings = get_settings()


class MediaAccessService:
    """Resolve media access mode (stream/redirect) after authorization checks."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def build_access_url(file_ref: str) -> str:
        """Build controlled API URL for frontend migration from legacy raw file URLs."""
        return f"/api/v1/upload/download?file_ref={quote(file_ref, safe='')}"

    @staticmethod
    def _normalize_local_ref(file_ref: str) -> str:
        if not isinstance(file_ref, str):
            raise ValueError("Invalid file reference")

        value = file_ref.strip()
        if not value:
            raise ValueError("Invalid file reference")

        if value.startswith("uploads/"):
            value = f"/{value}"

        if not value.startswith("/uploads/"):
            raise ValueError("Invalid file reference")

        rel_path = value.removeprefix("/uploads/").strip("/")
        parts = rel_path.split("/")
        if len(parts) != 2:
            raise ValueError("Invalid file reference")

        subdirectory, filename = parts
        if not subdirectory or not filename:
            raise ValueError("Invalid file reference")

        if ".." in subdirectory or ".." in filename:
            raise ValueError("Invalid file reference")

        return f"/uploads/{subdirectory}/{filename}"

    def _is_authorized_for_file_ref(self, file_ref: str, requester: User) -> bool:
        if requester.user_type == UserType.ADMIN.value:
            return True

        if requester.profile_picture == file_ref:
            return True

        service = (
            self.db.query(Service)
            .filter(Service.deleted_at.is_(None), Service.images.any(file_ref))  # ty: ignore[invalid-argument-type]
            .first()
        )
        if service is not None:
            if service.status == ServiceStatus.ACTIVE.value:
                return True
            return service.provider_id == requester.id

        prop = (
            self.db.query(Property)
            .filter(Property.deleted_at.is_(None), Property.images.any(file_ref))  # ty: ignore[invalid-argument-type]
            .first()
        )
        if prop is not None:
            return prop.provider_id == requester.id

        return False

    def resolve_download(self, *, file_ref: str, requester: User) -> dict[str, Any]:
        """Resolve secure media download mode for the provided file reference."""
        normalized_ref = self._normalize_local_ref(file_ref)

        if not self._is_authorized_for_file_ref(normalized_ref, requester):
            raise PermissionError("Access denied")

        rel_path = normalized_ref.removeprefix("/uploads/")
        full_path = (Path(settings.UPLOAD_DIR) / rel_path).resolve()

        base_dir = Path(settings.UPLOAD_DIR).resolve()
        try:
            full_path.relative_to(base_dir)
        except ValueError as exc:
            raise ValueError("Invalid file reference") from exc

        if not full_path.exists() or not full_path.is_file():
            raise FileNotFoundError("File not found")

        return {
            "mode": "stream",
            "path": str(full_path),
            "filename": full_path.name,
            "file_ref": normalized_ref,
        }
