"""
Ganitel V2 Backend - Search Services Use Case
"""
from typing import Optional, List, Dict, Any
from datetime import date
from uuid import UUID

from app.domain.entities.service import ServiceType
from app.domain.repositories.service_repository import IServiceRepository

class SearchServicesUseCase:
    """Use case for searching services with various filters"""

    def __init__(self, service_repository: IServiceRepository):
        self.service_repository = service_repository

    def execute(
        self,
        query: Optional[str] = None,
        service_type: Optional[ServiceType] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        amenities: Optional[List[str]] = None,
        max_guests: Optional[int] = None,
        check_in: Optional[date] = None,
        check_out: Optional[date] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[float] = None,
        sort_by: str = "relevance",
        skip: int = 0,
        limit: int = 20,
    ) -> Dict[str, Any]:
        services = []
        total = 0

        if query:
            services = self.service_repository.search_services(
                query=query,
                service_type=service_type,
                country=country,
                city=city,
                min_price=min_price,
                max_price=max_price,
                amenities=amenities,
                skip=skip,
                limit=limit,
            )
            total = self.service_repository.count({"status": "active"})
        elif latitude and longitude and radius_km:
            services = self.service_repository.get_nearby_services(
                latitude=latitude,
                longitude=longitude,
                radius_km=radius_km,
                service_type=service_type,
                skip=skip,
                limit=limit,
            )
            total = len(services)
        elif check_in and check_out:
            services = self.service_repository.get_available_services(
                check_in=check_in,
                check_out=check_out,
                guests=max_guests,
                service_type=service_type,
                country=country,
                city=city,
                skip=skip,
                limit=limit,
            )
            total = len(services)
        else:
            criteria = {"status": "active"}
            if service_type:
                criteria["service_type"] = service_type.value
            if country:
                criteria["country"] = country
            if city:
                criteria["city"] = city
            
            services = self.service_repository.find_by_criteria(criteria, skip=skip, limit=limit)
            total = self.service_repository.count(criteria)

        # Convert services to dict format
        services_data = []
        for service in services:
            services_data.append({
                "id": str(service.id),
                "title": service.title,
                "description": service.description,
                "service_type": service.service_type,
                "base_price": float(service.base_price),
                "currency": service.currency,
                "country": service.country,
                "city": service.city,
                "images": service.images or [],
            })

        pages = (total + limit - 1) // limit if limit > 0 else 1
        current_page = (skip // limit) + 1 if limit > 0 else 1

        return {
            "services": services_data,
            "pagination": {
                "total": total,
                "page": current_page,
                "per_page": limit,
                "pages": pages,
                "has_next": current_page < pages,
                "has_prev": current_page > 1,
            },
            "filters_applied": {
                "query": query,
                "service_type": service_type.value if service_type else None,
                "location": f"{city}, {country}" if city and country else None,
                "price_range": f"{min_price}-{max_price}" if min_price and max_price else None,
                "amenities": amenities,
                "guests": max_guests,
                "dates": f"{check_in} to {check_out}" if check_in and check_out else None,
            },
        }

