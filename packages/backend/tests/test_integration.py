"""
Ganitel V2 Backend - Integration Tests
Complete user flows and scenarios
"""
import pytest
from fastapi import status
from datetime import date, timedelta


class TestCompleteUserFlow:
    """Tests for complete user registration and profile management flow"""
    
    def test_complete_user_registration_flow(self, client):
        """Test complete flow: register → login → get profile → update profile"""
        # 1. Register
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "flow@example.com",
                "phone": "+237690004000",
                "password": "password123",
                "first_name": "Flow",
                "last_name": "Test",
                "user_type": "traveler"
            }
        )
        assert register_response.status_code == status.HTTP_201_CREATED
        user_data = register_response.json()
        user_id = user_data["id"]
        
        # 2. Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "identifier": "flow@example.com",
                "password": "password123"
            }
        )
        assert login_response.status_code == status.HTTP_200_OK
        token = login_response.json()["access_token"]
        
        # 3. Get profile
        profile_response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert profile_response.status_code == status.HTTP_200_OK
        assert profile_response.json()["email"] == "flow@example.com"
        
        # 4. Update profile
        update_response = client.put(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "bio": "Updated bio",
                "city": "Yaoundé"
            }
        )
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["bio"] == "Updated bio"


class TestCompleteServiceFlow:
    """Tests for complete service creation and management flow"""
    
    def test_complete_service_flow(self, client, provider_token, sample_provider):
        """Test complete flow: create service → get service → update service → delete service"""
        # 1. Create service
        create_response = client.post(
            "/api/v1/services/",
            headers={"Authorization": f"Bearer {provider_token}"},
            json={
                "title": "Integration Test Service",
                "description": "This is a test service for integration testing with enough characters to pass validation",
                "service_type": "accommodation",
                "accommodation_type": "apartment",
                "country": "Cameroun",
                "city": "Douala",
                "address": "123 Test Street",
                "base_price": 30000,
                "currency": "XAF"
            }
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        service_data = create_response.json()
        service_id = service_data["id"]
        
        # 2. Get service
        get_response = client.get(f"/api/v1/services/{service_id}")
        assert get_response.status_code == status.HTTP_200_OK
        assert get_response.json()["title"] == "Integration Test Service"
        
        # 3. Update service
        update_response = client.put(
            f"/api/v1/services/{service_id}",
            headers={"Authorization": f"Bearer {provider_token}"},
            json={
                "title": "Updated Integration Test Service",
                "base_price": 35000
            }
        )
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["title"] == "Updated Integration Test Service"
        
        # 4. Delete service
        delete_response = client.delete(
            f"/api/v1/services/{service_id}",
            headers={"Authorization": f"Bearer {provider_token}"}
        )
        assert delete_response.status_code == status.HTTP_200_OK


class TestCompleteBookingFlow:
    """Tests for complete booking flow"""
    
    def test_complete_booking_flow(self, client, auth_token, sample_service):
        """Test complete flow: create booking → get booking → cancel booking"""
        start_date = date.today() + timedelta(days=20)
        end_date = start_date + timedelta(days=3)
        
        # 1. Create booking
        create_response = client.post(
            "/api/v1/bookings/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "service_id": str(sample_service.id),
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "guests": 2
            }
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        booking_data = create_response.json()
        booking_id = booking_data["id"]
        
        # 2. Get booking
        get_response = client.get(
            f"/api/v1/bookings/{booking_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_response.status_code == status.HTTP_200_OK
        assert get_response.json()["status"] == "pending"
        
        # 3. Cancel booking
        cancel_response = client.put(
            f"/api/v1/bookings/{booking_id}/cancel",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert cancel_response.status_code == status.HTTP_200_OK
        assert cancel_response.json()["booking"]["status"] == "cancelled"

