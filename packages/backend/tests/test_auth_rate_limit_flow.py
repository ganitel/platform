"""
Auth flow tests with real rate-limiting middleware enabled.
"""

import importlib
from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.exceptions import AuthorizationError


class DummyRedis:
    def __init__(self):
        self.storage = {}

    def get(self, key):
        return self.storage.get(key)

    def incrby(self, key, amount):
        current_value = int(self.storage.get(key, "0"))
        new_value = current_value + amount
        self.storage[key] = str(new_value)
        return new_value

    def expire(self, key, ttl):
        return True

    def delete(self, *keys):
        deleted = 0
        for key in keys:
            if key in self.storage:
                del self.storage[key]
                deleted += 1
        return deleted


class DummyRegisterUserUseCase:
    def __init__(self, user_repository):
        pass

    def execute(self, **kwargs):
        now = datetime.utcnow()
        first_name = kwargs["first_name"]
        last_name = kwargs["last_name"]
        return SimpleNamespace(
            id="11111111-1111-1111-1111-111111111111",
            email=kwargs.get("email"),
            phone=kwargs.get("phone"),
            first_name=first_name,
            last_name=last_name,
            full_name=f"{first_name} {last_name}",
            user_type=kwargs.get("user_type", "traveler"),
            status="pending_verification",
            is_verified=False,
            profile_picture=None,
            bio=None,
            country=kwargs.get("country"),
            city=kwargs.get("city"),
            language="en",
            currency="XAF",
            created_at=now,
            updated_at=now,
        )


class DummyLoginUserUseCase:
    def __init__(self, user_repository):
        pass

    def execute(self, identifier, password, redis_client):
        if password != "password123":
            raise AuthorizationError("Invalid credentials")

        return SimpleNamespace(
            access_token="access-token",
            token_type="bearer",
            refresh_token="refresh-token",
        )


@pytest.fixture
def rate_limited_auth_client(monkeypatch):
    import app.api.v1.endpoints.auth as auth_module
    import app.core.ratelimit as ratelimit_module

    original_limiter = ratelimit_module.limiter

    ratelimit_module.limiter = Limiter(
        key_func=get_remote_address,
        storage_uri="memory://",
        strategy="fixed-window",
    )

    auth_module = importlib.reload(auth_module)

    monkeypatch.setattr(auth_module, "RegisterUserUseCase", DummyRegisterUserUseCase)
    monkeypatch.setattr(auth_module, "LoginUserUseCase", DummyLoginUserUseCase)

    dummy_redis = DummyRedis()

    def override_get_db():
        yield object()

    app = FastAPI()
    app.state.limiter = ratelimit_module.limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    app.include_router(auth_module.router, prefix="/api/v1/auth")

    app.dependency_overrides[auth_module.get_db] = override_get_db
    app.dependency_overrides[auth_module.get_redis] = lambda: dummy_redis

    client = TestClient(app)

    yield client, dummy_redis

    app.dependency_overrides.clear()
    ratelimit_module.limiter = original_limiter
    importlib.reload(auth_module)


class TestAuthRateLimitCombinations:
    def test_register_is_rate_limited_after_five_requests(self, rate_limited_auth_client):
        client, _ = rate_limited_auth_client

        for index in range(5):
            response = client.post(
                "/api/v1/auth/register",
                json={
                    "email": f"flow_{index}@example.com",
                    "phone": f"+2376900{10000 + index}",
                    "password": "password123",
                    "first_name": "Flow",
                    "last_name": f"User{index}",
                    "user_type": "traveler",
                },
            )
            assert response.status_code == 201

        sixth_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "flow_6@example.com",
                "phone": "+237690012345",
                "password": "password123",
                "first_name": "Flow",
                "last_name": "User6",
                "user_type": "traveler",
            },
        )

        assert sixth_response.status_code == 429

    def test_login_lockout_triggers_before_login_success(self, rate_limited_auth_client):
        client, _ = rate_limited_auth_client

        for _ in range(5):
            response = client.post(
                "/api/v1/auth/login",
                json={"identifier": "same@example.com", "password": "wrong-password"},
            )
            assert response.status_code == 401

        lockout_response = client.post(
            "/api/v1/auth/login",
            json={"identifier": "same@example.com", "password": "password123"},
        )

        assert lockout_response.status_code == 429
        assert "locked" in lockout_response.json()["detail"].lower()

    def test_login_rate_limit_applies_across_distinct_identifiers(self, rate_limited_auth_client):
        client, _ = rate_limited_auth_client

        for index in range(10):
            response = client.post(
                "/api/v1/auth/login",
                json={"identifier": f"user{index}@example.com", "password": "wrong-password"},
            )
            assert response.status_code == 401

        throttled_response = client.post(
            "/api/v1/auth/login",
            json={"identifier": "user11@example.com", "password": "wrong-password"},
        )

        assert throttled_response.status_code == 429
        response_payload = throttled_response.json()
        response_message = (response_payload.get("detail") or response_payload.get("error") or "").lower()
        assert "rate limit" in response_message
