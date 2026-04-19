# ✅ Ganitel MVP – Data Model Summary

This data model is designed for scalability, clarity, and alignment with the long-term goals of Ganitel as a hospitality super-app.

---

## 1. `User`

Represents all users on the platform (travelers, hosts, admins).
User roles are managed through a single `role` field.

| Field        | Type      | Description                       |
| ------------ | --------- | --------------------------------- |
| `id`         | UUID      | Unique user identifier            |
| `first_name` | String    | User’s first name                 |
| `last_name`  | String    | User’s last name                  |
| `email`      | String    | Email address                     |
| `whatsapp`   | String    | WhatsApp number (used for OTP)    |
| `avatar_url` | String    | Profile picture                   |
| `gender`     | Enum      | `"male"`, `"female"`, `"other"`   |
| `origin`     | String    | Origin (country or diaspora info) |
| `role`       | Enum      | `"traveler"`, `"host"`, `"admin"` |
| `created_at` | Timestamp | Date of registration              |

---

## 2. `Listing`

Represents rental properties offered by hosts.

| Field             | Type      | Description                         |
| ----------------- | --------- | ----------------------------------- |
| `id`              | UUID      | Listing identifier                  |
| `title`           | String    | Title of the listing                |
| `description`     | Text      | Full description                    |
| `price_per_night` | Float     | Base price per night                |
| `address`         | String    | Full address                        |
| `city`            | String    | City                                |
| `rooms`           | Int       | Number of bedrooms                  |
| `capacity`        | Int       | Max number of guests                |
| `host_id`         | FK → User | The host who owns the listing       |
| `status`          | Enum      | `"pending"`, `"active"`, `"hidden"` |
| `created_at`      | Timestamp | Date listed                         |

---

## 3. `Image`

Stores images related to listings.

| Field        | Type         | Description                   |
| ------------ | ------------ | ----------------------------- |
| `id`         | UUID         | Image ID                      |
| `listing_id` | FK → Listing | Linked listing                |
| `url`        | String       | Image URL                     |
| `alt_text`   | String       | Description for accessibility |
| `order`      | Int          | Display order in gallery      |

---

## 4. `Amenity` + `ListingAmenity` (many-to-many)

`Amenity`: Static table of options like Wi-Fi, parking, air conditioning, etc.

`ListingAmenity`: Links each amenity to listings.

| `ListingAmenity` Field | Description  |
| ---------------------- | ------------ |
| `listing_id`           | FK → Listing |
| `amenity_id`           | FK → Amenity |

---

## 5. `BlockedDate`

Represents specific days when a listing is not available.

| Field        | Type         | Description        |
| ------------ | ------------ | ------------------ |
| `id`         | UUID         | Blocked date ID    |
| `listing_id` | FK → Listing | Associated listing |
| `date`       | Date         | Blocked day        |

---

## 6. `Booking`

Represents a reservation made by a traveler.

| Field             | Type         | Description                               |
| ----------------- | ------------ | ----------------------------------------- |
| `id`              | UUID         | Booking ID                                |
| `user_id`         | FK → User    | Traveler who booked                       |
| `listing_id`      | FK → Listing | Booked property                           |
| `start_date`      | Date         | Check-in date                             |
| `end_date`        | Date         | Check-out date                            |
| `guest_count`     | Int          | Number of people                          |
| `status`          | Enum         | `"pending"`, `"confirmed"`, `"cancelled"` |
| `message_to_host` | Text         | Optional message from guest               |
| `total_price`     | Float        | Calculated total price                    |
| `created_at`      | Timestamp    | Booking date                              |

---

## 7. `Payment`

One booking may have multiple payments (deposit, balance, etc.)

| Field        | Type         | Description                        |
| ------------ | ------------ | ---------------------------------- |
| `id`         | UUID         | Payment ID                         |
| `booking_id` | FK → Booking | Linked reservation                 |
| `amount`     | Float        | Payment amount                     |
| `method`     | String       | Payment method (e.g., Tranzak)     |
| `status`     | Enum         | `"paid"`, `"failed"`, `"refunded"` |
| `reference`  | String       | Tranzak or provider reference      |
| `created_at` | Timestamp    | Payment timestamp                  |

---

## 8. `Message` (Optional, via Twilio Webhook)

Stores WhatsApp messages exchanged between users.

| Field          | Type                    | Description             |
| -------------- | ----------------------- | ----------------------- |
| `id`           | UUID                    | Message ID              |
| `sender_id`    | FK → User               | Sender of the message   |
| `recipient_id` | FK → User               | Receiver of the message |
| `message_text` | Text                    | Content                 |
| `booking_id`   | FK → Booking (optional) | Associated booking      |
| `timestamp`    | Timestamp               | When message was sent   |

---

## 9. `Review`

Traveler’s review for a listing after stay.

| Field        | Type         | Description             |
| ------------ | ------------ | ----------------------- |
| `id`         | UUID         | Review ID               |
| `user_id`    | FK → User    | Reviewer                |
| `listing_id` | FK → Listing | Reviewed property       |
| `rating`     | Int (1–5)    | Star rating             |
| `comment`    | Text         | Optional written review |
| `created_at` | Timestamp    | Review date             |

> ⚠️ One review per booking — no duplicates.

---

## 10. `Report`

Used to report users, listings, or messages for abuse/moderation.

| Field         | Type      | Description                          |
| ------------- | --------- | ------------------------------------ |
| `id`          | UUID      | Report ID                            |
| `reporter_id` | FK → User | The person reporting                 |
| `target_type` | Enum      | `"listing"`, `"user"`, `"message"`   |
| `target_id`   | UUID      | What is being reported               |
| `reason`      | Text      | Explanation                          |
| `status`      | Enum      | `"open"`, `"reviewed"`, `"resolved"` |
| `created_at`  | Timestamp | Report date                          |


