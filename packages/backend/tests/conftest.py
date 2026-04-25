"""
Ganitel V2 Backend - Pytest Configuration and Fixtures
T12: Sécurité des tests + Factory App uniforme
"""

import os
import sys
from pathlib import Path

# Add root directory to Python path FIRST
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

# ============================================================================
# DISABLE RATE LIMITING FOR ALL TESTS
# ============================================================================
# Default TESTING=true for local test execution only.
# For staging/production, TESTING must be explicitly provided.
_bootstrap_environment = os.getenv("ENVIRONMENT", "local").strip().lower()
if _bootstrap_environment == "development":
    _bootstrap_environment = "local"
if (
    _bootstrap_environment not in {"staging", "production"}
    and os.getenv("TESTING") is None
):
    os.environ["TESTING"] = "true"


# Create a no-op limiter that disables rate limiting
class NoOpLimiter:
    """A limiter that does nothing - used for testing"""

    def __init__(self):
        self.enabled = False

    def limit(self, limit_string: str):
        """Return a decorator that doesn't actually limit"""

        def decorator(func):
            return func

        return decorator

    def __call__(self, *args, **kwargs):
        pass

    def reset(self):
        pass

    def __iter__(self):
        """Support iteration"""
        return iter([])

    def __getattr__(self, name):
        """Return self for any other attribute to allow chaining"""
        return self


# Replace the limiter in app.core.ratelimit BEFORE it gets used
import app.core.ratelimit

app.core.ratelimit.limiter = NoOpLimiter()  # ty: ignore[invalid-assignment]

# Import pytest and other modules after disabling rate limiting
from collections.abc import Callable, Generator
from typing import ClassVar
from unittest.mock import Mock

import pytest
import redis
from fastapi.testclient import TestClient
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import Session, sessionmaker

# T12: Check that tests are running in TESTING mode
# This prevents accidental test execution against production
_TESTING_ENV = os.getenv("TESTING", "").lower() == "true"
_ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
if _ENVIRONMENT == "development":
    _ENVIRONMENT = "local"

if _ENVIRONMENT in ["production", "staging"] and not _TESTING_ENV:
    _msg = "❌ SECURITY ERROR: Tests cannot run without TESTING=true environment variable\n   This prevents accidentally running tests against production databases.\n   Please set: export TESTING=true"
    pytest.exit(_msg, 1)  # ty: ignore[invalid-argument-type,too-many-positional-arguments]


def pytest_collection_modifyitems(config, items):
    """
    Auto-assign test markers when missing.
    - tests/unit/** -> unit
    - tests/e2e/** -> e2e
    - everything else under tests/** -> integration
    """
    for item in items:
        existing_markers = {marker.name for marker in item.iter_markers()}
        if existing_markers.intersection({"unit", "integration", "e2e"}):
            continue

        item_path = Path(str(item.fspath)).as_posix().lower()
        if "/tests/unit/" in item_path:
            item.add_marker(pytest.mark.unit)
        elif "/tests/e2e/" in item_path:
            item.add_marker(pytest.mark.e2e)
        else:
            item.add_marker(pytest.mark.integration)


# Add root directory to Python path
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

from datetime import date, timedelta
from uuid import uuid4

from app.core.password import hash_password
from app.database import Base, get_db
from app.domain.entities.booking import Booking, BookingStatus
from app.domain.entities.service import (
    AccommodationType,
    Service,
    ServiceStatus,
    ServiceType,
)

# Import entities - will use Base from app.domain.entities.base
# For SQLite compatibility, we'll use the actual Base which should work with PostgreSQL
from app.domain.entities.user import User, UserStatus, UserType
from app.infrastructure.repositories.booking_repository import BookingRepository
from app.infrastructure.repositories.service_repository import ServiceRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.main import app


def pytest_configure(config):
    """Register custom markers defensively for all pytest rootdir configurations."""
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "unit: marks tests as unit tests")
    config.addinivalue_line("markers", "e2e: marks tests as end-to-end tests")
    config.addinivalue_line(
        "markers", "external: marks tests that require external services"
    )
    config.addinivalue_line("markers", "payment: marks tests related to payments")
    config.addinivalue_line("markers", "auth: marks tests related to authentication")
    config.addinivalue_line("markers", "booking: marks tests related to bookings")
    config.addinivalue_line("markers", "service: marks tests related to services")


# Test database URL - PostgreSQL only (no SQLite fallback)

IN_DOCKER = (
    os.path.exists("/.dockerenv")
    or os.path.exists("/run/.containerenv")
    or os.getenv("DOCKER_ENV") == "true"
)

ENVIRONMENT = os.getenv("ENVIRONMENT", "local").lower()
if ENVIRONMENT == "development":
    ENVIRONMENT = "local"

