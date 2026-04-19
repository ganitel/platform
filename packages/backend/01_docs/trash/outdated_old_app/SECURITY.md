# Security Notes — residence-backend-v2

Known issues and recommendations

1) Password hashing
- Issue: `models/user.js` contains commented-out hooks that would hash passwords before save/update. Verify and re-enable hashing.
- Action: Implement bcrypt hashing in `beforeCreate` and `beforeUpdate` hooks, and add tests verifying stored password is hashed.

2) Environment validation
- Issue: App expects many env vars (JWT secrets, DB credentials, payment keys) but does not validate them at startup.
- Action: Add a startup validation using `joi` or `envalid` to fail fast with clear messages.

3) Rate limiting & headers
- Current: `express-rate-limit` set to 100 req/min. Consider stricter limits per sensitive endpoints (auth, payments) and IP blacklisting for repeated offenders.

4) Input validation
- Some controllers use express-validator/yup; ensure all public endpoints validate and sanitize inputs to prevent SQL injection or unexpected values.

5) Secrets handling
- Ensure secrets are not committed. Add `.env.example` and document required secrets in `01_docs/SETUP.md`.

6) Logging & monitoring
- Ensure sensitive data (passwords, tokens) never logged. Configure Winston to redact secrets.

7) HTTPS
- Production must run behind HTTPS; ensure load balancer or reverse proxy enforces TLS and forwards secure headers.

