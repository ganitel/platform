# Sprint Backlog — V1 Release

## Goal
Deliver the V1 data model, payment flow, storage, and test safety required by the PO inputs and sprint notes.

## Scope Overview
**P0 (must deliver this sprint)**
1. Tranzak payment flow alignment + webhook security + tests
2. Core property model with normalized locations + property types
3. Dynamic amenity system with categories and property links
4. Booking negotiation alignment (status + negotiated price)
5. Proximity model for accessibility
6. Review model alignment with V1 rating dimensions
7. API + schema updates for new models
8. Seed data (locations, property types, amenities)
9. Test suite hardening and coverage upgrades
10. Upload validation + move images to Cloudflare R2
11. Gate default admin creation and add safe bootstrap scripts
12. Makefile updates with preferred commands
13. Availability overlap enforcement at DB level
14. Auth abuse protection (rate limiting + enumeration hardening)
15. Legacy data migration (post‑schema) — see migration plan

**P1 (stretch / next sprint if time allows)**
1. Review aggregation pipeline (avg rating, counts)
2. Observability baseline (request IDs, structured logs)
3. Amount/currency precision (Decimal + minor units)09

---

## Epic 1 — Tranzak Payments End‑to‑End
**Objective:** Align integration with Tranzak API spec and secure webhooks.

### P0‑1.1 Implement Tranzak auth token flow
**Current state**: Tranzak client uses Authorization with API key and no token exchange. See [app/infrastructure/external_apis/tranzak_client.py](app/infrastructure/external_apis/tranzak_client.py).

**Change**
- Add token retrieval from /auth/token.
- Cache token with expiry and refresh when needed.
- Update headers to include Authorization Bearer token and X‑App‑ID.

**Acceptance criteria**
- Token retrieved once per expiry window.
- All Tranzak API calls include the correct headers.

### P0‑1.2 Align create/verify/cancel/void endpoints and payload mapping
**Current state**: Uses /request/create, /request/details/{id}, /request/refund with legacy response mapping. See [app/infrastructure/external_apis/tranzak_client.py](app/infrastructure/external_apis/tranzak_client.py).

**Change**
- Update verify endpoint to GET /request/details?requestId=...
- Add cancel/void endpoints as required by the spec.
- Update response parsing to use requestId and links.paymentAuthUrl.

**Acceptance criteria**
- Initiate payment returns requestId and paymentAuthUrl.
- Verify uses query string format and returns correct status.
- Cancel/void endpoints wired in client and use cases.

### P0‑1.3 Webhook signature verification + idempotency
**Current state**: Signature verification is TODO. See [app/api/v1/endpoints/payments.py](app/api/v1/endpoints/payments.py).

**Change**
- Validate webhook signature per Tranzak spec.
- Add idempotency using requestId or provider event IDs to avoid double processing.

**Acceptance criteria**
- Invalid signatures return 200 with success=false.
- Duplicate webhook calls do not re‑apply booking/payment changes.

### P0‑1.4 Update payment tests for new flow
**Current state**: Webhook test is skipped. See [tests/integration/payments/test_payment_api.py](tests/integration/payments/test_payment_api.py).

**Change**
- Unskip webhook tests and update payloads to match Tranzak spec.
- Add tests for token, initiate, verify, cancel/void paths.

**Acceptance criteria**
- Payment integration tests pass.
- Webhook processing validated for success/failure.

---

## Epic 2 — Core Property & Localization
**Objective:** Replace loose country/city fields with normalized Location and PropertyType plus a first‑class Property entity.

### P0‑2.1 Add normalized tables: Locations, PropertyTypes, Properties
**Current state**: Service stores country and city, no normalized location/type tables. See [app/domain/entities/service.py](app/domain/entities/service.py).

**Change**
- Add entities/migrations for Location, PropertyType, Property.
- Link Property to Location and PropertyType.
- Add property features from PO (bedrooms, bathrooms, living rooms, balcony count, etc.).

**Acceptance criteria**
- New tables exist with FK relationships.
- Migration runs cleanly from empty DB.
- Properties can be created with location_id and property_type_id.

### P0‑2.2 Update service/property APIs and schemas
**Current state**: ServiceCreateRequest expects country/city and accommodation_type. See [app/api/v1/schemas/service_schemas.py](app/api/v1/schemas/service_schemas.py).

**Change**
- Create property schemas if needed.
- Replace country/city with location_id.
- Replace accommodation_type with property_type_id.

**Acceptance criteria**
- API accepts new fields and returns location/type objects.
- Legacy fields are removed or clearly deprecated.

