# API Reference — residence-backend-v2 (high-level)

This document gives a high-level map of important endpoints and example request shapes (non-exhaustive). Use the code in `routes/` and `controllers/` for exact request/response details.

Base URL: `/api/v1/`

Auth
- JWT-based auth. Tokens generated in `models/user.js` using secrets from env.

Guest & Client
- `/api/v1/guest` — guest flows (public listing search, quick actions)
- `/api/v1/client` — client-facing endpoints (search listings, public details)

Hosts (protected — `verifyGuestToken` middleware)
- `/api/v1/hosts/` — host routes
  - `GET /hosts/` — list host listings
  - `POST /hosts/:id/clone` — clone a listing
  - `POST /hosts/new` — create a new listing (body: { typeId, price })
  - `PUT /hosts/:id/photos` — upload listing photos (multipart)
  - `PUT /hosts/:id/price` — update pricing
  - `PUT /hosts/:id/content` — update content/description

Users (protected)
- `/api/v1/users/bookings` — manage bookings
  - `POST /users/bookings` — new booking
  - `POST /users/bookings/:id/payment` — initiate booking payment
  - `POST /users/bookings/:id/cancel` — cancel booking
- `/api/v1/users/reviews` — add/update/delete reviews
- `/api/v1/users/wishlists` — add or remove listing from wishlist

Payments
- `/api/v1/payments/tranzak` — tranzak endpoints (init, verify, cancel, success)
- `/api/v1/payments/mtn` — MTN callbacks
- `/api/v1/payments/orange` — Orange callbacks

Static files
- `/uploads/*` and `/api/v1/uploads/*` — listing images and other user-uploaded files

Notes
- See `routes/` for full list; controllers contain validation and response formats.
- Many endpoints accept `userId` query/body overrides for admin/testing flows.

