"""RFC 7807 Problem Details exception model + FastAPI handlers."""

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse


class AppError(Exception):
    status_code: int = 500
    code: str = "internal"

    def __init__(
        self,
        detail: str = "",
        *,
        code: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(detail)
        if code is not None:
            self.code = code
        self.detail = detail or self.code
        self.extra = extra or {}


class AuthError(AppError):
    status_code = 401
    code = "auth.invalid"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class ValidationError(AppError):
    status_code = 422
    code = "validation_failed"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"


def _problem(
    *, status: int, code: str, detail: str, extra: dict[str, Any] | None = None
) -> JSONResponse:
    body: dict[str, Any] = {
        "type": f"about:blank#{code}",
        "title": code,
        "status": status,
        "detail": detail,
    }
    if extra:
        body["extra"] = extra
    return JSONResponse(status_code=status, content=body, media_type="application/problem+json")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return _problem(
            status=exc.status_code, code=exc.code, detail=exc.detail, extra=exc.extra or None
        )

    @app.exception_handler(HTTPException)
    async def _http(_: Request, exc: HTTPException) -> JSONResponse:
        return _problem(
            status=exc.status_code, code=f"http.{exc.status_code}", detail=str(exc.detail)
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        return _problem(
            status=422,
            code="validation_failed",
            detail="request validation failed",
            extra={"errors": exc.errors()},
        )

    @app.exception_handler(IntegrityError)
    async def _integrity(_: Request, exc: IntegrityError) -> JSONResponse:
        return _problem(
            status=409,
            code="conflict",
            detail="database constraint violation",
            extra={"sqlstate": getattr(exc.orig, "sqlstate", None)},
        )
