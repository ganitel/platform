# Current Data Model (Live Now)

## Base Fields
Most entities inherit:
- `id` (UUID)
- `created_at`, `updated_at`
- `is_active`
Soft-delete entities also include `deleted_at`, `deleted_by`.

## Users
- `email`, `phone`, `hashed_password`
- `user_type`: traveler | provider | admin
- `status`: active | inactive | suspended | pending_verification
- `is_verified`
- `profile_picture`, `bio`
- `country`, `city`
- `language` (default fr), `currency` (default XAF)
- `reset_password_token`, `reset_password_expires_at`
- OAuth fields: `auth_type`, `oauth_id`, `oauth_provider`

## Services (Listings)
- `title`, `description`, `short_description`
- `service_type`: accommodation | tour | activity | transport | dining | wellness
- `accommodation_type`: hotel | apartment | house | villa | guesthouse | hostel | resort | lodge
- `status`: draft | pending_review | active | inactive | rejected | archived
- Provider: `provider_id`
- Location: `country`, `city`, `address`, `latitude`, `longitude`
- Pricing: `base_price`, `currency`, `price_per`
- Capacity: `max_guests`, `bedrooms`, `bathrooms`, `beds`
- Arrays: `amenities` (string list), `house_rules` (string list), `images` (string list)
- Media: `videos`, `virtual_tour_url`
- Stats: `view_count`, `booking_count`, `average_rating`, `review_count`
- Availability: `availability_calendar` (JSON), `blocked_dates` (string list)

## Bookings
- `user_id`, `service_id`
- `start_date`, `end_date`, `guests`
- `status`: pending | confirmed | cancelled | failed | completed
- `total_amount`, `currency`, `notes`
- Unique constraint: `(service_id, user_id, start_date, end_date)`

## Negotiations
- `booking_id`, `service_id`, `user_id`, `provider_id`
- `original_price`, `proposed_price`, `currency`
- `status`: pending | accepted | rejected | countered | expired | cancelled
- `message`, `counter_price`, `counter_message`, `expires_at`

## Payments
- `booking_id`, `amount`, `currency`
- `provider`: tranzak | mobile_money | card
- `transaction_id`, `status`: pending | completed | failed | refunded
- `payment_method`, `provider_response`, `error_message`
- Refund fields: `refund_amount`, `refund_reason`, `refunded_at`

## Reviews
- `service_id`, `user_id`, `booking_id`
- Ratings: `overall_rating`, `cleanliness_rating`, `communication_rating`, `checkin_rating`, `accuracy_rating`, `location_rating`, `value_rating`
- `title`, `comment`, `status`
- Unique: one review per user per service

## Wallets and Transactions
- Wallet: `user_id`, `current_balance`, `withdrawn`, `received`, `gross_balance`, `deposits`, `bonuses`
- Transaction: `user_id`, `wallet_id`, `booking_id`, `payment_id`, `transaction_type`, `amount`, `currency`, `status`, `reference`

## Wishlists
- `user_id`, `service_id` (unique per user/service)

## Notifications
- `user_id`, `notification_type`, `channel`, `title`, `message`
- `data` (JSON), `is_read`, `read_at`, `sent_at`
- `action_url`, `action_label`, `related_entity_type`, `related_entity_id`

## Complaints
- `user_id`, `booking_id`, `service_id`, `assigned_to_id`
- `subject`, `description`, `category`
- `status`: pending | in_progress | resolved | closed | rejected
- `priority`: low | medium | high | urgent
- `resolution`, `resolved_at`, `resolved_by_id`

## Support Requests
- `user_id`, `assigned_to_id`
- `subject`, `description`, `category`
- `status`: open | in_progress | resolved | closed
- `priority`: low | medium | high | urgent
- `resolution`, `resolved_at`, `resolved_by_id`

## Coupons
- `code`, `name`, `description`
- `coupon_type`: percentage | fixed_amount | free_shipping
- `discount_value`, `minimum_amount`, `maximum_discount`, `currency`
- `usage_limit`, `usage_limit_per_user`, `used_count`
- `valid_from`, `valid_until`, `status`
- `applicable_to_all_services`, `applicable_service_ids`, `applicable_user_types`

## Policies
- `title`, `content`, `policy_type`, `slug`
- `is_active`, `display_order`, `version`

## Surveys
- `title`, `description`, `category`
- `status`: draft | active | closed
- `start_date`, `end_date`, `is_anonymous`, `allow_multiple_responses`
- `response_count`

## Analytics (View Tracking)
- `user_id` (nullable), `entity_type`, `entity_id`, `view_type`
- `ip_address`, `user_agent`, `referrer`, `duration`

## Booking Extras
- BookingCancellation: `booking_id`, `cancelled_by_id`, `reason`, `status`, `refund_amount`, `refund_percentage`, `refund_status`
- BookingData: guest info, check-in/out details, `special_requirements` JSON

## Reference Tables (Present but not wired to API)
- ServiceAmenity: `name`, `slug`, `amenity_type`, `icon`, `display_order`
- ServiceImage: `service_id`, `image_url`, `image_type`, `alt_text`, `display_order`