DEFAULT_TEST_DB_HOST = (
    "db-test" if IN_DOCKER else os.getenv("TEST_DB_HOST", "localhost")
)
DEFAULT_TEST_DB_PORT = "5432" if IN_DOCKER else os.getenv("TEST_POSTGRES_PORT", "5433")

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", DEFAULT_TEST_DB_HOST)
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", DEFAULT_TEST_DB_PORT)
    POSTGRES_USER = os.getenv("POSTGRES_USER", "ganitel_user")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "ganitel_local_password_2024")
    POSTGRES_DB = os.getenv(
        "TEST_POSTGRES_DB", os.getenv("POSTGRES_DB", "ganitel_test_db")
    )
    TEST_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

_db_available = False
test_engine = None
TestSessionLocal = None

if not TEST_DATABASE_URL.startswith("postgresql://"):
    print(
        "⚠️  TEST_DATABASE_URL is not a PostgreSQL URL. DB-dependent tests will be skipped."
    )
else:
    try:
        test_engine = create_engine(TEST_DATABASE_URL)
        with test_engine.connect() as conn:
            from sqlalchemy import text

            conn.execute(text("SELECT 1"))
        _db_available = True
        TestSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=test_engine
        )
        print(
            f"[i] Running tests in {ENVIRONMENT} using PostgreSQL: "
            f"{TEST_DATABASE_URL.split('@')[1] if '@' in TEST_DATABASE_URL else TEST_DATABASE_URL}"
        )
    except Exception as e:
        print(f"⚠️  PostgreSQL unavailable ({e}). DB-dependent tests will be skipped.")


# T12: App Factory - Unique application instance factory for all test suites
class TestAppFactory:
    """
    Factory pour créer une instance d'app pour les tests
    Uniformise l'utilisation de l'app à travers performance, security, et autres suites
    """

    _app_instance: ClassVar = None
    _original_overrides: ClassVar[dict] = {}

    @classmethod
    def create_app(cls) -> Callable:
        """Crée une nouvelle instance d'app pour tests"""
        if cls._app_instance is None:
            cls._app_instance = app
        return cls._app_instance  # ty: ignore[invalid-return-type]

    @classmethod
    def reset(cls):
        """Reset la factory et restaure les overrides"""
        cls._app_instance = None
        app.dependency_overrides.clear()  # ty: ignore[unresolved-attribute]


# T12: Database Cleanup via Metadata
# Utilise SQLAlchemy metadata au lieu de hardcoder les tables
def cleanup_database_metadata(engine):
    """
    Nettoie la base de données en utilisant les métadonnées SQLAlchemy
    Cela garantit que toutes les tables sont nettoyées, pas seulement celles hardcodées
    """
    try:
        metadata = MetaData()
        metadata.reflect(bind=engine)

        if engine.dialect.name == "postgresql":
            with engine.connect() as conn:
                from sqlalchemy import text

                # Désactive temporairement les vérifications de clés étrangères
                conn.execute(text("SET session_replication_role = 'replica';"))

                # Truncate toutes les tables reflétées
                for table_name in reversed(metadata.sorted_tables):
                    try:
                        conn.execute(text(f"TRUNCATE TABLE {table_name.name} CASCADE;"))
                    except Exception:
                        pass

                # Réactive les vérifications de clés étrangères
                conn.execute(text("SET session_replication_role = 'origin';"))
                conn.commit()
        else:
            # Pour SQLite, utilise DELETE
            with engine.connect() as conn:
                from sqlalchemy import text

                for table_name in reversed(metadata.sorted_tables):
                    try:
                        conn.execute(text(f"DELETE FROM {table_name.name};"))
                    except Exception:
                        pass
                conn.commit()
    except Exception:
        # Connexion peut échouer, c'est OK pour certains tests
        pass


