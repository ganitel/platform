# Architecture Overview — residence-backend-v2

Purpose
- Backend API for an accommodation marketplace (listings, bookings, payments, wallets, reviews, negotiations, referral & loyalty programs).

High-level components
- Express server (`app.js`) — bootstraps middleware, i18n, cron jobs, static uploads, routes and error handling.
- Routes — grouped under `/api/v1/`:
  - `routes/host` — host-only endpoints (listing management, host bookings, negotiations)
  - `routes/user` — user endpoints (bookings, reviews, wishlists, posts)
  - `routes/client` — public/client-facing endpoints
  - `routes/admin` — admin management endpoints
  - `routes/guest` — guest flows
  - `routes/payments` — payment provider callbacks and initiation
- Controllers — implement business logic per route (located in `controllers/`).
- Models — Sequelize models (located in `models/`) with migrations in `migrations/`.
- Middlewares — authentication, validation, file uploads, rate limiting.
- Utils — helpers, cron initializers, image handling and other utilities.

Data storage
- Relational database (MySQL) accessed via Sequelize. Key entities:
  - `User`, `Listing`, `Booking`, `Wallet`, `Transaction`, `Negotiation`, `Review`, `ListingImage`, `ListingDetail`, `Amenity`, `Rule`, `ListingCategory`, translation tables for i18n.

Design notes
- i18n implemented using translation tables and `i18n` package; controllers query translations by language code.
- Payments integrated with multiple providers (MTN, Orange, Tranzak) through routes/controllers.
- Cron jobs are used for scheduled tasks (initialized at server startup).
- Security middlewares are present (`helmet`, `express-rate-limit`, CORS). Password hashing should be verified (see `SECURITY.md`).

When to change architecture
- If the API load grows: consider separating read-heavy listing queries into a read-replica or introducing caching (Redis) for listing retrieval.
- If concurrent background work grows: move cron jobs into worker processes (BullMQ/Redis + separate worker service).

