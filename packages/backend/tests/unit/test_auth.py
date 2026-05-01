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
            "phoneNumber": "+237600000000",
            "name": "Alice",
            "iss": "http://localhost:3000",
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
        mock_settings.return_value.BETTER_AUTH_JWKS_URL = "http://localhost:3000/api/auth/jwks"
        mock_settings.return_value.BETTER_AUTH_ISSUER = "http://localhost:3000"
        claims = verify_jwt(token)

    assert claims.user_id == "abc123"
    assert claims.email == "x@y.com"
    assert claims.phone == "+237600000000"
    assert claims.name == "Alice"


def test_verify_jwt_phone_user_extracts_phone_from_email(rsa_keypair) -> None:
    """Phone users get a synthetic email — backend extracts phone and drops the fake email."""
    from app.core.auth import verify_jwt

    private_key, public_key = rsa_keypair
    token = jwt.encode(
        {
            "sub": "phone_user_1",
            "email": "237600000000@phone.ganitel.local",
            "name": "+237600000000",
            "iss": "http://localhost:3000",
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
        mock_settings.return_value.BETTER_AUTH_JWKS_URL = "http://localhost:3000/api/auth/jwks"
        mock_settings.return_value.BETTER_AUTH_ISSUER = "http://localhost:3000"
        claims = verify_jwt(token)

    assert claims.phone == "+237600000000"
    assert claims.email is None


def test_verify_jwt_raises_on_missing_sub(rsa_keypair) -> None:
    from app.core.auth import verify_jwt

    private_key, public_key = rsa_keypair
    token = jwt.encode(
        {"email": "x@y.com", "iss": "http://localhost:3000"},
        private_key,
        algorithm="RS256",
    )

    mock_jwks = MagicMock()
    mock_jwks.get_signing_key_from_jwt.return_value = _make_signing_key(public_key)

    with (
        patch("app.core.auth._client", return_value=mock_jwks),
        patch("app.core.auth.get_settings") as mock_settings,
    ):
        mock_settings.return_value.BETTER_AUTH_JWKS_URL = "http://localhost:3000/api/auth/jwks"
        mock_settings.return_value.BETTER_AUTH_ISSUER = "http://localhost:3000"
        with pytest.raises(AuthError, match="missing sub"):
            verify_jwt(token)


def test_verify_jwt_raises_on_invalid_token() -> None:
    from app.core.auth import verify_jwt

    with (
        patch("app.core.auth._client") as mock_client,
        patch("app.core.auth.get_settings") as mock_settings,
    ):
        mock_settings.return_value.BETTER_AUTH_JWKS_URL = "http://localhost:3000/api/auth/jwks"
        mock_settings.return_value.BETTER_AUTH_ISSUER = "http://localhost:3000"
        mock_client.return_value.get_signing_key_from_jwt.side_effect = jwt.InvalidTokenError("bad")
        with pytest.raises(AuthError, match="invalid token"):
            verify_jwt("not.a.jwt")
