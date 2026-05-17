from uuid import uuid4

import pytest

from app.core.config import DEFAULT_TEAM_REVIEW_SECRET, get_settings
from app.core.errors import ConfigurationError, ValidationError
from app.modules.payments.providers import get_provider
from app.modules.payments.providers.noop import NoopProvider
from app.modules.team import tokens


@pytest.fixture(autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_noop_payment_provider_is_disabled_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")

    with pytest.raises(ValidationError, match="payment.provider_disabled"):
        get_provider("noop")


def test_noop_payment_provider_remains_available_in_development(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "development")

    assert isinstance(get_provider("noop"), NoopProvider)


def test_default_team_review_secret_is_rejected_in_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("TEAM_REVIEW_SECRET", DEFAULT_TEAM_REVIEW_SECRET)

    with pytest.raises(ConfigurationError, match="team_review_secret.unconfigured"):
        tokens.mint(team_member_id=uuid4(), admin_email="admin@example.com")


def test_configured_team_review_secret_works_in_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("TEAM_REVIEW_SECRET", "test-review-secret")
    team_member_id = uuid4()

    token = tokens.mint(team_member_id=team_member_id, admin_email="Admin@Example.com")

    assert tokens.verify(token, team_member_id=team_member_id) == "admin@example.com"
