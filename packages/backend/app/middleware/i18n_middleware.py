"""
Ganitel V2 Backend - i18n Middleware
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.infrastructure.services.i18n_service import I18nService


class I18nMiddleware(BaseHTTPMiddleware):
    """Middleware for internationalization"""

    async def dispatch(self, request: Request, call_next):
        # Get language from header or query param
        language = request.headers.get("Accept-Language", "fr")
        if "," in language:
            language = language.split(",")[0].split("-")[0]

        # Also check query param
        language = request.query_params.get("lang", language)

        # Validate language
        if language not in I18nService.SUPPORTED_LANGUAGES:
            language = I18nService.DEFAULT_LANGUAGE

        # Store language in request state
        request.state.language = language

        response = await call_next(request)
        return response

