"""Unit tests for verify_jwt — pure logic, no I/O (PyJWKClient is mocked)."""

from unittest.mock import MagicMock, patch

import jwt
import pytest

from app.core.errors import AuthError


def _make_signing_key(private_key):
    mock = MagicMock()
    mock.key = private_key
    return mock


def test_auth_claims_fields() -> None:
    from app.core.auth import AuthClaims

    c = AuthClaims(user_id="uid", email="a@b.com", phone="+1", name="Bob", raw={})
    assert c.user_id == "uid"
    assert c.email == "a@b.com"
    assert c.phone == "+1"
    assert c.name == "Bob"


def test_verify_jwt_extracts_claims(rsa_keypair) -> None:
    from app.core.auth import verify_jwt

    private_key, public_key = rsa_keypair
    token = jwt.encode(
        {
            "sub": "abc123",
            "email": "x@y.com",
            "phone_number": "+237600000000",
            "name": "Alice",
            "iss": "https://test.supabase.co/auth/v1",
        },
        private_key,
        algorithm="RS256",
    )

    mock_jwks = MagicMock()
    mock_jwks.get_signing_key_from_jwt.return_value = _make_signing_key(public_key)

    with (
        patch("app.core.auth._client", return_value=mock_jwks),
        patch("app.core.auth.get_settings") as mock_settings,
    ):
        mock_settings.return_value.JWT_JWKS_URL = (
            "https://test.supabase.co/auth/v1/.well-known/jwks.json"
        )
        mock_settings.return_value.JWT_ISSUER = "https://test.supabase.co/auth/v1"
        claims = verify_jwt(token)

    assert claims.user_id == "abc123"
    assert claims.email == "x@y.com"
    assert claims.phone == "+237600000000"
    assert claims.name == "Alice"


def test_verify_jwt_accepts_es256_tokens(ec_keypair) -> None:
    """Supabase asymmetric-key default is ES256 (EC P-256), not RS256."""
    from app.core.auth import verify_jwt

    private_key, public_key = ec_keypair
    token = jwt.encode(
        {
            "sub": "abc123",
            "iss": "https://test.supabase.co/auth/v1",
        },
        private_key,
        algorithm="ES256",
    )

    mock_jwks = MagicMock()
    mock_jwks.get_signing_key_from_jwt.return_value = _make_signing_key(public_key)

    with (
        patch("app.core.auth._client", return_value=mock_jwks),
        patch("app.core.auth.get_settings") as mock_settings,
    ):
        mock_settings.return_value.JWT_JWKS_URL = (
            "https://test.supabase.co/auth/v1/.well-known/jwks.json"
        )
        mock_settings.return_value.JWT_ISSUER = "https://test.supabase.co/auth/v1"
        claims = verify_jwt(token)

    assert claims.user_id == "abc123"


def test_verify_jwt_accepts_camelcase_phone_claim(rsa_keypair) -> None:
    """Some providers emit `phoneNumber` instead of `phone_number` — accept both."""
    from app.core.auth import verify_jwt

    private_key, public_key = rsa_keypair
    token = jwt.encode(
        {
            "sub": "u",
            "phoneNumber": "+237600000000",
            "iss": "https://test.supabase.co/auth/v1",
        },
        private_key,
        algorithm="RS256",
    )

    mock_jwks = MagicMock()
    mock_jwks.get_signing_key_from_jwt.return_value = _make_signing_key(public_key)

    with (
        patch("app.core.auth._client", return_value=mock_jwks),
        patch("app.core.auth.get_settings") as mock_settings,
    ):
        mock_settings.return_value.JWT_JWKS_URL = (
            "https://test.supabase.co/auth/v1/.well-known/jwks.json"
        )
        mock_settings.return_value.JWT_ISSUER = "https://test.supabase.co/auth/v1"
        claims = verify_jwt(token)

    assert claims.phone == "+237600000000"


def test_verify_jwt_normalizes_empty_email_and_name_to_none(rsa_keypair) -> None:
    """Supabase phone-OTP tokens carry empty `email`/`name` strings; persisting
    those breaks EmailStr serialization on the way back out of /me."""
    from app.core.auth import verify_jwt

    private_key, public_key = rsa_keypair
    token = jwt.encode(
        {
            "sub": "u",
            "email": "",
            "name": "",
            "phone_number": "+237600000000",
            "iss": "https://test.supabase.co/auth/v1",
        },
        private_key,
        algorithm="RS256",
    )

    mock_jwks = MagicMock()
    mock_jwks.get_signing_key_from_jwt.return_value = _make_signing_key(public_key)

    with (
        patch("app.core.auth._client", return_value=mock_jwks),
        patch("app.core.auth.get_settings") as mock_settings,
    ):
        mock_settings.return_value.JWT_JWKS_URL = (
            "https://test.supabase.co/auth/v1/.well-known/jwks.json"
        )
        mock_settings.return_value.JWT_ISSUER = "https://test.supabase.co/auth/v1"
        claims = verify_jwt(token)

    assert claims.email is None
    assert claims.name is None
    assert claims.phone == "+237600000000"


def test_verify_jwt_raises_on_missing_sub(rsa_keypair) -> None:
    from app.core.auth import verify_jwt

    private_key, public_key = rsa_keypair
    token = jwt.encode(
        {"email": "x@y.com", "iss": "https://test.supabase.co/auth/v1"},
        private_key,
        algorithm="RS256",
    )

    mock_jwks = MagicMock()
    mock_jwks.get_signing_key_from_jwt.return_value = _make_signing_key(public_key)

    with (
        patch("app.core.auth._client", return_value=mock_jwks),
        patch("app.core.auth.get_settings") as mock_settings,
    ):
        mock_settings.return_value.JWT_JWKS_URL = (
            "https://test.supabase.co/auth/v1/.well-known/jwks.json"
        )
        mock_settings.return_value.JWT_ISSUER = "https://test.supabase.co/auth/v1"
        with pytest.raises(AuthError, match=r"token\.missing_sub"):
            verify_jwt(token)


def test_verify_jwt_raises_on_invalid_token() -> None:
    from app.core.auth import verify_jwt

    with (
        patch("app.core.auth._client") as mock_client,
        patch("app.core.auth.get_settings") as mock_settings,
    ):
        mock_settings.return_value.JWT_JWKS_URL = (
            "https://test.supabase.co/auth/v1/.well-known/jwks.json"
        )
        mock_settings.return_value.JWT_ISSUER = "https://test.supabase.co/auth/v1"
        mock_client.return_value.get_signing_key_from_jwt.side_effect = jwt.InvalidTokenError("bad")
        with pytest.raises(AuthError, match=r"token\.invalid"):
            verify_jwt("not.a.jwt")
