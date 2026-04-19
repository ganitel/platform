"""
Ganitel V2 Backend - Main API Router
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, users, services, health, admin, bookings, payments,
    wallets, reviews, wishlists, notifications, coupons, complaints, upload,
    surveys, policies, support_requests, analytics, reference_data
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(wallets.router)
api_router.include_router(reviews.router)
api_router.include_router(wishlists.router)
api_router.include_router(notifications.router)
api_router.include_router(coupons.router)
api_router.include_router(complaints.router)
api_router.include_router(upload.router)
api_router.include_router(surveys.router)
api_router.include_router(policies.router)
api_router.include_router(support_requests.router)
api_router.include_router(analytics.router)
api_router.include_router(reference_data.router, prefix="/reference")
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])