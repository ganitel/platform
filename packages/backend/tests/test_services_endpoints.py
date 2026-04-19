"""
Ganitel V2 Backend - Service Endpoints Integration Tests
"""
import pytest
from datetime import timedelta
from fastapi import status


class TestSearchServicesEndpoint:
    """Tests for GET /api/v1/services/search"""
    
    def test_search_services_success(self, client, sample_service):
        """Test successful service search"""
        response = client.get("/api/v1/services/search")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "services" in data
        assert "pagination" in data
        assert "filters_applied" in data
    
    def test_search_services_with_filters(self, client, sample_service):
        """Test service search with filters"""
        response = client.get(
            "/api/v1/services/search",
            params={
                "city": "Douala",
                "service_type": "accommodation",
                "min_price": 10000,
                "max_price": 50000
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "services" in data

    def test_search_services_with_dates_excludes_conflicting_bookings(
        self,
        client,
        sample_service,
        sample_service_2,
        sample_booking,
    ):
        """Test date search excludes services with overlapping booking conflicts"""
        check_in = sample_booking.start_date + timedelta(days=1)
        check_out = sample_booking.end_date

        response = client.get(
            "/api/v1/services/search",
            params={
                "check_in": check_in.isoformat(),
                "check_out": check_out.isoformat(),
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        service_ids = {service["id"] for service in data["services"]}

        assert str(sample_service.id) not in service_ids
        assert str(sample_service_2.id) in service_ids


class TestCreateServiceEndpoint:
    """Tests for POST /api/v1/services/"""
    
    def test_create_service_success(self, client, provider_token, sample_provider):
        """Test successful service creation"""
        response = client.post(
            "/api/v1/services/",
            headers={"Authorization": f"Bearer {provider_token}"},
            json={
                "title": "Luxury Villa in Yaoundé",
                "description": "This is a beautiful luxury villa with all modern amenities. Perfect for families and business travelers. Located in a quiet neighborhood with easy access to the city center.",
                "short_description": "Luxury villa with pool",
                "service_type": "accommodation",
                "accommodation_type": "villa",
                "country": "Cameroun",
                "city": "Yaoundé",
                "address": "456 Main Avenue, Yaoundé",
                "latitude": 3.8480,
                "longitude": 11.5021,
                "base_price": 75000,
                "currency": "XAF",
                "max_guests": 8,
                "bedrooms": 5,
                "bathrooms": 3,
                "beds": 5,
                "amenities": ["wifi", "pool", "parking", "kitchen"],
                "instant_book": True,
                "min_stay": 2
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Luxury Villa in Yaoundé"
        assert data["status"] == "draft"
    
    def test_create_service_unauthorized(self, client):
        """Test service creation fails without authentication"""
        response = client.post(
            "/api/v1/services/",
            json={
                "title": "Test Service",
                "description": "Test description with enough characters",
                "service_type": "accommodation",
                "country": "Cameroun",
                "city": "Douala",
                "address": "123 Test Street",
                "base_price": 25000
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_service_not_provider(self, client, auth_token):
        """Test service creation fails for non-provider"""
        response = client.post(
            "/api/v1/services/",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Test Service",
                "description": "Test description with enough characters",
                "service_type": "accommodation",
                "country": "Cameroun",
                "city": "Douala",
                "address": "123 Test Street",
                "base_price": 25000
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetServiceEndpoint:
    """Tests for GET /api/v1/services/{service_id}"""
    
    def test_get_service_success(self, client, sample_service):
        """Test successful service retrieval"""
        response = client.get(f"/api/v1/services/{sample_service.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(sample_service.id)
        assert data["title"] == sample_service.title
    
    def test_get_service_not_found(self, client):
        """Test service retrieval fails for non-existent service"""
        from uuid import uuid4
        response = client.get(f"/api/v1/services/{uuid4()}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUpdateServiceEndpoint:
    """Tests for PUT /api/v1/services/{service_id}"""
    
    def test_update_service_success(self, client, provider_token, sample_service):
        """Test successful service update"""
        response = client.put(
            f"/api/v1/services/{sample_service.id}",
            headers={"Authorization": f"Bearer {provider_token}"},
            json={
                "title": "Updated Service Title",
                "base_price": 30000
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Service Title"
    
    def test_update_service_unauthorized(self, client, sample_service):
        """Test service update fails without authentication"""
        response = client.put(
            f"/api/v1/services/{sample_service.id}",
            json={"title": "Updated"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestDeleteServiceEndpoint:
    """Tests for DELETE /api/v1/services/{service_id}"""
    
    def test_delete_service_success(self, client, provider_token, sample_service):
        """Test successful service deletion"""
        response = client.delete(
            f"/api/v1/services/{sample_service.id}",
            headers={"Authorization": f"Bearer {provider_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Service deleted successfully"
    
    def test_delete_service_unauthorized(self, client, sample_service):
        """Test service deletion fails without authentication"""
        response = client.delete(f"/api/v1/services/{sample_service.id}")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