### P0‑2.3 Seed data for Locations and PropertyTypes
**Change**
- Seed locations: Douala, Yaoundé, Buea, Limbe, Kribi.
- Seed property types: Apartment, Duplex, Villa, Studio, Room.

**Acceptance criteria**
- Seed script loads data without duplicates.
- IDs are used in create/update flows.

---

## Epic 16 — Legacy Data Migration (P0, after schema)
**Objective:** Migrate legacy MySQL data into the new V1 schema once all schema changes are applied.

**Reference:** [01_docs/01_v1/sprint_planning/backlog/migration_plan.md](01_docs/01_v1/sprint_planning/backlog/migration_plan.md)

### P0‑16.1 Execute legacy migration (post‑schema)
**Dependency:** Must run **after** Epics 2–7 (schema + API + seed data).

**Change**
- Run the ETL migration according to the migration plan.
- Load properties, locations, property types, amenities, and users.
- Preserve whitelisted legacy metadata and ensure idempotence.

**Acceptance criteria**
- Migration completes without duplication on re‑run.
- Validation report generated (counts + FK integrity).
- Migrated properties are visible in API.

---

## Epic 3 — Dynamic Amenity System
**Objective:** Support categorized amenities with icons and property mapping.

### P0‑3.1 Add AmenityCategories and Amenities tables
**Current state**: Single ServiceAmenity table with amenity_type. See [app/domain/entities/service_amenity.py](app/domain/entities/service_amenity.py).

**Change**
- Add AmenityCategory and Amenity tables with name_en, name_fr, and icon path.

**Acceptance criteria**
- Categories and amenities can be queried by category.

### P0‑3.2 Add PropertyAmenities join table
**Change**
- Add join table linking Property to Amenity.
- Remove or deprecate Service.amenities array usage.

**Acceptance criteria**
- Property responses list amenities grouped by category.
- Add/update property endpoints support amenity IDs.

### P0‑3.3 Seed amenity categories + amenities
**Change**
- Seed categories (General, Living Room, Main Bedroom, Kitchen, Security).
- Seed initial amenity list with icons.

**Acceptance criteria**
- Seed data visible through API.

---

## Epic 4 — Reviews & Ratings
**Objective:** Align reviews with PO rating dimensions.

### P0‑4.1 Extend review ratings
**Current state**: Ratings include cleanliness, communication, checkin, accuracy, location, value only. See [app/domain/entities/review.py](app/domain/entities/review.py).

**Change**
- Add comfort, security, accessibility, host_response rating fields.
- Decide if reviews should be property‑scoped or service‑scoped.

**Acceptance criteria**
- DB migrations add new columns.
- Schemas accept and return new rating fields.

### P1‑4.2 Review aggregation pipeline
**Change**
- Update average rating and review count on review create/update/delete.

**Acceptance criteria**
- Service/property ratings update immediately after review operations.

---

## Epic 5 — Booking Negotiation
**Objective:** Support negotiation status and price in bookings.

### P0‑5.1 Add NEGOTIATING status and negotiated_price
**Current state**: BookingStatus lacks negotiation and no negotiated_price field. See [app/domain/entities/booking.py](app/domain/entities/booking.py).

**Change**
- Add NEGOTIATING to the enum.
- Add negotiated_price field to Booking.

**Acceptance criteria**
- Migrations apply cleanly.
- Booking can move to NEGOTIATING.

### P0‑5.2 Wire negotiation acceptance to booking state
**Current state**: Negotiation exists but not connected to booking transitions. See [app/domain/entities/negotiation.py](app/domain/entities/negotiation.py).

**Change**
- When negotiation accepted, set booking status accordingly.
- Persist the accepted price in negotiated_price.

**Acceptance criteria**
- Negotiation acceptance updates booking correctly.

---

## Epic 6 — Proximity (Accessibility)
**Objective:** Provide proximity metadata for properties.

### P0‑6.1 Add Proximity entity/table
**Current state**: no proximity model or table.

**Change**
- Add Proximity entity with destination_name, minutes_away, travel_mode, property_id.

**Acceptance criteria**
- Proximities can be created and returned in property detail.

---

## Epic 7 — API, Schemas, and Migrations
**Objective:** Ensure API matches new models and migration plan is consistent.

### P0‑7.1 Update API endpoints + schemas
**Change**
- Add endpoints for Locations, PropertyTypes, Amenities, Proximities.
- Update property/service endpoints to use new schema.

**Acceptance criteria**
- Updated OpenAPI reflects new endpoints and fields.

### P0‑7.2 Alembic migrations
**Change**
- Create migrations for all new tables and fields.

**Acceptance criteria**
- All migrations apply in order on a clean database.

