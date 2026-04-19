Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/domain/entities)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/router.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/services.py#1-1), lines 1 to 200

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/bookings.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/payments.py#1-1), lines 1 to 240

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/reviews.py)

Searched for regex `TODO|FIXME|HACK|XXX` (`**/app/**`), 2 results

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/dependencies.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/config.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/middleware/i18n_middleware.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/infrastructure/repositories/service_repository.py#1-1), lines 1 to 280

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/infrastructure/repositories/service_repository.py#280-280), lines 280 to 414

Searched for regex `pass|NotImplemented|TODO` (`**/app/application/use_cases/**`), 20 results

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/schemas)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/domain/entities/booking.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/domain/entities/review.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/wallets.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/notifications.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/wishlists.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/admin.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/payments)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/notifications)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/wishlists)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/coupons)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/coupons.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/coupons/apply_coupon.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/analytics.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/upload.py)

Searched for regex `TODO|FIXME|HACK|XXX|pass\s*$|NotImplementedError` (`**/*.py`), 20 results

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/infrastructure/services/i18n_service.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/bookings/create_booking.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/bookings/cancel_booking.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/services/search_services.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/application/use_cases/auth/login_user.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/policies.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/support_requests.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/surveys.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/complaints.py)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/translations)

Read [](file:///d%3A/Projets/perso/Ganitel/ganitel-backend/app/api/v1/endpoints/auth.py#1-1), lines 1 to 260

Based on the attached V1 plan (PO_needed_data.md) and a scan of the current codebase, here are additional enhancements to consider, sorted by priority and excluding the already‑planned items.

P0 — Must‑have before release
- Payment security hardening: verify Tranzak webhook signatures and enforce idempotency for webhooks/refunds to prevent replay/duplicate processing. Evidence: TODO in payments.py.
- Prevent double bookings at the data layer: add availability checks in repository plus a DB‑level exclusion/constraint for overlapping dates. Evidence: TODO in service_repository.py and booking overlap logic in booking.py.
- Remove or strictly gate default admin creation: the open admin creation endpoint is risky for production. Evidence: admin.py and auto admin creation on startup in main.py.
- Auth abuse protection: add rate limiting and lockouts on login/OTP flows and normalize error messages to prevent user enumeration. Evidence: auth endpoints in auth.py.
- Upload validation: enforce MIME types, file size caps, extension allow‑list, and optional malware scanning; generate signed URLs instead of direct local storage for production. Evidence: upload.py.

P1 — High value soon after release
- Observability: structured logs, request IDs, tracing and metrics (Prometheus/OpenTelemetry) for API, DB and external gateway calls. Evidence: no centralized logging/metrics middleware beyond i18n in i18n_middleware.py.
- i18n actualization: translations directory is missing; add translation files and use `I18nService` for error messages/UX strings. Evidence: i18n_service.py.
- Review aggregation consistency: recalculate and persist `average_rating` and `review_count` on review create/update/delete, and expose “host response rate” separately. Evidence: services read ratings but no update pipeline shown in service_repository.py and reviews in review.py.
- Amount/currency precision: avoid float conversions in payments/bookings, use `Decimal` consistently and store in minor units to prevent rounding errors. Evidence: float usage in create_booking.py and payment flows in payments.py.
- Background jobs for notifications/email/SMS/WhatsApp and webhook retries (Celery/Redis or RQ) instead of inline HTTP calls. Evidence: notification endpoints exist but no delivery pipeline in notifications.py.

P2 — Medium priority / scale optimizations
- Geo search performance: replace Haversine queries with PostGIS and add spatial indexes for service search and proximity. Evidence: Haversine calc in service_repository.py.
- Admin moderation flows: review/service moderation queues, complaint resolution workflows, audit trail for admin actions. Evidence: only stats and default admin in admin.py.
- Data retention & compliance: soft‑delete retention policies, anonymization, and user data export/delete workflows.
- Feature flags & A/B testing hooks for rollout of new marketplace features (pricing rules, promos, UX experiments).
- Caching strategy: read‑heavy endpoints (search, service detail, policies) can benefit from Redis caching and CDN headers.

If you want, I can convert these into a prioritized backlog with scopes, acceptance criteria, and estimated effort.