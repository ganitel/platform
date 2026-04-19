---

## 1. Core Property & Localization

To support the "Sélectionnez votre destination" and "Type de propriété" screens, we need normalized tables for locations and types.

### **Properties**

- `id` (UUID, PK)
- `title` (String): e.g., "Residence Life · Apartment"
- `description` (Text): "American styled duplex..."
- `property_type_id` (FK): Links to `PropertyTypes`
- `location_id` (FK): Links to `Locations`
- `price_per_period` (Decimal): e.g., 240
- `period_label` (String): e.g., "7 Nights"
- `max_guests` (Integer): 4
- `bedroom_count` (Integer): 2
- `bathroom_count` (Integer): 2
- `living_room_count` (Integer): 2
- `balcony_count` (Integer): 2
- `host_id` (FK): Links to `Users`
- `check_in_time` (Time): "12 PM"
- `check_out_time` (Time): "12 PM"

### **Locations & PropertyTypes**

- **Locations:** `id`, `name` (Douala, Yaoundé, Buea, Limbe, Kribi)
- **PropertyTypes:** `id`, `name` (Apartment, Duplex, Villa, Studio, Room)

---

## 2. Dynamic Amenity System

The designs show a tabbed interface (General, Living Room, Main Bedroom) with specific icons and labels. A flexible categorization approach is best here.

### **AmenityCategories**

- `id` (UUID, PK)
- `name` (String): e.g., "General", "Living Room", "Main Bedroom", "Kitchen", "Security"

### **Amenities**

- `id` (UUID, PK)
- `category_id` (FK)
- `name_en` (String): e.g., "Wi-Fi"
- `name_fr` (String): e.g., "Wifi"
- `icon_url` (String): Path to the specific icon asset

### **Property_Amenities** (Join Table)

- `property_id` (FK)
- `amenity_id` (FK)

---

## 3. User & Social Proof

The "Meet your host" and "Ratings and Reviews" sections require detailed tracking of user metrics and multi-dimensional feedback.

### **Users**

- `id` (UUID, PK)
- `full_name` (String): "M. Jacques Zeh"
- `avatar_url` (String)
- `bio` (Text)
- `deals_completed` (Integer): 234
- `total_bookings_formatted` (String): "+123k booked"

### **Reviews & Detailed Ratings**

- `id` (UUID, PK)
- `property_id` (FK)
- `user_id` (FK)
- `comment` (Text)
- `rating_comfort` (Float)
- `rating_security` (Float)
- `rating_cleanliness` (Float)
- `rating_accessibility` (Float)
- `rating_communication` (Float)
- `rating_value` (Float)
- `rating_host_response` (Float)
- `created_at` (Timestamp)

---

## 4. Booking & Proximity Logic

### **Bookings (Negotiation Logic)**

- `id` (UUID, PK)
- `property_id` (FK)
- `guest_id` (FK)
- `start_date` (Date): 23 July
- `end_date` (Date): 30 July
- `status` (Enum): `PENDING`, `NEGOTIATING`, `CONFIRMED`, `CANCELLED`
- `negotiated_price` (Decimal): Nullable until a deal is struck.

### **Proximity (Accessibility)**

- `id` (UUID, PK)
- `property_id` (FK)
- `destination_name` (String): "Airport", "Restaurant", "Gym"
- `minutes_away` (Integer): 10
- `travel_mode` (String): "drive"

---


the new version should manage images through cloud (R2)

- **Config**: Add R2 settings to your config (access key, secret, account ID, bucket name, public base URL/CDN domain). Example fields: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` (e.g., `https://<bucket>.<account>.r2.cloudflarestorage.com` or a custom domain), and `R2_REGION` (usually `auto`).
- **Client setup**: Use `boto3` with the R2 S3-compatible endpoint: `endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"`, region `auto`, and the keys above. Keep a single client per process.
- **Service change**: Rewrite `UploadService` to stream directly to R2 instead of writing to disk. Steps inside `upload_image`:
  - Validate content type/size (reuse current checks).
  - Build a key like `f"{subdirectory}/{prefix}{uuid}.{ext}"`.
  - Use `boto3_client.put_object(Bucket=R2_BUCKET, Key=key, Body=bytes, ContentType=file.content_type)`.
  - Return `url=f"{R2_PUBLIC_BASE_URL}/{key}"` (or your CDN domain).
