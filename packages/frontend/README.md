# ganitel Frontend

React Router v7 app (framework mode + SSR) for the ganitel marketplace —
stays and experiences, mobile-first, fr/en. Auth via Clerk, calls the
backend at `/api`.

## Layout

```
client/
  root.tsx                 Root layout, providers
  routes.ts / routes/      File-based routes (RR7 framework mode)
  entry.client.tsx
  entry.server.tsx         SSR entry (Clerk middleware bridge lives here)
  features/                One folder per feature
    auth/   landing/   browse-style entries
    properties/   experiences/   bookings/   profile/   reference/
      api.ts        thin axios calls
      hooks.ts      TanStack Query hooks on top of api.ts
      types.ts      Zod schemas + inferred TS types
      components/   feature-local UI
  shared/                  Cross-feature
    api/             axios instance, error handling, token bridge
    components/      app shell, headers, footers, providers
    ui/              shadcn/ui primitives (Radix-based)
    hooks/   lib/    utilities (i18n, formatters, …)
    test/            test setup
  styles/                  Tailwind entry + theme tokens
```

`@/*` resolves to `./client/*` (see `tsconfig.json`).

## Stack

- **React 19** + **React Router v7** (framework mode, SSR)
- **Vite 8** + **Tailwind v4** + **shadcn/ui** on Radix primitives
- **TanStack Query** for server state, **axios** for transport
- **react-hook-form** + **Zod** for forms and runtime validation
- **Clerk** (`@clerk/react-router`) for auth, including SSR session
  validation via `clerkMiddleware()`
- **Vitest** + Testing Library for tests

## Conventions

- **Feature-folder first.** New screens go in `client/features/<feature>/`
  and only graduate to `client/shared/` when a second feature reuses them.
- **Layered access to the backend.** UI calls `hooks.ts` → `hooks.ts` calls
  `api.ts` → `api.ts` uses the shared axios instance. UI components never
  call axios directly.
- **shadcn/ui under `client/shared/ui/`.** Customise tokens and these files
  rather than touching upstream packages. Compose primitives instead of
  building monolithic components.
- **i18n is fr/en only**, defined in `client/shared/lib/i18n.ts`. Don't pin
  copy in tests — see the repo's testing rule.

## Env

Copy `.env.example` to `.env`. Keys (with what they're for):

| Key            | Notes                                                          |
| -------------- | -------------------------------------------------------------- |
| `API_BASE_URL` | Absolute backend URL for SSR fetches (loaders run server-side) |

## Running

All commands are exposed at the repo root. Run them from there, not from
inside `packages/frontend/` — there is no per-package Makefile.

```bash
make dev-frontend    # vite dev server on :3000
make test-frontend   # vitest
make lint            # eslint (frontend) + ruff (backend)
make typecheck       # react-router typegen + tsc, then ty for backend
make build           # production build → build/{client,server}
```

See the [repo root README](../../README.md) for the full task list.
