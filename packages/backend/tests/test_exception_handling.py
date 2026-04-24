"""
Ganitel V2 Backend - Global Exception Handling Tests
"""

from fastapi import status
from fastapi.testclient import TestClient

from app.exceptions import GanitelError
from app.main import app


def _ensure_test_route(path: str, handler):
    if any(route.path == path for route in app.router.routes):
        return
    app.add_api_route(path, handler, methods=["GET"])


def test_global_ganitel_exception_handler_returns_standard_payload(client):
    """GanitelError should be formatted by global handler with error_code and request_id."""
    path = "/api/v1/_test/ganitel-exception"

    async def _raise_ganitel_error():
        raise GanitelError("Simulated business rule failure", status_code=418)

    _ensure_test_route(path, _raise_ganitel_error)

    response = client.get(path, headers={"X-Request-ID": "req-ganitel-handler-1"})

    assert response.status_code == 418
    payload = response.json()
    assert payload["detail"] == "Simulated business rule failure"
    assert payload["error_code"] == "GanitelError"
    assert payload["request_id"] == "req-ganitel-handler-1"


def test_global_unhandled_exception_handler_hides_internal_details(client):
    """Unhandled exception should return generic payload and never leak internals."""
    path = "/api/v1/_test/unhandled-exception"

    async def _raise_runtime_error():
        raise RuntimeError("sensitive SQL trace should never be exposed")

    _ensure_test_route(path, _raise_runtime_error)

    with TestClient(app, raise_server_exceptions=False) as safe_client:
        response = safe_client.get(
            path, headers={"X-Request-ID": "req-unhandled-handler-1"}
        )

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    payload = response.json()
    assert payload["detail"] == "An internal error occurred"
    assert payload["error_code"] == "InternalServerError"
    assert payload["request_id"] == "req-unhandled-handler-1"
    assert "sensitive SQL trace" not in str(payload)


def test_payment_initiation_500_is_generic_without_internal_exception(
    client, auth_token, sample_booking, monkeypatch
):
    """Payment 500 errors should be generic and must not expose exception messages."""
    from app.api.v1.endpoints import payments as payments_module

    async def _broken_execute(self, **kwargs):
        raise RuntimeError("driver timeout with internal DB path /var/lib/postgres")

    monkeypatch.setattr(
        payments_module.InitiatePaymentUseCase, "execute", _broken_execute
    )

    response = client.post(
        "/api/v1/payments/initiate",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "booking_id": str(sample_booking.id),
            "payment_method": "mtn",
        },
    )

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    payload = response.json()
    assert payload["detail"] == "Payment initiation failed"
    assert "internal DB path" not in payload["detail"]


def test_admin_stats_500_is_generic_without_internal_exception(
    client, admin_token, monkeypatch
):
    """Admin stats 500 errors should be generic and must not expose internal details."""
    from app.api.v1.endpoints import admin as admin_module

    def _broken_execute(self):
        raise RuntimeError("sensitive stack details")

    monkeypatch.setattr(
        admin_module.GetDashboardStatsUseCase, "execute", _broken_execute
    )

    response = client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    payload = response.json()
    assert payload["detail"] == "Failed to get statistics"
    assert "sensitive" not in payload["detail"]