- **Multiple uploads**: Keep `upload_multiple_images` but let it call the new R2-backed `upload_image`.
- **Delete**: Update `delete_file` to call `delete_object` on the bucket; accept a key or parse it from the URL.
- **Static mount**: Remove or leave the uploads static mount unused; clients should use the R2/CDN URLs returned by the API.
- **Testing**: Add env vars in `.env`/deployment secrets; write a small integration test (mock `boto3` or use a local stub like `moto` if it supports custom endpoints) to assert `put_object` is called with the right bucket/key and URLs are formed correctly.


- enhance the coverage of the test suite. heres is how 
Recommendations for the test suite by environment (local, staging, prod):

Local (developer machine)
- Run full unit + integration suite against an isolated test DB (containerized Postgres).
- Allow destructive setup (drop/truncate) only in local when `TESTING=true`.
- Mock external services (payments, WhatsApp, email) by default.
- Use `pytest -m "not slow and not external"` as default dev loop.

Staging (Docker, pre-prod)
- Run unit + integration + E2E against staging containers with a dedicated staging DB/schema.
- For external services, prefer sandbox endpoints; never hit production.
- Allow non-destructive data setup; avoid global truncation.
- Run performance tests with controlled, tagged jobs (e.g., nightly).

Production (managed Postgres)
- No destructive tests, no DB resets, no data mutations beyond synthetic canaries.
- Only run smoke tests and synthetic health checks against prod API.
- Use read-only checks where possible (health, version, auth ping).
- Run load/perf tests against a prod-like staging clone, not prod.

Cross-cutting safeguards
- Hard-block tests unless `TESTING=true` and a dedicated test DB is configured.
- Add an explicit `ENVIRONMENT` gate to prevent any drop/truncate outside local.
- Centralize test DB/session overrides so all tests use the same safe connection.
- Separate markers: `unit`, `integration`, `e2e`, `slow`, `external`, `prod-smoke`.




- update the makefile to be like i like (my fav commands are make staging-build, make staging-test-all, make test-e2e (local env), make prod-up... ) identify the pattern and draft a new makefile struct


here are other enhancements to study

P0 — Must‑have before release
- Payment security hardening: verify Tranzak webhook signatures and enforce idempotency for webhooks/refunds to prevent replay/duplicate processing. Evidence: TODO in payments.py.
- Prevent double bookings at the data layer: add availability checks in repository plus a DB‑level exclusion/constraint for overlapping dates. Evidence: TODO in service_repository.py and booking overlap logic in booking.py.
- Remove or strictly gate default admin creation: the open admin creation endpoint is risky for production. 
we can create a scrip which first check if the specified env is live (docker local/staging and never prod) then create a different set of users with various roles and permissions 

- Auth abuse protection: add rate limiting and lockouts on login/OTP flows and normalize error messages to prevent user enumeration. Evidence: auth endpoints in auth.py.
- Upload validation: enforce MIME types, file size caps, extension allow‑list

P1 — High value 
- Observability: structured logs, request IDs, tracing and metrics (Prometheus/OpenTelemetry) for API, DB and external gateway calls. Evidence: no centralized logging/metrics middleware beyond i18n in i18n_middleware.py.
- Review aggregation consistency: recalculate and persist `average_rating` and `review_count` on review create/update/delete, and expose “host response rate” separately. Evidence: services read ratings but no update pipeline shown in service_repository.py and reviews in review.py.
- Amount/currency precision: avoid float conversions in payments/bookings, use `Decimal` consistently and store in minor units to prevent rounding errors. Evidence: float usage in create_booking.py and payment flows in payments.py.




anouther drafts to study too :


App purpose (inferred)
- Ganitel is a multi-service travel and hospitality platform for Cameroon: accommodation, vehicle rentals, dining, tours, wellness, and later flights, with traveler/provider/admin roles, bookings, and payments. This is stated in README.md and the product vision in 01_Project_Overview.md.

Test quality/reliability assessment
Strengths
- Solid coverage of core MVP flows (auth, users, services, bookings) at use-case, endpoint, and integration levels: test_auth_use_cases.py, test_users_use_cases.py, test_services_use_cases.py, test_bookings_use_cases.py, test_auth_endpoints.py, test_services_endpoints.py, test_bookings_endpoints.py, test_integration.py.
- Schema validation and status-transition rules are explicitly tested: test_validation.py, test_status_transitions.py.
- Repository tests exist, giving baseline persistence confidence: test_repositories.py.
- Performance and security suites are present, which is good for a production-grade target: test_api_performance.py, test_security.py.