def ensure_booking_exclusion_constraint(engine):
    """
    Ensure booking anti-overlap exclusion constraint exists in PostgreSQL test DB.

    Tests create schema via Base.metadata.create_all() (without Alembic), so we
    must provision extension + exclusion constraint explicitly for parity.
    """
    if engine.dialect.name != "postgresql":
        return

    from sqlalchemy import text

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist;"))

        constraint_exists = conn.execute(
            text(
                """
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'no_overlapping_bookings'
                  AND conrelid = 'bookings'::regclass
                """
            )
        ).scalar()

        if not constraint_exists:
            conn.execute(
                text(
                    """
                    ALTER TABLE bookings
                    ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
                        service_id WITH =,
                        daterange(start_date, end_date) WITH &&
                    ) WHERE (deleted_at IS NULL);
                    """
                )
            )

        conn.commit()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Setup test database une seule fois en début de session de test
    T12: Utilise metadata pour créer et nettoyer
    """
    if not _db_available:
        yield
        return

    # Crée toutes les tables
    Base.metadata.create_all(bind=test_engine)
    ensure_booking_exclusion_constraint(test_engine)

    yield

    # Nettoyage en fin de suite de tests
    cleanup_database_metadata(test_engine)
    try:
        Base.metadata.drop_all(bind=test_engine)
    except Exception:
        pass


@pytest.fixture(scope="function", autouse=True)
def clean_database():
    """
    Nettoie la base de données avant chaque test
    T12: Utilise metadata pour être dynamique
    """
    if not _db_available:
        yield
        return
    cleanup_database_metadata(test_engine)
    yield


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Create a test database session
    Database is already cleaned by clean_database fixture
    """
    if not _db_available:
        pytest.skip("PostgreSQL not available")
    # Create session
    session = TestSessionLocal()

    try:
        yield session
        # Only commit if no exception occurred
        if session.is_active:
            session.commit()
    except Exception:
        # Always rollback on exception
        if session.is_active:
            session.rollback()
        raise
    finally:
        # Close the session
        session.close()


@pytest.fixture
def client(db_session: Session) -> TestClient:  # ty: ignore[invalid-return-type]
    """
    T12: Fixture client utilisant la factory app uniforme
    Crée un TestClient avec la même instance d'app pour toutes les suites de tests

    Utilisé par:
    - tests/security/test_security.py
    - tests/performance/test_api_performance.py
    - Et toutes les autres suites de tests
    """
    # Crée l'app via la factory
    test_app = TestAppFactory.create_app()

    # Override la dépendance du DB
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    test_app.dependency_overrides[get_db] = override_get_db  # ty: ignore[unresolved-attribute]

    # Crée le client avec l'app
    test_client = TestClient(test_app)

    yield test_client

    # Nettoyage après le test
    test_app.dependency_overrides.clear()  # ty: ignore[unresolved-attribute]
    TestAppFactory.reset()


@pytest.fixture
def mock_redis() -> Mock:
    """
    Mock Redis client for tests
    """
    mock = Mock(spec=redis.Redis)

    storage = {}

    def mock_get(key):
        return storage.get(key)

    def mock_setex(key, ttl, value):
        storage[key] = value
        return True

    def mock_delete(*keys):
        deleted = 0
        for key in keys:
            if key in storage:
                del storage[key]
                deleted += 1
        return deleted

    def mock_getdel(key):
        value = storage.get(key)
        storage.pop(key, None)
        return value

    mock.get.side_effect = mock_get
    mock.setex.side_effect = mock_setex
    mock.delete.side_effect = mock_delete
    mock.getdel.side_effect = mock_getdel
    return mock


