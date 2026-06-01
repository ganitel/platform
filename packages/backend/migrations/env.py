import asyncio

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings
from app.core.db import Base

# Import models so Base.metadata is populated for autogenerate.
# Each module's models.py is added here as features land.
from app.modules.bookings import models as _bookings_models  # noqa: F401
from app.modules.experience_bookings import models as _experience_bookings_models  # noqa: F401
from app.modules.idempotency import models as _idempotency_models  # noqa: F401
from app.modules.media import models as _media_models  # noqa: F401
from app.modules.outbox import models as _outbox_models  # noqa: F401
from app.modules.payments import models as _payments_models  # noqa: F401
from app.modules.properties import models as _properties_models  # noqa: F401
from app.modules.team import models as _team_models  # noqa: F401
from app.modules.users import models as _users_models  # noqa: F401

config = context.config
_configured_url = config.get_main_option("sqlalchemy.url")
if not _configured_url or _configured_url == "driver://user:pass@localhost/dbname":
    _db_url = str(get_settings().DATABASE_URL)
else:
    _db_url = _configured_url
if _db_url.startswith("postgresql://") or _db_url.startswith("postgresql+psycopg://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1).replace(
        "postgresql+psycopg://", "postgresql+asyncpg://", 1
    )
config.set_main_option("sqlalchemy.url", _db_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def _do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(_do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
