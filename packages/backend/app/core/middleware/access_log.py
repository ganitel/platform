"""HTTP access log middleware.

Emits one structured log line per request, after the response is sent, with:
- method, path, route_template, status, duration_ms, client_ip, user_agent
- log level chosen by status (2xx/3xx → info, 4xx → warning, 5xx → error)
- request_id is already in structlog contextvars from RequestIdMiddleware

Skips configurable paths (default: /api/health) to avoid spamming logs from
load balancer probes.

Place this AFTER `RequestIdMiddleware` so log lines include request_id:

    app.add_middleware(AccessLogMiddleware)
    app.add_middleware(RequestIdMiddleware)

Starlette/FastAPI applies middleware in *reverse* registration order; the
last `add_middleware` call runs first on the request path.
"""

import time
from collections.abc import Iterable
from typing import Any

import structlog
from starlette.types import ASGIApp, Message, Receive, Scope, Send

DEFAULT_SKIP_PATHS: frozenset[str] = frozenset({"/health", "/api/health"})

log = structlog.stdlib.get_logger("http")


class AccessLogMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        *,
        skip_paths: Iterable[str] = DEFAULT_SKIP_PATHS,
    ) -> None:
        self.app = app
        self._skip = frozenset(skip_paths)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path: str = scope.get("path", "")
        if path in self._skip:
            await self.app(scope, receive, send)
            return

        start = time.perf_counter()
        status_holder: dict[str, int] = {"status": 0}

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                status_holder["status"] = int(message.get("status", 0))
            await send(message)

        error: BaseException | None = None
        try:
            await self.app(scope, receive, send_wrapper)
        except BaseException as exc:
            error = exc
            raise
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            status = status_holder["status"] or (500 if error else 0)

            payload: dict[str, Any] = {
                "method": scope.get("method", ""),
                "path": path,
                "route": _route_template(scope),
                "status": status,
                "duration_ms": duration_ms,
                "client_ip": _client_ip(scope),
                "user_agent": _header(scope, b"user-agent"),
                "query": scope.get("query_string", b"").decode("latin-1") or None,
            }

            if error is not None:
                log.error("http.request", **payload, exc_info=error)
            elif status >= 500:
                log.error("http.request", **payload)
            elif status >= 400:
                log.warning("http.request", **payload)
            else:
                log.info("http.request", **payload)


def _header(scope: Scope, name: bytes) -> str | None:
    for k, v in scope.get("headers", []):
        if k == name:
            return v.decode("latin-1")
    return None


def _client_ip(scope: Scope) -> str | None:
    forwarded = _header(scope, b"x-forwarded-for")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    client = scope.get("client")
    if client:
        return client[0]
    return None


def _route_template(scope: Scope) -> str | None:
    """Resolved FastAPI route path with `{param}` placeholders, e.g.
    `/api/properties/{property_id}`. Useful for log aggregation —
    grouping by template instead of by concrete URL."""
    route = scope.get("route")
    return getattr(route, "path", None)