---

## Epic 8 — Tests, Safety, and Coverage
**Objective:** Harden tests and increase coverage per sprint notes.

### P0‑8.1 Test environment guardrails
**Change**
- Hard‑stop tests unless TESTING=true and a dedicated test DB is configured.
- Block destructive setup when ENVIRONMENT is staging/production.
- Disable create_default_admin during tests.

**Acceptance criteria**
- Tests refuse to run when safety conditions are not met.

### P0‑8.2 Standardized test app factory
**Change**
- Use a single app factory that always overrides get_db and SessionLocal.
- Remove direct TestClient(app) usage from performance/security suites.

**Acceptance criteria**
- All suites use the same test DB and fixtures.

### P0‑8.3 Isolation fixes
**Change**
- Truncate all tables dynamically or use per‑test transactions with rollback.

**Acceptance criteria**
- No cross‑test state leakage.

### P0‑8.4 Unskip and stabilize refresh‑token tests
**Change**
- Add Redis fixture or test container and unskip refresh‑token tests.

**Acceptance criteria**
- Refresh‑token tests pass locally and in CI.

### P0‑8.5 Payment, booking, review tests updated
**Change**
- Update payment payloads for Tranzak spec.
- Add tests for NEGOTIATING and negotiated_price.
- Add tests for new review rating fields.

**Acceptance criteria**
- Payment, booking, and review suites pass.

### P0‑8.6 Enhance overall test coverage
**Change**
- Add targeted tests for payment/webhook signatures and fraud/rate‑limiting.

**Acceptance criteria**
- Coverage improves on payment and security flows.

---

## Epic 9 — Availability Overlap Enforcement
**Objective:** Prevent double bookings at the data layer.

### P0‑9.1 DB‑level overlap constraint
**Change**
- Add exclusion/constraint to prevent overlapping bookings per property/service.

**Acceptance criteria**
- Overlapping booking attempt fails at DB level.

---

## Epic 10 — Auth Abuse Protection
**Objective:** Reduce account enumeration and brute‑force risk.

### P0‑10.1 Rate limiting and lockouts
**Change**
- Add rate limiting and lockouts for login/OTP flows.
- Normalize error messages to avoid user enumeration.

**Acceptance criteria**
- Excessive attempts are throttled with consistent error responses.

---

## Epic 11 — Upload Validation + Cloudflare R2
**Objective:** Enforce upload safety and move storage to R2.

### P0‑11.1 Upload validation
**Change**
- Enforce MIME type allow‑list, file size caps, and extension validation.

**Acceptance criteria**
- Invalid uploads are rejected with clear errors.

### P0‑11.2 R2 storage integration
**Change**
- Add R2 config keys (account ID, access key, secret, bucket, public base URL, region).
- Use boto3 S3‑compatible client with R2 endpoint.
- Update UploadService to stream to R2 and return CDN URL.
- Update delete flow to delete from R2.

**Acceptance criteria**
- Uploads return R2 URLs and files are stored in the bucket.
- Deletes remove R2 objects.

---

## Epic 12 — Admin Bootstrap Safety
**Objective:** Prevent unsafe admin creation in production.

### P0‑12.1 Gate default admin creation
**Change**
- Disable default admin creation in production.
- Add a safe script that checks environment and creates role‑based users only in local/staging.

**Acceptance criteria**
- No admin creation occurs in production.

---

## Epic 13 — Makefile Updates
**Objective:** Align Makefile with preferred commands.

### P0‑13.1 Add preferred Makefile commands
**Change**
- Add or update targets: staging-build, staging-test-all, test-e2e (local env), prod-up.

**Acceptance criteria**
- Make targets run expected workflows without manual edits.

---

## Epic 14 — Observability (P1)
**Objective:** Add baseline logging and tracing.

### P1‑14.1 Structured logs + request IDs
**Change**
- Add request ID middleware and structured logging.

**Acceptance criteria**
- All API requests log a request ID.

---

## Epic 15 — Amount/Currency Precision (P1)
**Objective:** Remove float conversions in payments/bookings.

### P1‑15.1 Decimal/minor units
**Change**
- Use Decimal consistently and store minor units where applicable.

**Acceptance criteria**
- No float conversion in payment/booking calculations.

---

## Dependencies / Risks
- Tranzak specification must be confirmed (endpoints, headers, signature scheme).
- Migration path from existing Service records to Property model.
- Ensure production DB safety if destructive migration steps are required.

## Definition of Done
- All P0 epics merged on develop.
- All new migrations applied in staging.
- Test suite passes for unit + integration.
- PO data requirements demonstrably present in schema and API.
