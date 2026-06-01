"""Integration tests run against a real Postgres.

Each session creates a fresh database named `ganitel_test_<short-uuid>`
on the local Postgres, runs alembic upgrade head against it, and yields
an AsyncSession. The database is dropped at session teardown.

Required env: GANITEL_TEST_DATABASE_URL pointing at a Postgres
superuser-capable connection. Defaults to the local docker compose DB.

These tests are marked `integration` — run with `-m integration` or
`uv run pytest tests/integration`.
"""

from __future__ import annotations

import os
import threading
from collections.abc import AsyncGenerator
from uuid import uuid4

import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

_DEFAULT_LOCAL_URL = "postgresql+asyncpg://ganitel:ganitel@localhost:5432/ganitel"


def _base_url() -> str:
    return os.environ.get("GANITEL_TEST_DATABASE_URL", _DEFAULT_LOCAL_URL)


def _admin_url() -> str:
    return _base_url().rsplit("/", 1)[0] + "/postgres"


def _per_session_url(db_name: str) -> str:
    return _base_url().rsplit("/", 1)[0] + f"/{db_name}"


@pytest_asyncio.fixture(scope="session")
async def integration_engine() -> AsyncGenerator[AsyncEngine, None]:
    db_name = f"ganitel_test_{uuid4().hex[:8]}"
    admin_engine = create_async_engine(_admin_url(), isolation_level="AUTOCOMMIT")
    async with admin_engine.connect() as conn:
        await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    await admin_engine.dispose()

    sync_url = _per_session_url(db_name).replace("+asyncpg", "")
    prior_env = os.environ.get("ENVIRONMENT")
    os.environ["ENVIRONMENT"] = "test"
    from app.core.config import get_settings

    get_settings.cache_clear()

    exc_holder: list[BaseException] = []

    def _run_upgrade() -> None:
        try:
            cfg = Config("alembic.ini")
            cfg.set_main_option("sqlalchemy.url", sync_url)
            command.upgrade(cfg, "head")
        except BaseException as exc:
            exc_holder.append(exc)

    thread = threading.Thread(target=_run_upgrade, daemon=True)
    thread.start()
    thread.join()
    if exc_holder:
        raise exc_holder[0]

    engine = create_async_engine(_per_session_url(db_name))

    try:
        yield engine
    finally:
        await engine.dispose()
        admin_engine = create_async_engine(_admin_url(), isolation_level="AUTOCOMMIT")
        async with admin_engine.connect() as conn:
            await conn.execute(text(f'DROP DATABASE IF EXISTS "{db_name}" WITH (FORCE)'))
        await admin_engine.dispose()
        if prior_env is None:
            os.environ.pop("ENVIRONMENT", None)
        else:
            os.environ["ENVIRONMENT"] = prior_env
        get_settings.cache_clear()


@pytest_asyncio.fixture
async def db_session(integration_engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(integration_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def session(db_session: AsyncSession) -> AsyncGenerator[AsyncSession, None]:
    yield db_session


@pytest.fixture(autouse=True)
def _mark_integration(request: pytest.FixtureRequest) -> None:
    request.node.add_marker(pytest.mark.integration)
