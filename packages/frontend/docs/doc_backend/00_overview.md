# Backend Documentation for Frontend

## Purpose
This folder documents the backend that is live today and the changes planned for the V1 sprint. It focuses on data models and API contracts so the frontend can integrate safely.

## Base URL
- Domain : `https://staging.ganitel.com/`
- Swagger Documentation : `https://staging.ganitel.com/docs`
- REST base path: `/api/v1`
- OpenAPI and docs: `/openapi.json`, `/docs`, `/redoc` (enabled when `ENVIRONMENT != production`)

## Authentication
- Access tokens are JWTs sent in the `Authorization: Bearer <token>` header.
- Refresh token is stored in an HTTP-only cookie named `refresh_token`.
- Role gating:
  - traveler: booking endpoints
  - provider: service management endpoints
  - admin: admin, policy creation, refunds

## Common Response Patterns
- MessageResponse: `{ "message": string, "success": boolean }`
- Pagination: `{ "total", "page", "per_page", "pages" }`
- Service search response: `{ "services": [...], "pagination": {...}, "filters_applied": {...} }`
- Errors: JSON with `{ "detail": "..." }` and HTTP status codes.

## Identifiers and Timestamps
- All IDs are UUID strings.
- Timestamps are ISO 8601 datetime strings (from Python `datetime`).

## Uploads (current)
- Files are stored on the backend local filesystem under `uploads/`.
- Uploaded URLs are returned as relative paths under `/uploads/...`.
