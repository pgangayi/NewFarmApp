**Fixes & Remediation Plan**

This document captures the prioritized fixes, safe rollout steps, and commands to remediate authentication issues while keeping the system simple.

**Scope**:

- **Files**: backend auth handlers, `_auth.js`, `_token-management.js`, `_csrf.js`, session helpers, `wrangler.toml`, migrations and tests.
- **Goals**: remove hard-coded secrets, unify token revocation, consolidate CSRF/session logic, restrict CORS, improve logging, and add tests and migrations.

**High Priority Fixes**

- **Secrets**: Remove `JWT_SECRET` from `wrangler.toml` and any committed env files. Use secret store (Cloudflare/CI). Rotate the secret and revoke old tokens.
- **Token Revocation**: Standardize on `revoked_tokens` (richer schema). Migrate `token_blacklist` data into `revoked_tokens` and remove duplicate tables.
- **CSRF & Session**: Consolidate to `CSRFProtection` (DB-backed double-submit) and the advanced `createSessionResponse` helper. Remove or adapt `SimpleCSRF` and duplicate `_session.js` helpers.

**Medium Priority Fixes**

- **CORS**: Replace wildcard (`*`) with `FRONTEND_ORIGIN` from env; add `Access-Control-Allow-Credentials` only when cookies are used.
- **Logging / PII**: Stop logging emails/passwords; log user IDs or hashed identifiers only. Add redaction helpers.
- **Imports & Duplication**: Remove duplicate or conflicting helpers and unify imports across handlers (`login.js`, `signup.js`, `refresh.js`, `logout.js`).

**Low Priority Fixes**

- **JWT Improvements**: Explicitly set JWT algorithm, consider asymmetric keys for future needs, and ensure `REFRESH_TOKEN_ROTATION` behavior is tested.
- **Tests & Seeds**: Remove plaintext passwords from `test-signup.json` and use ephemeral generation for e2e tests.

**Phased Implementation Plan**

1. **Prep**: create a branch (e.g., `auth/audit-remediations`) and backup DB/schema.
2. **Secrets**: remove `JWT_SECRET` from `wrangler.toml`; add comment instructing secret store usage.
3. **Provision**: set `JWT_SECRET`, `FRONTEND_ORIGIN`, `REFRESH_TOKEN_ROTATION` in secrets store (Cloudflare/CI).
4. **Revocation Migration**: add SQL/JS migration to copy `token_blacklist` → `revoked_tokens` and drop old table.
5. **Code Unification**: refactor `_auth.js` to call `TokenManager` for revoke/check; replace `SimpleCSRF` usage with `CSRFProtection` and use canonical `createSessionResponse`.
6. **CORS & Cookies**: update `index.js` CORS headers to use `env.FRONTEND_ORIGIN` and conditionally set credentials header.
7. **Logging**: add redaction, remove PII logging, and standardize audit logging.
8. **Tests & e2e**: add unit tests for revocation/CSRF; update seeds and e2e to use ephemeral accounts or CI secrets.
9. **Staging Rollout**: deploy to staging, run full suite, verify flows, monitor logs and CSRF stats.
10. **Production Rollout**: rotate secret in production, run revocation script, deploy, and monitor.

**Quick Commands (PowerShell)**

- Create branch:
  - `git checkout -b auth/audit-remediations`
- Remove secret from repo (edit `wrangler.toml` then commit):
  - `git add wrangler.toml`
  - `git commit -m "chore: remove JWT_SECRET from repo; use secret store"`
- Add secret to Cloudflare (interactive):
  - `wrangler secret put JWT_SECRET`
- Run tests / e2e (example):
  - `npm run test`
  - `npm run start:e2e`
  - `cd frontend; npm run test:e2e`

**Migration / Rollback Guidance**

- Before rotating secrets, create a dump of `token_blacklist` and `revoked_tokens`.
- Migration script should:
  - Insert missing rows from `token_blacklist` into `revoked_tokens` with `token_type='refresh'` or appropriate mapping.
  - Back up the original tables to `token_blacklist_backup_{timestamp}`.
  - After verification, drop `token_blacklist` (or keep it for rollback for a short period).
- Rollback: re-create `token_blacklist` from backup and redeploy the previous code path.

**Test Checklist**

- Unit: `TokenManager.isTokenRevoked` and `revokeToken` behaviors; `CSRFProtection.generateAndSetToken` storage and cookie setting.
- Integration: signup/login/refresh/logout flows return expected cookies and headers; revoked tokens are rejected.
- Security: CSRF header vs cookie mismatch rejected; rate-limiting triggers after repeated failures.

**Runbook / Next Steps**

- Create `AUTH_RUNBOOK.md` with instructions for rotation, revocation, and emergency rollback.
- Once staged and validated, merge branch and remove deprecated helpers (`SimpleCSRF`, duplicate `_session.js`).

If you'd like, I can apply the first patches now: remove `JWT_SECRET` from `wrangler.toml` and update `login.js` / `signup.js` to use `CSRFProtection` + canonical `createSessionResponse`. Reply `apply now` to proceed.
