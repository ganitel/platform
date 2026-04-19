# ✅ Point 4 – System Constraints & Technical Stack (Ganitel MVP)

---

## A. Technical Stack Overview

Ganitel is designed as a **scalable platform for hospitality, tourism, and cultural services** across Africa. While the MVP focuses on lodging, the system must support future extensions (e.g., vehicle rental, dining, wellness, flights, experiences).

**Technology choices:**

* **Frontend**:
  Framework: `Next.js` (or React), mobile-first responsive design.
  Hosting: Vercel or Hostinger.
  Deployment: Handled independently from backend.

* **Backend**:
  Framework: `FastAPI (Python)` — modular, REST-based, async-capable.
  Hosting: Hostinger VPS (with optional reverse proxy via Caddy/Nginx).
  Responsibilities: business logic, API, database access, external integrations.

* **Database**:
  `PostgreSQL` via **Supabase**, with JWT-based authentication and **Row-Level Security (RLS)** for multi-tenant data isolation.

* **API Layer**:
  Public **REST API**, fully decoupled from frontend. API-first approach ensures compatibility with mobile apps and partner integrations.

* **Repo structure**:
  ➤ **No monorepo**. Frontend and backend live in separate Git repositories and are deployed independently.

---

## B. Backend Architecture (FastAPI)

Ganitel’s backend is modular and scalable, following **SOLID principles**, clear layering, and full testability.

```
/backend
├── src/
│   ├── api/v1/
│   │   ├── bookings/       # Endpoints for lodging reservations
│   │   ├── listings/       # CRUD for housing units
│   │   ├── auth/           # OTP login, Twilio WhatsApp integration
│   │   └── users/          # Profile, preferences, roles
│   ├── core/              # App config, database connection
│   ├── services/          # Business logic (e.g., price negotiation)
│   ├── schemas/           # Pydantic DTOs for validation
│   ├── middlewares/       # CORS, Auth, Rate-limiting
│   └── utils/             # Common helpers
├── tests/                 # Unit and integration tests
├── main.py                # FastAPI app entrypoint
├── requirements.txt       # Dependencies
└── .env                   # Secrets and env vars
```

**Features:**

* Auto-documented API via Swagger / ReDoc
* Modular and testable service layer
* Role-based route protection
* Ready for Docker-based deployment if needed later

---

## C. External APIs & Local Adaptation

Ganitel integrates with external services, selected for **compatibility with the Cameroonian context**:

* ✅ **WhatsApp Messaging**:
  Twilio WhatsApp Business API (for booking confirmations & guest-host messaging)

* ✅ **Payments**:
  Tranzak — supports Mobile Money (MTN, Orange) and cards in Cameroon.

* ⚠️ **Geolocation & Maps**:

  * ❌ No real-time geolocation in MVP (to reduce cost & complexity).
  * ✅ Optional: use **Leaflet.js** with **OpenStreetMap** for static map display.

* ⚠️ **Autocomplete / Search**:

  * ❌ No Algolia or Google Maps (high cost, not tailored for Cameroon).
  * ✅ Fallback to **internal autocomplete** using your own data (e.g. cities, neighborhoods).

---

## D. Multi-Tenant Design

Ganitel is a **multi-tenant platform**, supporting multiple hosts (service providers), each isolated from others.

### Key Rules:

* Every **listing**, **booking**, **review**, and **transaction** is tied to a `provider_id`.
* Access is **scoped by user type**:

  * Travelers can view all public listings.
  * Hosts can only access their own data.
  * Admins have global visibility.
* Enforced via Supabase **Row-Level Security (RLS)** using authenticated JWTs.

---

## E. Repositories & Deployment

There will be **two separate repositories**:

### Frontend Repo (`ganitel-web`)

* Framework: Next.js
* Deploy on: Vercel or Hostinger
* Calls backend via public API

### Backend Repo (`ganitel-api`)

* Framework: FastAPI (Python)
* Deploy on: VPS (Hostinger)
* Reverse proxy via Caddy or Nginx
* Exposes REST API to frontend

> Shared documentation (e.g. OpenAPI schema) will ensure coordination between front & back.

---

## F. Built-In Scalability (Beyond Lodging)

Although the MVP targets lodging, the system is architected for expansion:

* Multi-service cart (car rental, food, experiences)
* Configurable packages (custom trips)
* Admin dashboard for analytics, curation, user management
* External partner APIs (for flights, tours, wellness, etc.)
* Mobile app integration (via REST API)

**Conclusion**:
This architecture allows Ganitel to evolve from a lodging-first MVP into a full **travel & lifestyle super-app for Africa**, aligned with your long-term vision.
