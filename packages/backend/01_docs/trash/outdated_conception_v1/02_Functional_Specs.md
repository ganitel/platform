## ✅ Point 2 — Functional Specifications (MVP: Lodging Bookings Only)

This section outlines the core features the platform must implement for the first public release of Ganitel, focusing on **accommodation-only booking** for **Single-Service Bookers**, as part of the MVP strategy.

---

### 🧭 1. Booking Experience

| Feature             | Description                                                                                                 | Priority    |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ----------- |
| **Search flow**     | Users search by destination, check-in/out dates, guests, rooms. Autocomplete suggestions & filters per doc. | Must Have   |
| **Property view**   | Each listing shows description, photo/video, amenities, calendar, rating.                                   | Must Have   |
| **Booking flow**    | View → Select date & guest count → "Book Now" → Enter info → Pay                                            | Must Have   |
| **Availability**    | Host defines available dates during listing creation. Platform doesn’t auto-enforce availability.           | Must Have   |
| **Cart System**     | Users can book multiple services (accommodations) in a single transaction.                                  | Should Have |
| **Dynamic Pricing** | Hosts may define dynamic prices based on date (e.g. holidays). Static also supported.                       | Should Have |

---

### 💸 2. Checkout & Payments

| Feature                     | Description                                                                               | Priority     |
| --------------------------- | ----------------------------------------------------------------------------------------- | ------------ |
| **Payment methods**         | Mobile Money (MTN, OM), credit/debit card. No Apple Pay or PayPal at this stage.          | Must Have    |
| **Transaction fee display** | Exact fees shown *just before* confirmation.                                              | Must Have    |
| **Invoice**                 | Final invoice/receipt sent after booking (implementation may depend on payment provider). | Should Have  |
| **Discount Codes**          | Users can apply coupons during checkout.                                                  | Nice to Have |

---

### 💬 3. Messaging & Reviews

| Feature                   | Description                                                                | Priority  |
| ------------------------- | -------------------------------------------------------------------------- | --------- |
| **Pre-booking messaging** | Guests can message hosts before booking via WhatsApp or platform.          | Must Have |
| **Price negotiation**     | Hosts may edit price before guest confirms booking (negotiation use case). | Must Have |
| **Reviews**               | Allowed any time. Guests can leave star rating + text comment.             | Must Have |
| **Average ratings**       | Displayed on listing cards & pages.                                        | Must Have |

---

### 🔐 4. User Accounts & Access

| Feature            | Description                                                                 | Priority  |
| ------------------ | --------------------------------------------------------------------------- | --------- |
| **Sign-up**        | OTP via email or WhatsApp. No password required.                            | Must Have |
| **User dashboard** | View upcoming/past bookings, profile info.                                  | Must Have |
| **Host dashboard** | Hosts can add/edit listings, set availability & pricing, and view earnings. | Must Have |
| **Admin review**   | All listings are moderated by admin before being visible.                   | Must Have |

---

### 📱 5. Mobile-first UI & UX

| Feature                            | Description                                                                    | Priority    |
| ---------------------------------- | ------------------------------------------------------------------------------ | ----------- |
| **Responsive website**             | MVP will be a mobile-first responsive website.                                 | Must Have   |
| **Real-time availability preview** | Not enforced initially, may depend on user flow design.                        | Should Have |
| **Communication channels**         | All important communications go through WhatsApp (primary) + Email (fallback). | Must Have   |

---

### ⚠️ 6. Additional Features

| Feature                    | Description                                                                 | Priority     |
| -------------------------- | --------------------------------------------------------------------------- | ------------ |
| **Report a Listing**       | Users can report inappropriate or fraudulent listings.                      | Should Have  |
| **Multi-currency display** | Pricing shown in FCFA, USD or Euro depending on location (fallback to USD). | Must Have    |
| **Saved favorites**        | Users can bookmark listings for later.                                      | Nice to Have |
| **Admin tools**            | Admins can manage users, listings, disputes, and platform content.          | Must Have    |

---

## ✅ Summary Table of MVP Priorities

| Priority         | Total Features |
| ---------------- | -------------- |
| **Must Have**    | ✅ 17 features  |
| **Should Have**  | 🟡 5 features  |
| **Nice to Have** | 🔵 2 features  |

---