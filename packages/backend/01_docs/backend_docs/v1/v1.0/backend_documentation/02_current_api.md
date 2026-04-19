# Current API (Live Now)

Base path: `/api/v1`

## Health
- `GET /health` basic health
- `GET /health/detailed` checks DB and Redis

## Auth (`/auth`)
- `POST /auth/register` (UserCreateRequest)
  - fields: `email`, `phone`, `password`, `first_name`, `last_name`, `user_type`, `country`, `city`
- `POST /auth/login` (UserLoginRequest)
  - fields: `identifier`, `password`
  - returns `TokenResponse` and sets `refresh_token` cookie
- `POST /auth/logout` (auth)
- `POST /auth/refresh-token`
  - refresh token from cookie or `refresh_token` query param
- `POST /auth/forgot-password` (ForgotPasswordRequest)
- `GET /auth/verify-reset-token/{token}`
- `POST /auth/reset-password` (ResetPasswordRequest)
- `GET /auth/oauth/google/url`
- `GET /auth/oauth/google/callback?code=...`
- `GET /auth/oauth/facebook/url`
- `GET /auth/oauth/facebook/callback?code=...`

## Users (`/users`)
- `GET /users/me` (auth) -> UserResponse
- `PUT /users/me` (auth) UserUpdateRequest
- `GET /users/me/bookings` (auth) -> BookingListResponse
- `POST /users/me/change-password` (auth)
- `GET /users/{user_id}` -> UserPublicResponse
- `GET /users` (admin) list users with filters: `search`, `user_type`, `status`
- `PUT /users/{user_id}/status` (admin) query param `new_status`

## Services (`/services`)
- `GET /services/search`
  - query params: `q`, `service_type`, `country`, `city`, `min_price`, `max_price`, `amenities`, `guests`, `check_in`, `check_out`, `lat`, `lng`, `radius`, `sort`, `page`, `per_page`
  - response: ServiceSearchResponse
- `GET /services` list services (filters: `service_type`, `country`, `city`)
- `GET /services/{service_id}` -> ServiceResponse
- `POST /services` (provider) ServiceCreateRequest
- `PUT /services/{service_id}` (provider) ServiceUpdateRequest
- `DELETE /services/{service_id}` (provider)
- `GET /services/provider/my-services` (provider)
- `GET /services/featured`

### ServiceResponse shape
- `location`: `{ country, city, address, latitude, longitude }`
- `pricing`: `{ base_price, currency, price_per }`
- `capacity`: `{ max_guests, bedrooms, bathrooms, beds }`
- `rating`: `{ average, count }`
- `booking_info`: `{ instant_book, min_stay, max_stay, check_in_time, check_out_time }`
- `stats`: `{ view_count, booking_count }`

## Bookings (`/bookings`)
- `POST /bookings` (traveler) BookingCreateRequest
- `GET /bookings/{booking_id}` (auth)
- `GET /bookings/users/me/` (traveler)
- `PUT /bookings/{booking_id}/cancel` (traveler)

## Payments (`/payments`)
- `POST /payments/initiate` (auth) PaymentInitiateRequest
- `POST /payments/webhook/tranzak` (public) PaymentWebhookRequest
- `GET /payments/{payment_id}` (auth)
- `GET /payments` (auth)
- `POST /payments/{payment_id}/refund` (admin) PaymentRefundRequest

### PaymentInitiateResponse
- `payment_id`, `transaction_id`, `payment_url`, `amount`, `currency`, `status`, `message`

## Reviews (`/reviews`)
- `POST /reviews` (auth) ReviewCreateRequest
- `GET /reviews/services/{service_id}`

## Uploads (`/upload`)
- `POST /upload/image` (auth, multipart form)
  - fields: `file`, optional `subdirectory`
  - validation: content type in jpeg/png/jpg/webp, max size 10MB
  - response: `{ message, url, filename, size }`
- `POST /upload/images` (auth, multipart form)
  - fields: `files[]`, optional `subdirectory`
  - validation: same as single upload
  - response: `{ message, files: [{ url, filename, size }] }`

## Wishlists (`/wishlists`)
- `POST /wishlists/services/{service_id}/toggle` (auth)
- `GET /wishlists/me` (auth)

## Notifications (`/notifications`)
- `GET /notifications/me` (auth)
- `GET /notifications/me/unread-count` (auth)
- `POST /notifications/{notification_id}/read` (auth)
- `POST /notifications/me/read-all` (auth)

## Wallets (`/wallets`)
- `POST /wallets` (auth)
- `GET /wallets/me` (auth)
- `POST /wallets/me/add-balance` (auth) AddBalanceRequest

## Coupons (`/coupons`)
- `POST /coupons/apply` (auth) ApplyCouponRequest
- `GET /coupons/active`

## Policies (`/policies`)
- `POST /policies` (admin) PolicyCreateRequest
- `GET /policies` (optional query `policy_type`)
- `GET /policies/{slug}`

## Surveys (`/surveys`)
- `POST /surveys` (admin) SurveyCreateRequest
- `GET /surveys/active`

## Complaints (`/complaints`)
- `POST /complaints` (auth) ComplaintCreateRequest
- `GET /complaints/me` (auth)

## Support Requests (`/support-requests`)
- `POST /support-requests` (auth) SupportRequestCreateRequest
- `GET /support-requests/me` (auth)

## Analytics (`/analytics`)
- `POST /analytics/track-view` (auth)
- `GET /analytics/views/{entity_type}/{entity_id}/count`

## Admin (`/admin`)
- `GET /admin/stats` (admin)
- `POST /admin/create-default-admin` (public, legacy)
