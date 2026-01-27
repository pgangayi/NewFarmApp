# Backend Secrets & Environment Variables

This document describes secrets required by the backend and recommended GitHub Actions secret names.

## Required / Important

- `APP_URL` — The public URL for the frontend (used in reset links and verification emails). Example: `https://app.example.com`.
- `JWT_SECRET` — Secret used to sign JWT tokens. **Must be kept secret** and rotated periodically.

## Optional but recommended

- `RESEND_API_KEY` — API key for Resend (email provider). If missing, the app will use a mock email implementation in dev/test.
- `FROM_EMAIL` — Sender email address to use for outgoing messages (e.g. `noreply@example.com`).
- `SENTRY_DSN` — Sentry DSN for error reporting and observability.

## Testing helpers

- `TEST_ENABLE_RESET_LINK_TO_RESPONSE` — Set to `1` in test/staging to enable the password reset endpoint to return the reset link when the request includes `?debug=1` or header `X-TEST-MODE: 1`. Do **not** enable in production.

## GitHub Actions

Use repository secrets with the same names above, e.g. `RESEND_API_KEY`, `JWT_SECRET`, `SENTRY_DSN`.

In CI you can validate secrets by running:

```bash
# Force validation to fail if secrets are missing
CHECK_SECRETS=1 cd backend && npm run check:env
```
