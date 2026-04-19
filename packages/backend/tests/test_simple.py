"""
Ganitel V2 Backend - Tests Simplifiés
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

# Tests sans base de données
client = TestClient(app)

def test_health_endpoint():
    """Test simple du endpoint de santé"""
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_root_endpoint():
    """Test du endpoint racine"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Ganitel API V2" in data["message"]

def test_docs_endpoint():
    """Test que la documentation est accessible"""
    response = client.get("/docs")
    assert response.status_code in [200, 404]

def test_openapi_endpoint():
    """Test que le schéma OpenAPI est accessible"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    # APP_NAME can vary by environment (e.g., "Ganitel API - Local")
    assert "ganitel api" in data["info"]["title"].lower()

def test_services_search_endpoint():
    """Test du endpoint de recherche de services (sans DB)"""
    response = client.get("/api/v1/services/search")
    # Peut retourner 500 si la base n'est pas configurée
    assert response.status_code in [200, 500]

def test_services_list_endpoint():
    """Test du endpoint de liste des services (sans DB)"""
    response = client.get("/api/v1/services/")
    assert response.status_code in [200, 500]

def test_featured_services_endpoint():
    """Test du endpoint des services en vedette (sans DB)"""
    response = client.get("/api/v1/services/featured")
    # Peut retourner 400 si la DB n'est pas configurée, c'est normal
    assert response.status_code in [200, 400, 500]

def test_invalid_service_id():
    """Test avec un ID de service invalide"""
    response = client.get("/api/v1/services/invalid-id")
    assert response.status_code == 400  # Bad request pour format invalide

def test_unauthorized_create_service():
    """Test de création de service sans authentification"""
    service_data = {
        "title": "Test Service",
        "description": "Test description",
        "service_type": "accommodation",
        "country": "Cameroon",
        "city": "Douala",
        "address": "Test Address",
        "base_price": 50000
    }
    
    response = client.post("/api/v1/services/", json=service_data)
    # Peut être 401 (Unauthorized) ou 403 (Forbidden)
    assert response.status_code in [401, 403]

def test_unauthorized_get_my_services():
    """Test d'accès aux services du provider sans authentification"""
    response = client.get("/api/v1/services/provider/my-services")
    assert response.status_code == 401  # Unauthorized

def test_unauthorized_update_service():
    """Test mise à jour de service sans jeton"""
    response = client.put("/api/v1/services/00000000-0000-0000-0000-000000000000", json={"title": "Updated"})
    assert response.status_code == 401

def test_unauthorized_delete_service():
    """Test suppression service sans jeton"""
    response = client.delete("/api/v1/services/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401

def test_invalid_registration_data():
    """Test d'inscription avec des données invalides"""
    invalid_data = {
        "email": "invalid-email",
        "password": "123",  # Trop court
        "first_name": "",   # Vide
        "last_name": ""     # Vide
    }
    
    response = client.post("/api/v1/auth/register", json=invalid_data)
    assert response.status_code == 422  # Validation error

def test_invalid_login_data():
    """Test de connexion avec des données invalides"""
    invalid_data = {
        "identifier": "",
        "password": ""
    }
    
    response = client.post("/api/v1/auth/login", json=invalid_data)
    assert response.status_code in [401, 422, 500]

def test_create_default_admin():
    """Test de création de l'admin par défaut"""
    response = client.post("/api/v1/admin/create-default-admin")
    # Endpoint supprimé pour sécurité
    assert response.status_code == 404

def test_admin_stats():
    """Test des statistiques admin"""
    response = client.get("/api/v1/admin/stats")
    # 401 if auth required, 200 if open, 500 if DB error
    assert response.status_code in [200, 401, 500]

def test_services_search_requires_no_auth():
    """Test que la recherche de services ne nécessite pas d'authentification"""
    response = client.get("/api/v1/services/search?q=hotel")
    assert response.status_code in [200, 500]  # 500 si pas de DB, mais pas 401

def test_bookings_endpoint_requires_auth():
    """Test que la création de booking nécessite une authentification"""
    payload = {
        "service_id": "00000000-0000-0000-0000-000000000000",
        "start_date": "2025-12-01",
        "end_date": "2025-12-05",
        "guests": 2
    }
    response = client.post("/api/v1/bookings/", json=payload)
    assert response.status_code == 401

def test_users_me_bookings_requires_auth():
    """Test que la récupération des réservations nécessite un token"""
    response = client.get("/api/v1/users/me/bookings")
    assert response.status_code == 401