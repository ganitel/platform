# V1 Sprint Changes (Planned)

This section summarizes the V1 sprint backlog and tickets. It describes what will change for frontend integration.

## Status Matrix (Live Now vs V1)
| Area | Live Now | V1 Sprint Outcome |
| --- | --- | --- |
| Core listings | Service model with `country`/`city` and `accommodation_type` | Property model with `Location` and `PropertyType` refs, property features expanded |
| Amenities | `services.amenities` string list | Amenity categories + amenities + property_amenities join table |
| Booking negotiation | No `NEGOTIATING` status | Add `NEGOTIATING` status and `negotiated_price` field |
| Reviews | Basic ratings only | Add comfort, security, accessibility, host_response ratings (property scope pending) |
| Payments (Tranzak) | API key header, legacy endpoints | Token flow, updated endpoints, webhook signature + idempotency |
| Uploads | Local filesystem, basic MIME and size checks | Strong validation + upload to Cloudflare R2, CDN URLs |
| Auth abuse protection | No rate limit | Rate limiting, lockouts, and normalized error messages |
| Availability overlap | Unique constraint only | DB-level overlap constraint (no double bookings) |
| Admin bootstrap | Default admin created on startup + public endpoint | Gated by environment, safe script only |
| Reference data | None | Seeded locations, property types, amenity categories |
| Legacy migration | Manual | Idempotent ETL migration per plan |

## Data Model Changes
- New tables:
  - `locations` (normalized cities)
  - `property_types` (Apartment, Duplex, Villa, Studio, Room)
  - `properties` (core listing entity)
  - `amenity_categories`, `amenities`, `property_amenities`
  - `proximities` (destination name, minutes, travel mode)
- Review additions: `comfort`, `security`, `accessibility`, `host_response` rating fields (property/service scope to be confirmed)
- Booking additions: `NEGOTIATING` status + `negotiated_price`

## API and Schema Changes
- New read endpoints:
  - `/locations`, `/property-types`, `/amenities`, `/proximities`
- Service/Property create and update will change:
  - replace `country` and `city` with `location_id`
  - replace `accommodation_type` with `property_type_id`
  - return nested location and type objects
- Property responses will include amenities grouped by category and proximities

## Payment Flow (Tranzak)
- Add auth token retrieval (`/auth/token`) and cache with expiry
- Headers become `Authorization: Bearer <token>` plus `X-App-ID`
- Update endpoints:
  - Verify: `GET /request/details?requestId=...`
  - Add cancel/void operations
- Response mapping uses `requestId` and `links.paymentAuthUrl`
- Webhook security:
  - Signature verification
  - Idempotency using `requestId` or provider event IDs

## Uploads
- Strong validation: MIME allowlist, extension check, size caps
- Store files in Cloudflare R2 (S3-compatible) and return CDN URLs
- Delete flow will remove objects from R2

## Booking Overlap
- DB-level exclusion constraint to prevent overlapping bookings per property

## Auth Abuse Protection
- Rate limiting and lockout for login/OTP
- Uniform error messages to prevent user enumeration

## Admin Bootstrap Safety
- No default admin creation in production
- Public admin creation endpoint replaced with a guarded script

## Seed Data
- Locations: Douala, Yaounde, Buea, Limbe, Kribi
- Property types: Apartment, Duplex, Villa, Studio, Room
- Amenity categories and default amenities with icons

## Legacy Migration (Post-Schema)
- ETL migration will import legacy users, properties, locations, and amenities
- Idempotent runs with mapping tables and migration reports

## Frontend Impact Checklist
- Replace service creation fields with `location_id` and `property_type_id` once V1 is live
- Update review forms to include new rating dimensions
- Update booking UI to handle `NEGOTIATING` status and `negotiated_price`
- Update payment integration to use `requestId` + `paymentAuthUrl` and handle webhook signature errors
- Update upload handling to expect R2 URLs and validation errors
- Add UI for proximity and amenity categories