@pytest.fixture
def sample_user(db_session: Session) -> User:
    """
    Create a sample user for testing
    """
    user = User(
        id=uuid4(),
        email="test@example.com",
        phone="+237690000000",
        first_name="Test",
        last_name="User",
        hashed_password=hash_password("password123"),
        user_type=UserType.TRAVELER.value,
        status=UserStatus.ACTIVE.value,
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_provider(db_session: Session) -> User:
    """
    Create a sample provider user for testing
    """
    user = User(
        id=uuid4(),
        email="provider@example.com",
        phone="+237690000001",
        first_name="Provider",
        last_name="User",
        hashed_password=hash_password("password123"),
        user_type=UserType.PROVIDER.value,
        status=UserStatus.ACTIVE.value,
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_admin(db_session: Session) -> User:
    """
    Create a sample admin user for testing
    """
    user = User(
        id=uuid4(),
        email="admin@example.com",
        phone="+237690000002",
        first_name="Admin",
        last_name="User",
        hashed_password=hash_password("password123"),
        user_type=UserType.ADMIN.value,
        status=UserStatus.ACTIVE.value,
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_service(db_session: Session, sample_provider: User) -> Service:
    """
    Create a sample service for testing
    """
    service = Service(
        id=uuid4(),
        provider_id=sample_provider.id,
        title="Test Service",
        description="This is a test service description with enough characters to pass validation",
        short_description="Test service",
        service_type=ServiceType.ACCOMMODATION.value,
        accommodation_type=AccommodationType.APARTMENT.value,
        status=ServiceStatus.ACTIVE.value,
        country="Cameroun",
        city="Douala",
        address="123 Test Street",
        latitude=4.0511,
        longitude=9.7679,
        base_price=25000.0,
        currency="XAF",
        price_per="night",
        max_guests=4,
        bedrooms=2,
        bathrooms=1,
        beds=2,
        amenities=["wifi", "pool"],
        instant_book=True,
        min_stay=1,
        check_in_time="15:00",
        check_out_time="11:00",
        is_active=True,
    )
    service.generate_slug()
    db_session.add(service)
    db_session.commit()
    db_session.refresh(service)
    return service


@pytest.fixture
def sample_service_2(db_session: Session, sample_provider: User) -> Service:
    """
    Create a second sample service for testing (e.g., for multi-service scenarios)
    """
    service = Service(
        id=uuid4(),
        provider_id=sample_provider.id,
        title="Test Service 2",
        description="This is a second test service description with enough characters to pass validation",
        short_description="Test service 2",
        service_type=ServiceType.ACCOMMODATION.value,
        accommodation_type=AccommodationType.VILLA.value,
        status=ServiceStatus.ACTIVE.value,
        country="Cameroun",
        city="Yaoundé",
        address="456 Test Avenue",
        latitude=3.8480,
        longitude=11.5021,
        base_price=35000.0,
        currency="XAF",
        price_per="night",
        max_guests=6,
        bedrooms=3,
        bathrooms=2,
        beds=3,
        amenities=["wifi", "pool", "gym"],
        instant_book=True,
        min_stay=1,
        check_in_time="15:00",
        check_out_time="11:00",
        is_active=True,
    )
    service.generate_slug()
    db_session.add(service)
    db_session.commit()
    db_session.refresh(service)
    return service


@pytest.fixture
def sample_booking(
    db_session: Session, sample_user: User, sample_service: Service
) -> Booking:
    """
    Create a sample booking for testing
    """
    start_date = date.today() + timedelta(days=7)
    end_date = start_date + timedelta(days=3)
    nights = (end_date - start_date).days
    total_amount = float(sample_service.base_price) * nights

    booking = Booking(
        id=uuid4(),
        user_id=sample_user.id,
        service_id=sample_service.id,
        start_date=start_date,
        end_date=end_date,
        guests=2,
        status=BookingStatus.PENDING.value,
        total_amount=total_amount,
        currency="XAF",
        is_active=True,
    )
    db_session.add(booking)
    db_session.commit()
    db_session.refresh(booking)
    return booking


@pytest.fixture
def user_repository(db_session: Session) -> UserRepository:
    """
    Create a user repository instance
    """
    return UserRepository(db_session)


@pytest.fixture
def service_repository(db_session: Session) -> ServiceRepository:
    """
    Create a service repository instance
    """
    return ServiceRepository(db_session)


@pytest.fixture
def booking_repository(db_session: Session) -> BookingRepository:
    """
    Create a booking repository instance
    """
    return BookingRepository(db_session)


@pytest.fixture
def auth_token(client: TestClient, sample_user: User) -> str:
    """
    Get authentication token for a test user
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": sample_user.email, "password": "password123"},
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    return ""


@pytest.fixture
def provider_token(client: TestClient, sample_provider: User) -> str:
    """
    Get authentication token for a provider
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": sample_provider.email, "password": "password123"},
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    return ""


@pytest.fixture
def admin_token(client: TestClient, sample_admin: User) -> str:
    """
    Get authentication token for an admin
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": sample_admin.email, "password": "password123"},
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    return ""


@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """
    Get authorization headers with token
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def test_user(sample_user: User) -> User:
    """
    Alias for sample_user for compatibility
    """
    return sample_user


@pytest.fixture
def test_provider(sample_provider: User) -> User:
    """
    Alias for sample_provider for compatibility
    """
    return sample_provider


@pytest.fixture
def test_admin(sample_admin: User) -> User:
    """
    Alias for sample_admin for compatibility
    """
    return sample_admin


@pytest.fixture
def test_data(
    db_session: Session,
    sample_user: User,
    sample_provider: User,
    sample_service: Service,
    sample_booking: Booking,
):
    """
    Create test data for performance and security tests
    """
    return {
        "user": sample_user,
        "traveler": sample_user,  # Alias for compatibility
        "provider": sample_provider,
        "service": sample_service,
        "booking": sample_booking,
    }


@pytest.fixture
def client_no_rate_limit(db_session: Session) -> TestClient:  # ty: ignore[invalid-return-type]
    """
    Create a test client with database override and rate limiting disabled
    This is useful for testing endpoints that have rate limiting decorators
    """
    from unittest.mock import patch

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db  # ty: ignore[unresolved-attribute]

    # Mock the limiter.limit decorator to pass through the function unchanged
    with patch(
        "app.core.ratelimit.limiter.limit", lambda limit_string: lambda func: func
    ):
        yield TestClient(app)  # ty: ignore[invalid-argument-type]

    app.dependency_overrides.clear()  # ty: ignore[unresolved-attribute]
