"""
Ganitel V2 Backend - Booking Endpoints Integration Tests
"""
from datetime import date, timedelta

from fastapi import status


class TestCreateBookingEndpoint:
    """Tests for POST /api/v1/bookings/"""

    def test_create_booking_success(self, client, auth_token, sample_service):
        """Test successful booking creation"""
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)

        response = client.post(
            "/api/v1/bookings/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "service_id": str(sample_service.id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "guests": 2,
                "notes": "Test booking"
            }
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["service_id"] == str(sample_service.id)
        assert data["status"] == "pending"
        assert data["guests"] == 2

    def test_create_booking_unauthorized(self, client, sample_service):
        """Test booking creation fails without authentication"""
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)

        response = client.post(
            "/api/v1/bookings/",
            json={
                "service_id": str(sample_service.id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "guests": 2
            }
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_booking_not_traveler(self, client, provider_token, sample_service):
        """Test booking creation fails for non-traveler"""
        start_date = date.today() + timedelta(days=10)
        end_date = start_date + timedelta(days=3)

        response = client.post(
            "/api/v1/bookings/",
            headers={"Authorization": f"Bearer {provider_token}"},
            json={
                "service_id": str(sample_service.id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "guests": 2
            }
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_booking_invalid_dates(self, client, auth_token, sample_service):
        """Test booking creation fails with invalid dates"""
        start_date = date.today() + timedelta(days=10)
        end_date = start_date - timedelta(days=1)  # End before start

        response = client.post(
            "/api/v1/bookings/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "service_id": str(sample_service.id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "guests": 2
            }
        )

        # FastAPI/Pydantic returns 422 for validation errors
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestGetBookingEndpoint:
    """Tests for GET /api/v1/bookings/{booking_id}"""

    def test_get_booking_success(self, client, auth_token, sample_booking):
        """Test successful booking retrieval"""
        response = client.get(
            f"/api/v1/bookings/{sample_booking.id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(sample_booking.id)
        assert data["status"] == sample_booking.status

    def test_get_booking_unauthorized(self, client, sample_booking):
        """Test booking retrieval fails without authentication"""
        response = client.get(f"/api/v1/bookings/{sample_booking.id}")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCancelBookingEndpoint:
    """Tests for PUT /api/v1/bookings/{booking_id}/cancel"""

    def test_cancel_booking_success(self, client, auth_token, sample_booking):
        """Test successful booking cancellation"""
        response = client.put(
            f"/api/v1/bookings/{sample_booking.id}/cancel",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["booking"]["status"] == "cancelled"
        assert "message" in data

    def test_cancel_booking_unauthorized(self, client, sample_booking):
        """Test booking cancellation fails without authentication"""
        response = client.put(f"/api/v1/bookings/{sample_booking.id}/cancel")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

