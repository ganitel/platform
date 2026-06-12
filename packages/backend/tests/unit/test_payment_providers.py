from unittest.mock import patch

import pytest

from app.core.config import Settings
from app.core.errors import ValidationError
from app.modules.payments.providers import get_provider


def _settings(environment: str) -> Settings:
    return Settings(
        ENVIRONMENT=environment,
        SUPABASE_PROJECT_URL="https://example.supabase.co",
    )


def test_noop_provider_is_available_outside_production() -> None:
    with patch(
        "app.modules.payments.providers.get_settings",
        return_value=_settings("development"),
    ):
        assert get_provider("noop").name == "noop"


def test_noop_provider_is_rejected_in_production() -> None:
    with patch(
        "app.modules.payments.providers.get_settings",
        return_value=_settings("production"),
    ):
        with pytest.raises(ValidationError) as exc_info:
            get_provider("noop")

    assert exc_info.value.code == "payment.provider_unavailable"
    assert exc_info.value.extra == {"field": "provider", "provider": "noop"}
