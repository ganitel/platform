"""API router aggregation: mounts each module's routes under a
single `api_router` that `app.main` includes at the `/api` prefix."""

from app.api.router import api_router

__all__ = ["api_router"]
