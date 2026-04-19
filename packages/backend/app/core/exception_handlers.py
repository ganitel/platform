"""
Ganitel V2 Backend - Global Exception Handlers
"""
import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.exceptions import GanitelException

logger = logging.getLogger(__name__)


def _request_id_from(request: Request) -> str:
    return request.headers.get("X-Request-ID") or str(uuid4())


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(GanitelException)
    async def ganitel_exception_handler(request: Request, exc: GanitelException):
        request_id = _request_id_from(request)
        log_payload = {
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "error_code": exc.__class__.__name__,
            "status_code": exc.status_code,
        }

        if exc.status_code >= 500:
            logger.error("Handled GanitelException", extra=log_payload)
        else:
            logger.warning("Handled GanitelException", extra=log_payload)

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message,
                "error_code": exc.__class__.__name__,
                "request_id": request_id,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        request_id = _request_id_from(request)
        logger.exception(
            "Unhandled server exception",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "error_type": exc.__class__.__name__,
            },
        )

        return JSONResponse(
            status_code=500,
            content={
                "detail": "An internal error occurred",
                "error_code": "InternalServerError",
                "request_id": request_id,
            },
        )
