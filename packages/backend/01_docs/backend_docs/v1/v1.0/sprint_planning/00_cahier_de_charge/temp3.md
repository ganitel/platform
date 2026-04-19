Recommendations for the test suite by environment (local, staging, prod):

Local (developer machine)
- Run full unit + integration suite against an isolated test DB (containerized Postgres).
- Allow destructive setup (drop/truncate) only in local when `TESTING=true`.
- Mock external services (payments, WhatsApp, email) by default.
- Use `pytest -m "not slow and not external"` as default dev loop.

Staging (Docker, pre-prod)
- Run unit + integration + E2E against staging containers with a dedicated staging DB/schema.
- For external services, prefer sandbox endpoints; never hit production.
- Allow non-destructive data setup; avoid global truncation.
- Run performance tests with controlled, tagged jobs (e.g., nightly).

Production (managed Postgres)
- No destructive tests, no DB resets, no data mutations beyond synthetic canaries.
- Only run smoke tests and synthetic health checks against prod API.
- Use read-only checks where possible (health, version, auth ping).
- Run load/perf tests against a prod-like staging clone, not prod.

Cross-cutting safeguards
- Hard-block tests unless `TESTING=true` and a dedicated test DB is configured.
- Add an explicit `ENVIRONMENT` gate to prevent any drop/truncate outside local.
- Centralize test DB/session overrides so all tests use the same safe connection.
- Separate markers: `unit`, `integration`, `e2e`, `slow`, `external`, `prod-smoke`.

If you want, I can draft a concrete policy doc plus guardrails in conftest.py to enforce this.