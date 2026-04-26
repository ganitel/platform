"""pytest scaffolding.

Intentionally minimal — true unit tests must not depend on env, DB, Redis,
or any external service. If a fixture needs a DB/Redis URL, add it under
`tests/integration/` with the `integration` marker instead.
"""
