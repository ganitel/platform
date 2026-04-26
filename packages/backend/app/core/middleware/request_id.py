"""Per-request `X-Request-ID` propagation.

Reads or mints the header on the way in, echoes it on the response,
and binds it into structlog's contextvars so every log line emitted
inside the request scope carries `request_id` automatically."""

from uuid import uuid4

import structlog
from starlette.types import ASGIApp, Message, Receive, Scope, Send

HEADER = b"x-request-id"


class RequestIdMiddleware:
    """Read or mint an `X-Request-ID`, echo it on the response, and bind it
    into structlog's contextvars so every log line in this request's scope
    carries `request_id` automatically."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        incoming = next((v for k, v in scope.get("headers", []) if k == HEADER), None)
        rid = incoming.decode("latin-1") if incoming else uuid4().hex

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=rid)

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((HEADER, rid.encode("latin-1")))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            structlog.contextvars.clear_contextvars()
