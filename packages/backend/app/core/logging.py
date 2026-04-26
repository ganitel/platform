"""Structured logging via structlog.

Two output modes:
- debug=True  → pretty, colored, key=value (for local dev)
- debug=False → single-line JSON (for prod aggregators: Loki, Datadog, etc.)

stdlib loggers (uvicorn, sqlalchemy, …) are routed through the same processor
chain so all log lines look the same regardless of source.

Use it from a module:

    from app.core.logging import get_logger
    log = get_logger(__name__)
    log.info("user.created", user_id=u.id)

Bind per-request context (request_id, user_id, …) anywhere via:

    import structlog
    structlog.contextvars.bind_contextvars(user_id=str(u.id))

The `RequestIdMiddleware` already binds `request_id` for every HTTP request,
so it appears on every log line in the request's scope automatically.
"""

import logging
import sys
from typing import Any

import orjson
import structlog
from structlog.types import EventDict, Processor


def _orjson_dumps(obj: Any, default: Any) -> str:
    return orjson.dumps(obj, default=default).decode()


def _drop_color_message(_logger: Any, _name: str, event_dict: EventDict) -> EventDict:
    """uvicorn duplicates `event` into `color_message`; strip the dupe."""
    event_dict.pop("color_message", None)
    return event_dict


def configure_logging(*, debug: bool) -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.ExtraAdder(),
        _drop_color_message,
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if debug:
        renderer: Processor = structlog.dev.ConsoleRenderer(colors=True, sort_keys=False)
    else:
        renderer = structlog.processors.JSONRenderer(serializer=_orjson_dumps)

    # structlog → stdlib bridge: structlog hands a dict to ProcessorFormatter,
    # which then runs the renderer. This lets uvicorn/sqlalchemy logs share
    # the same pipeline as our own structlog calls.
    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.DEBUG if debug else logging.INFO)

    for noisy in ("uvicorn.access", "sqlalchemy.engine.Engine"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.stdlib.get_logger(name)
