# Better Auth Migration Design

**Date:** 2026-05-01
**Status:** Approved
**Replaces:** Clerk (`@clerk/react-router`)

## Summary

Replace Clerk with better-auth. Phase 1 supports Phone OTP (Twilio) and Google OAuth. Apple Sign In is deferred (see GitHub issue).

---

## Architecture

better-auth runs inside the existing React Router Node.js SSR process. A catch-all route (`client/routes/api.auth.$.ts`) forwards all `/api/auth/*` requests to `auth.handler(request)`. The JWT plugin exposes `/api/auth/jwks`. The Python FastAPI backend keeps its existing `PyJWKClient` JWKS verification pattern — it just points at the app's own JWKS endpoint instead of Clerk's.

No new service or deployment unit is added.

---

## Auth Methods (Phase 1)

| Method | Plugin | Provider |
|--------|--------|----------|
| Phone OTP | `phoneNumber` | Twilio SMS |
| Google | `socialProviders.google` | Google OAuth2 |
| Apple | deferred | — |

---

## Data Layer

### New tables (better-auth owned, same Postgres DB)

| Table | Purpose |
|-------|---------|
| `user` | Auth identity (id, name, email, emailVerified, image) |
| `session` | Active sessions |
| `account` | OAuth account links (Google, phone) |
| `verification` | OTP/email verification tokens |

better-auth migrations run via `npx @better-auth/cli migrate`.

### App `users` table change

- `clerk_user_id` (String 64) → `auth_user_id` (String 36, references better-auth `user.id`)
- New Alembic migration handles the rename

better-auth's `user` table owns auth identity. The app's `users` table owns everything else (is_host, is_admin, language, display_name, avatar_url, status).

### Phone-only user profile completion

Google OAuth provides a name. Phone OTP does not. After a phone user's first login, if `display_name` is blank in the app `users` table, the frontend redirects to `/complete-profile` before any other navigation. This enforces the existing "name required" rule.

---

## Token Flow

```
Browser
  → authClient.token()
  → better-auth JWT plugin (RS256, 15 min TTL)
  → Authorization: Bearer <jwt>
  → FastAPI
      → PyJWKClient(BETTER_AUTH_JWKS_URL)
      → verify RS256, extract sub / email / phoneNumber / name
```

### Client-side token retrieval

`entry.client.tsx` registers the token getter:
```typescript
setAuthTokenGetter(async () => {
  const { data } = await authClient.token();
  return data?.token ?? null;
});
```

### Server-side token retrieval (loaders)

Route loaders call `auth.api.getSession({ headers: request.headers })` to get the session, then call the JWT token endpoint to get a short-lived JWT for forwarding to the Python backend.

### JWT claims shape

| Claim | Value |
|-------|-------|
| `sub` | better-auth `user.id` |
| `email` | user email (nullable) |
| `phoneNumber` | user phone (nullable) |
| `name` | display name (nullable) |

Python `AuthClaims` dataclass maps these fields (replaces `ClerkClaims`).

---

## Frontend Changes

### Packages

Remove:
- `@clerk/react-router`
- `@clerk/localizations`

Add:
- `better-auth`
- `twilio` (server-side SMS sending)

### New files

| File | Purpose |
|------|---------|
| `client/lib/auth.server.ts` | better-auth server instance (phone, google, jwt plugins) |
| `client/lib/auth-client.ts` | better-auth React client (`createAuthClient`) |
| `client/routes/api.auth.$.ts` | Catch-all auth route handler |
| `client/features/auth/components/phone-login.tsx` | Phone number entry + OTP verify UI |
| `client/features/auth/components/google-button.tsx` | Google OAuth button |
| `client/features/auth/components/user-menu.tsx` | Replaces `<UserButton />` |
| `client/routes/complete-profile.tsx` | Name collection for phone-only users |

### Modified files

| File | Change |
|------|--------|
| `root.tsx` | Remove `ClerkProvider`, `clerkMiddleware()`, `rootAuthLoader`; add better-auth session context via loader |
| `react-router.config.ts` | Remove `v8_middleware: true` |
| `entry.client.tsx` | Use `authClient.token()` instead of `window.Clerk.session.getToken()` |
| `shared/api/server.ts` | Use better-auth session for server-side token |
| `routes/sign-in.tsx` | Replace `<SignIn />` with phone+google custom UI |
| `routes/sign-up.tsx` | Merge into sign-in (phone OTP is sign-up and sign-in in one flow) |
| `shared/components/header.tsx` | Replace `useAuth()` / `<UserButton />` with better-auth hooks + `<UserMenu />` |
| `features/auth/hooks/use-me.ts` | Replace Clerk `isSignedIn` with better-auth `useSession()` |
| `features/auth/components/clerk-appearance.ts` | Delete (Clerk-specific) |

---

## Backend Changes

### `app/core/auth.py`

- Rename `verify_clerk_jwt` → `verify_jwt`
- Rename `ClerkClaims` → `AuthClaims`
- Update JWKS URL source: `settings.BETTER_AUTH_JWKS_URL`
- Update issuer check: `settings.BETTER_AUTH_ISSUER`
- Update claim key `phone_number` → `phoneNumber` (better-auth convention)

### `app/core/config.py`

```python
# Remove
CLERK_JWKS_URL: str | None
CLERK_ISSUER: str | None

# Add
BETTER_AUTH_JWKS_URL: str | None   # e.g. http://localhost:5173/api/auth/jwks
BETTER_AUTH_ISSUER: str | None     # e.g. http://localhost:5173
```

### `app/core/deps.py`

Update call sites: `verify_clerk_jwt` → `verify_jwt`, `ClerkClaims` → `AuthClaims`.

### `app/modules/users/models.py`

- Rename column `clerk_user_id` → `auth_user_id`

### `app/modules/users/service.py`

- Rename `get_by_clerk_id` → `get_by_auth_user_id`
- Rename `get_or_create_from_clerk` → `get_or_create_from_jwt`

### New Alembic migration

Renames the `clerk_user_id` column and its index to `auth_user_id`.

### Seed data

Update `scripts/seed_demo.py`: replace hardcoded `clerk_user_id` values with `auth_user_id` placeholders (or generate synthetic UUIDs for demo data).

---

## Environment Variables

### Frontend `.env.example`

Remove:
```
VITE_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
```

Add:
```
BETTER_AUTH_SECRET=                  # min 32 chars, high entropy
BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Backend `.env.example`

Rename:
```
CLERK_JWKS_URL  → BETTER_AUTH_JWKS_URL
CLERK_ISSUER    → BETTER_AUTH_ISSUER
```

---

## OAuth Callback URLs to Register

| Provider | URL |
|----------|-----|
| Google | `http://localhost:5173/api/auth/callback/google` (dev) |
| Google | `https://yourdomain.com/api/auth/callback/google` (prod) |

---

## Out of Scope (Phase 1)

- Apple Sign In (GitHub issue opened, requires Apple Developer account)
- Email/password auth
- Magic link
- Webhook-based user sync
