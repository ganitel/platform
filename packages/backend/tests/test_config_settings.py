"""
Configuration settings tests.
"""

import pytest

from app.config import Settings


def test_database_url_uses_explicit_value(monkeypatch):
    explicit_url = "postgresql://user:pass@db:5432/ganitel_db"

    monkeypatch.setenv("DATABASE_URL", explicit_url)
    monkeypatch.setenv("POSTGRES_SERVER", "localhost")

    settings = Settings()

    assert settings.DATABASE_URL == explicit_url


def test_database_url_is_built_when_missing(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("POSTGRES_USER", "ganitel_user")
    monkeypatch.setenv("POSTGRES_PASSWORD", "ganitel_password")
    monkeypatch.setenv("POSTGRES_SERVER", "db")
    monkeypatch.setenv("POSTGRES_PORT", "5432")
    monkeypatch.setenv("POSTGRES_DB", "ganitel_db")

    settings = Settings()

    assert (
        settings.DATABASE_URL
        == "postgresql://ganitel_user:ganitel_password@db:5432/ganitel_db"
    )


def _set_staging_valid_security_env(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    monkeypatch.setenv("ENV_WORKERS", "2")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    monkeypatch.setenv("SECRET_KEY", "staging-super-secret-key-min-32-chars")
    monkeypatch.setenv("ADMIN_EMAIL", "security-admin@ganitel.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "Strong_Admin_Password_456!")

    monkeypatch.setenv("TRANZAK_API_KEY", "tranzak_api_key_live")
    monkeypatch.setenv("TRANZAK_APP_ID", "tranzak_app_id_live")
    monkeypatch.setenv("TRANZAK_APP_KEY", "tranzak_app_key_live")
    monkeypatch.setenv("TRANZAK_WEBHOOK_SECRET", "tranzak_webhook_secret_live")
    monkeypatch.setenv("TRANZAK_WEBHOOK_AUTH_KEY", "tranzak_webhook_auth_live")

    monkeypatch.setenv("GOOGLE_CLIENT_ID", "google_client_id_live")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "google_client_secret_live")
    monkeypatch.setenv("FACEBOOK_APP_ID", "facebook_app_id_live")
    monkeypatch.setenv("FACEBOOK_APP_SECRET", "facebook_app_secret_live")

    monkeypatch.setenv("ORANGE_MONEY_CLIENT_ID", "orange_money_client_id_live")
    monkeypatch.setenv("ORANGE_MONEY_CLIENT_SECRET", "orange_money_client_secret_live")
    monkeypatch.setenv("ORANGE_MONEY_MERCHANT_KEY", "orange_money_merchant_key_live")
    monkeypatch.setenv("MOBILE_MONEY_BASIC_AUTH", "mobile_money_basic_auth_live")


def test_staging_rejects_default_admin_email(monkeypatch):
    _set_staging_valid_security_env(monkeypatch)
    monkeypatch.setenv("ADMIN_EMAIL", "admin@ganitel.com")

    with pytest.raises(
        ValueError, match="ADMIN_EMAIL must be changed in staging/production"
    ):
        Settings()


def test_staging_rejects_access_token_expire_above_30(monkeypatch):
    _set_staging_valid_security_env(monkeypatch)
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "31")

    with pytest.raises(
        ValueError, match="ACCESS_TOKEN_EXPIRE_MINUTES must be between 15 and 30"
    ):
        Settings()


def test_staging_rejects_access_token_expire_below_15(monkeypatch):
    _set_staging_valid_security_env(monkeypatch)
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "14")

    with pytest.raises(
        ValueError, match="ACCESS_TOKEN_EXPIRE_MINUTES must be between 15 and 30"
    ):
        Settings()


def test_staging_accepts_access_token_expire_within_range(monkeypatch):
    _set_staging_valid_security_env(monkeypatch)
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")

    settings = Settings()

    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30
