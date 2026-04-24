"""
Ganitel V2 Backend - File Upload Endpoints
"""
import logging
import mimetypes
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.domain.entities.user import User
from app.infrastructure.services.media_access_service import MediaAccessService
from app.infrastructure.services.upload_service import UploadService

router = APIRouter(prefix="/upload", tags=["upload"])
logger = logging.getLogger(__name__)


@router.post("/image", response_model=dict)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    subdirectory: str = "images",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload a single image"""
    try:
        result = await UploadService.upload_image(
            file=file,
            subdirectory=subdirectory,
            prefix=f"user_{current_user.id}_"
        )
        return {
            "message": "Image uploaded successfully",
            "url": result["url"],
            "file_ref": result["url"],
            "access_url": MediaAccessService.build_access_url(result["url"]),
            "filename": result["filename"],
            "size": result["size"]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception:
        logger.exception(
            "Unhandled image upload error",
            extra={"user_id": str(current_user.id), "subdirectory": subdirectory},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image",
        )


@router.post("/images", response_model=dict)
async def upload_multiple_images(
    request: Request,
    files: list[UploadFile] = File(...),
    subdirectory: str = "images",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload multiple images"""
    try:
        results = await UploadService.upload_multiple_images(
            files=files,
            subdirectory=subdirectory,
            prefix=f"user_{current_user.id}_"
        )
        return {
            "message": f"{len(results)} images uploaded successfully",
            "files": [
                {
                    "url": r["url"],
                    "file_ref": r["url"],
                    "access_url": MediaAccessService.build_access_url(r["url"]),
                    "filename": r["filename"],
                    "size": r["size"]
                }
                for r in results
            ]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception:
        logger.exception(
            "Unhandled multiple-image upload error",
            extra={"user_id": str(current_user.id), "subdirectory": subdirectory},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload images",
        )


@router.get("/download")
async def download_file(
    request: Request,
    file_ref: str = Query(..., description="Stored file reference such as /uploads/images/file.jpg"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Download a file through controlled auth and authorization checks."""
    media_service = MediaAccessService(db)

    try:
        resolved = media_service.resolve_download(file_ref=file_ref, requester=current_user)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file reference",
        )
    except PermissionError:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        logger.warning(
            "Denied media download access",
            extra={
                "request_id": request_id,
                "user_id": str(current_user.id),
                "file_ref": file_ref,
                "path": request.url.path,
                "method": request.method,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    except Exception:
        logger.exception(
            "Unhandled controlled media download error",
            extra={"user_id": str(current_user.id), "file_ref": file_ref},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download file",
        )

    media_type = mimetypes.guess_type(resolved["filename"])[0] or "application/octet-stream"
    return FileResponse(path=resolved["path"], media_type=media_type, filename=resolved["filename"])

