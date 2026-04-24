"""
Ganitel V2 Backend - User Endpoints Integration Tests
"""

from fastapi import status


class TestGetCurrentUserEndpoint:
    """Tests for GET /api/v1/users/me"""

    def test_get_current_user_success(self, client, auth_token, sample_user):
        """Test successful profile retrieval"""
        response = client.get(
            "/api/v1/users/me", headers={"Authorization": f"Bearer {auth_token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(sample_user.id)
        assert data["email"] == sample_user.email
        assert data["first_name"] == sample_user.first_name

    def test_get_current_user_unauthorized(self, client):
        """Test profile retrieval fails without authentication"""
        response = client.get("/api/v1/users/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUpdateCurrentUserEndpoint:
    """Tests for PUT /api/v1/users/me"""

    def test_update_profile_success(self, client, auth_token):
        """Test successful profile update"""
        response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"first_name": "Updated", "bio": "New bio", "city": "Yaoundé"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["first_name"] == "Updated"
        assert data["bio"] == "New bio"
        assert data["city"] == "Yaoundé"

    def test_update_profile_unauthorized(self, client):
        """Test profile update fails without authentication"""
        response = client.put("/api/v1/users/me", json={"first_name": "Updated"})

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestChangePasswordEndpoint:
    """Tests for POST /api/v1/users/me/change-password"""

    def test_change_password_success(self, client, auth_token, sample_user):
        """Test successful password change"""
        response = client.post(
            "/api/v1/users/me/change-password",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"current_password": "password123", "new_password": "newpassword456"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Password changed successfully"

        # Verify new password works
        login_response = client.post(
            "/api/v1/auth/login",
            json={"identifier": sample_user.email, "password": "newpassword456"},
        )
        assert login_response.status_code == status.HTTP_200_OK

    def test_change_password_wrong_current(self, client, auth_token):
        """Test password change fails with wrong current password"""
        response = client.post(
            "/api/v1/users/me/change-password",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword456",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_password_unauthorized(self, client):
        """Test password change fails without authentication"""
        response = client.post(
            "/api/v1/users/me/change-password",
            json={"current_password": "password123", "new_password": "newpassword456"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetUserBookingsEndpoint:
    """Tests for GET /api/v1/users/me/bookings"""

    def test_get_user_bookings_success(self, client, auth_token, sample_booking):
        """Test successful bookings retrieval"""
        response = client.get(
            "/api/v1/users/me/bookings",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "bookings" in data
        assert "total" in data
        assert len(data["bookings"]) >= 0

    def test_get_user_bookings_unauthorized(self, client):
        """Test bookings retrieval fails without authentication"""
        response = client.get("/api/v1/users/me/bookings")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetUserPublicProfileEndpoint:
    """Tests for GET /api/v1/users/{user_id}"""

    def test_get_public_profile_success(self, client, sample_user):
        """Test successful public profile retrieval"""
        response = client.get(f"/api/v1/users/{sample_user.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(sample_user.id)
        assert data["first_name"] == sample_user.first_name
        assert "email" not in data  # Email should not be in public profile

    def test_get_public_profile_not_found(self, client):
        """Test public profile retrieval fails for non-existent user"""
        from uuid import uuid4

        response = client.get(f"/api/v1/users/{uuid4()}")

        assert response.status_code == status.HTTP_404_NOT_FOUND