Reliability risks and gaps
- High-risk DB side effects: the autouse session setup drops and truncates tables and can run in staging/production/CI if misconfigured, risking real data loss. See conftest.py.
- Default admin creation uses `SessionLocal` from database.py during app lifespan in main.py; when tests start the app, this can touch the real database even if `get_db` is overridden.
- The performance and security suites instantiate `TestClient(app)` directly without the test DB override, so they can hit the production DB and won’t see data created by `db_session`. See test_api_performance.py and test_security.py. This can make tests flaky or silently invalid.
- Concurrency in performance tests uses a shared `TestClient` across threads; the client isn’t thread-safe, so results can be nondeterministic. See test_api_performance.py.
- Database cleanup only truncates a small set of tables; any additional tables can leak state across tests, hurting isolation. See conftest.py.
- Critical auth flow not fully tested: refresh-token tests are skipped in both endpoint and use-case suites, leaving Redis-backed logic unverified. See test_auth_endpoints.py and test_auth_use_cases.py.
- Several security/perf checks accept very broad status codes, reducing assertion strength and making failures harder to detect. See test_security.py.

Coverage gaps vs app scope
- Payment gateway behavior, webhook handling, and fraud/rate-limiting are only loosely validated; no deterministic contract tests exist for Tranzak or webhook signatures.
- No meaningful tests for multi-service cart, package customization, provider admin workflows, notifications/WhatsApp flows, or localization—core to the stated product vision in 02_Functional_Specifications.md.

Priority recommendations
1. Hard-stop safeguards: refuse to run tests unless `TESTING=true` and a dedicated test database is configured; never run destructive setup when `ENVIRONMENT` is staging/production. Also disable `create_default_admin()` when testing. References: conftest.py, main.py, database.py.
2. Standardize test app creation: use a single test app factory that always overrides `get_db` and `SessionLocal` in all suites (including performance/security), and avoid raw `TestClient(app)` outside fixtures.
3. Fix isolation: truncate all tables dynamically from SQLAlchemy metadata or use per-test transactions with rollback.
4. Unskip and stabilize Redis-related refresh-token tests by using a local Redis fixture or test container.
5. Add targeted tests for payments/webhooks, cart/packages, and provider/admin flows to align with the product scope.



Gaps vs V1 needs
- Tranzak flow mismatches: missing token generation (`/auth/token`), missing `X-App-ID` header, payload/field names don’t match Tranzak (camelCase), response parsing expects `request_id` + `payment_url` (Tranzak returns `requestId` + `links.paymentAuthUrl`), verify endpoint path is wrong, refund endpoint doesn’t exist per docs, and webhook payload format/signature validation don’t match the Tranzak spec. Current flow is in tranzak_client.py and process_webhook.py.
- Data structures: no normalized `Locations`, `PropertyTypes`, `Properties` tables; service model uses loose `city/country` fields only. See service.py.
- Amenities: only `ServiceAmenity` exists (single table, no categories or join table). See service_amenity.py.
- Reviews: current `Review` is service‑based and lacks PO dimensions (`comfort`, `security`, `accessibility`, `host_response`) and property linkage. See review.py.
- Booking negotiation: `Negotiation` exists but booking status doesn’t include `NEGOTIATING`, and booking lacks `negotiated_price`. See booking.py and negotiation.py.
- Proximity entity is missing (no table/model).

V1 “what should be done” (sprint focus)
1) Fix Tranzak integration end‑to‑end  
   - Implement token flow + headers (`Authorization: Bearer {token}`, `X-App-ID`).  
   - Align create/verify/void/cancel endpoints + payload/response mapping.  
   - Store `requestId`, `paymentAuthUrl`, webhook `resource` data.  
   - Add webhook signature verification and correct status mapping.  
   - Update payment tests in test_payment_api.py.

2) Data model updates for PO requirements  
   - Add `Locations`, `PropertyTypes`, `Properties` + migrations.  
   - Add `AmenityCategories`, `Amenities`, `PropertyAmenities`.  
   - Add `Proximity`.  
   - Extend `Review` to include missing ratings; decide on property‑level vs service‑level reviews.

3) Booking negotiation alignment  
   - Add `NEGOTIATING` + `negotiated_price` to `Booking`.  
   - Wire negotiation flow to booking status transitions.

4) API/schema & seed data  
   - Update Pydantic schemas and endpoints to reflect new models.  
   - Seed `Locations`, `PropertyTypes`, amenities.  

