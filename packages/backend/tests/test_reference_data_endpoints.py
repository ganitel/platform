"""
Ganitel V2 Backend - Reference Data Endpoints Tests
"""
from fastapi import status


def test_reference_locations_route_with_single_prefix(client):
    response = client.get("/api/v1/reference/locations")
    assert response.status_code == status.HTTP_200_OK


def test_reference_locations_route_double_prefix_not_found(client):
    response = client.get("/api/v1/api/v1/reference/locations")
    assert response.status_code == status.HTTP_404_NOT_FOUND
