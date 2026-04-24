"""
Ganitel V2 Backend - Authentication Endpoints Integration Tests
"""

from unittest.mock import MagicMock

from fastapi import status
from jose import jwt

from app.config import get_settings
from app.core.oauth_exchange import create_oauth_exchange_code
from app.dependencies import get_redis
from app.main import app
from tests.helpers import unique_email, unique_phone


class TestRegisterEndpoint:
    """Tests for POST /api/v1/auth/register"""

    def test_register_traveler_success(self, client):
        """Test successful traveler registration"""
        email = unique_email()
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "phone": unique_phone(),
                "password": "password123",
                "first_name": "New",
                "last_name": "Traveler",
                "user_type": "traveler",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == email
        assert data["user_type"] == "traveler"
        assert data["status"] == "pending_verification"
        assert "id" in data

    def test_register_provider_success(self, client):
        """Test successful provider registration"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": unique_email(),
                "phone": unique_phone(),
                "password": "password123",
                "first_name": "New",
                "last_name": "Provider",
                "user_type": "provider",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["user_type"] == "provider"

    def test_register_admin_forbidden(self, client):
        """Test admin registration is blocked on public endpoint"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": unique_email(),
                "phone": unique_phone(),
                "password": "password123",
                "first_name": "New",
                "last_name": "Admin",
                "user_type": "admin",
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_duplicate_email(self, client, sample_user):
        """Test registration fails with duplicate email"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": sample_user.email,
                "password": "password123",
                "first_name": "Test",
                "last_name": "User",
                "user_type": "traveler",
            },
        )

        assert response.status_code == status.HTTP_409_CONFLICT

    def test_register_invalid_email(self, client):
        """Test registration fails with invalid email"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "password": "password123",
                "first_name": "Test",
                "last_name": "User",
                "user_type": "traveler",
            },
        )

        # FastAPI/Pydantic returns 422 for validation errors
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_register_weak_password(self, client):
        """Test registration fails with weak password"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",
                "first_name": "Test",
                "last_name": "User",
                "user_type": "traveler",
            },
        )

        # FastAPI/Pydantic returns 422 for validation errors
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestLoginEndpoint:
    """Tests for POST /api/v1/auth/login"""

    def test_login_success(self, client, sample_user):
        """Test successful login"""
        response = client.post(
            "/api/v1/auth/login",
            json={"identifier": sample_user.email, "password": "password123"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    def test_login_with_phone(self, client, sample_user):
        """Test login with phone number"""
        response = client.post(
            "/api/v1/auth/login",
            json={"identifier": sample_user.phone, "password": "password123"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()

    def test_login_wrong_password(self, client, sample_user):
        """Test login fails with wrong password"""
        response = client.post(
            "/api/v1/auth/login",
            json={"identifier": sample_user.email, "password": "wrongpassword"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_user_not_found(self, client):
        """Test login fails for non-existent user"""
        response = client.post(
            "/api/v1/auth/login",
            json={"identifier": "nonexistent@example.com", "password": "password123"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_suspended_user(self, client, db_session):
        """Test login fails for suspended user"""
        from uuid import uuid4

        from passlib.context import CryptContext

        from app.domain.entities.user import User, UserStatus, UserType

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        user = User(
            id=uuid4(),
            email="suspended@example.com",
            phone="+237690001100",
            first_name="Suspended",
            last_name="User",
            hashed_password=pwd_context.hash("password123"),
            user_type=UserType.TRAVELER.value,
            status=UserStatus.SUSPENDED.value,
            is_verified=True,
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={"identifier": user.email, "password": "password123"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestRefreshTokenEndpoint:
    """Tests for POST /api/v1/auth/refresh-token"""

    def test_refresh_token_success(self, client, sample_user, mock_redis):
        """Test successful token refresh"""
        # First login
        login_response = client.post(
            "/api/v1/auth/login",
            json={"identifier": sample_user.email, "password": "password123"},
        )

        refresh_token = login_response.json()["refresh_token"]

        # Refresh token
        response = client.post(
            "/api/v1/auth/refresh-token", json={"refresh_token": refresh_token}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["access_token"] != login_response.json()["access_token"]

    def test_refresh_token_invalid(self, client):
        """Test refresh fails with invalid token"""
        response = client.post(
            "/api/v1/auth/refresh-token", json={"refresh_token": "invalid_token"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestOAuthEndpoints:
    """Tests for OAuth callback and temporary code exchange flow."""

    def test_google_callback_redirects_with_temp_code_not_token(
        self, client, mock_redis, monkeypatch
    ):
        """Google callback must redirect with one-time code, never with JWT token in URL."""
        from app.api.v1.endpoints import auth as auth_module

        async def fake_execute_google(self, code):
            return {
                "user": {"id": "123e4567-e89b-12d3-a456-426614174000"},
                "access_token": "jwt_should_not_be_exposed",
                "token_type": "bearer",
            }

        app.dependency_overrides[get_redis] = lambda: mock_redis
        monkeypatch.setattr(
            auth_module.OAuthLoginUseCase, "execute_google", fake_execute_google
        )

        response = client.get(
            "/api/v1/auth/oauth/google/callback?code=provider-code",
            allow_redirects=False,
        )

        assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT
        location = response.headers["location"]
        assert "token=" not in location
        assert "code=" in location
        assert "provider=google" in location

    def test_oauth_code_exchange_success(self, client, sample_user, mock_redis):
        """Valid one-time OAuth code should exchange to a valid access token."""
        settings = get_settings()
        app.dependency_overrides[get_redis] = lambda: mock_redis

        exchange_code = create_oauth_exchange_code(
            redis_client=mock_redis,
            user_id=str(sample_user.id),
            provider="google",
        )

        response = client.post(
            "/api/v1/auth/oauth/exchange-code",
            json={"code": exchange_code, "provider": "google"},
        )

        assert response.status_code == status.HTTP_200_OK
        payload = response.json()
        assert "access_token" in payload
        decoded = jwt.decode(
            payload["access_token"],
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
        )
        assert decoded.get("sub") == str(sample_user.id)
        assert decoded.get("type") == "access"

    def test_oauth_code_exchange_rejects_replay(self, client, sample_user, mock_redis):
        """One-time OAuth code cannot be reused."""
        app.dependency_overrides[get_redis] = lambda: mock_redis

        exchange_code = create_oauth_exchange_code(
            redis_client=mock_redis,
            user_id=str(sample_user.id),
            provider="facebook",
        )

        first = client.post(
            "/api/v1/auth/oauth/exchange-code",
            json={"code": exchange_code, "provider": "facebook"},
        )
        second = client.post(
            "/api/v1/auth/oauth/exchange-code",
            json={"code": exchange_code, "provider": "facebook"},
        )

        assert first.status_code == status.HTTP_200_OK
        assert second.status_code == status.HTTP_401_UNAUTHORIZED
        assert second.json()["detail"] == "Invalid or expired OAuth code"

    def test_google_callback_error_is_generic(self, client, mock_redis, monkeypatch):
        """OAuth callback errors must not leak internal exception messages in redirect URL."""
        from app.api.v1.endpoints import auth as auth_module

        async def broken_execute_google(self, code):
            raise RuntimeError("internal stack details leaked")

        app.dependency_overrides[get_redis] = lambda: mock_redis
        monkeypatch.setattr(
            auth_module.OAuthLoginUseCase, "execute_google", broken_execute_google
        )

        response = client.get(
            "/api/v1/auth/oauth/google/callback?code=provider-code",
            allow_redirects=False,
        )

        assert response.status_code == status.HTTP_307_TEMPORARY_REDIRECT
        location = response.headers["location"]
        assert "error=oauth_callback_failed" in location
        assert "internal%20stack%20details%20leaked" not in location


class TestAccessTokenTypeValidation:
    """Tests for enforcing access token type on protected endpoints."""

    def test_refresh_token_rejected_on_protected_endpoint(self, client, sample_user):
        """Refresh token must not authenticate protected API calls."""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "identifier": sample_user.email,
                "password": "password123",
            },
        )
        assert login_response.status_code == status.HTTP_200_OK

        refresh_token = login_response.json()["refresh_token"]

        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {refresh_token}"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Invalid token type"


class TestAuthFlowCombinations:
    """Higher-level auth flow tests across multiple endpoints."""

    def test_register_login_refresh_logout_flow(self, client):
        """Register, then login, refresh token, and logout in sequence."""
        registration_email = unique_email()
        registration_phone = unique_phone()

        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": registration_email,
                "phone": registration_phone,
                "password": "password123",
                "first_name": "Flow",
                "last_name": "User",
                "user_type": "traveler",
            },
        )
        assert register_response.status_code == status.HTTP_201_CREATED

        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "identifier": registration_email,
                "password": "password123",
            },
        )
        assert login_response.status_code == status.HTTP_200_OK
        login_data = login_response.json()
        assert "access_token" in login_data
        assert "refresh_token" in login_data

        refresh_response = client.post(
            "/api/v1/auth/refresh-token",
            json={"refresh_token": login_data["refresh_token"]},
        )
        assert refresh_response.status_code == status.HTTP_200_OK

        logout_response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {login_data['access_token']}"},
        )
        assert logout_response.status_code == status.HTTP_200_OK


class TestAuthEndpointErrorHandling:
    """Tests for clear and traceable unexpected-error responses."""

    def test_register_unhandled_error_includes_request_reference(
        self, client, monkeypatch
    ):
        """Unhandled register failures should include request reference in response."""
        from app.api.v1.endpoints import auth as auth_module

        class BrokenRegisterUserUseCase:
            def __init__(self, user_repository):
                pass

            def execute(self, **kwargs):
                raise RuntimeError("forced register failure")

        monkeypatch.setattr(
            auth_module, "RegisterUserUseCase", BrokenRegisterUserUseCase
        )

        response = client.post(
            "/api/v1/auth/register",
            headers={"X-Request-ID": "req-register-500"},
            json={
                "email": unique_email(),
                "phone": unique_phone(),
                "password": "password123",
                "first_name": "Err",
                "last_name": "Register",
                "user_type": "traveler",
            },
        )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Registration failed. Please try again." in response.json()["detail"]
        assert "req-register-500" in response.json()["detail"]

    def test_login_unhandled_error_includes_request_reference(
        self, client, monkeypatch
    ):
        """Unhandled login failures should include request reference in response."""
        from app.api.v1.endpoints import auth as auth_module

        class BrokenLoginUserUseCase:
            def __init__(self, user_repository):
                pass

            def execute(self, **kwargs):
                raise RuntimeError("forced login failure")

        redis_mock = MagicMock()
        redis_mock.get.return_value = None

        app.dependency_overrides[get_redis] = lambda: redis_mock
        monkeypatch.setattr(auth_module, "LoginUserUseCase", BrokenLoginUserUseCase)

        response = client.post(
            "/api/v1/auth/login",
            headers={"X-Request-ID": "req-login-500"},
            json={
                "identifier": "broken@example.com",
                "password": "password123",
            },
        )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Login failed. Please try again." in response.json()["detail"]
        assert "req-login-500" in response.json()["detail"]

    def test_refresh_unhandled_error_includes_request_reference(
        self, client, monkeypatch
    ):
        """Unhandled refresh failures should include request reference in response."""
        from app.api.v1.endpoints import auth as auth_module

        class BrokenRefreshTokenUseCase:
            def __init__(self, user_repository):
                pass

            def execute(self, **kwargs):
                raise RuntimeError("forced refresh failure")

        redis_mock = MagicMock()
        app.dependency_overrides[get_redis] = lambda: redis_mock
        monkeypatch.setattr(
            auth_module, "RefreshTokenUseCase", BrokenRefreshTokenUseCase
        )

        response = client.post(
            "/api/v1/auth/refresh-token?refresh_token=dummy-refresh-token",
            headers={"X-Request-ID": "req-refresh-500"},
        )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Token refresh failed. Please try again." in response.json()["detail"]
        assert "req-refresh-500" in response.json()["detail"]


class TestLogoutEndpoint:
    """Tests for POST /api/v1/auth/logout"""

    def test_logout_success(self, client, auth_token):
        """Test successful logout"""
        response = client.post(
            "/api/v1/auth/logout", headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Successfully logged out"

    def test_logout_unauthorized(self, client):
        """Test logout fails without authentication"""
        response = client.post("/api/v1/auth/logout")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
