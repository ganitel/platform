# Diagrams — residence-backend-v2

Paste these Mermaid diagrams into any Markdown viewer or Mermaid live editor to render the architecture and entity relationships.

## High-level architecture

```mermaid
flowchart TD
  A["app.js"]
  A --> MIDDLEWARE["Middleware (helmet, cors, rate-limit, body-parser)"]
  A --> I18N["i18n init"]
  A --> CRON["initializeCronJobs()"]
  A --> ROUTES["/api/v1/ (routes/index)"]

  subgraph Routes
    ROUTES --> host["host"]
    ROUTES --> user["user"]
    ROUTES --> client["client"]
    ROUTES --> admin["admin"]
    ROUTES --> guest["guest"]
    ROUTES --> payments["payments"]
  end

  host --> controllers_host["controllers/host/*"]
  user --> controllers_user["controllers/user/*"]
  payments --> controllers_pay["controllers/payment/*"]

  controllers_host --> DB[(MySQL via Sequelize)]
  controllers_user --> DB
  controllers_pay --> DB

  DB --> models["models/*"]

```

## Key entities (ER diagram - simplified)

```mermaid
erDiagram
  USERS ||--o{ LISTINGS : owns
  LISTINGS ||--o{ LISTING_IMAGES : has
  LISTINGS ||--o{ BOOKINGS : receives
  USERS ||--o{ BOOKINGS : makes
  USERS ||--o{ WALLETS : owns
  WALLETS ||--o{ TRANSACTIONS : records
  LISTINGS }o--o{ AMENITIES : has
  LISTINGS }o--o{ RULES : enforces
  LISTINGS ||--o{ REVIEWS : receives
  USERS ||--o{ REVIEWS : writes
```

## Endpoint map (subset)

```mermaid
graph TD
  API[/api/v1/]
  API --> guest[guest/*]
  API --> client[client/*]
  API --> hosts[hosts/*]
  hosts --> host_listings[/hosts/:id/listings/]
  hosts --> host_bookings[/hosts/bookings/]
  API --> users[users/*]
  users --> user_bookings[/users/bookings/]
  users --> user_reviews[/users/reviews/]
  API --> payments[/payments/]

```

