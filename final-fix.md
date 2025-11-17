# Final Fix Plan

## Objective
Deliver permanent solutions across the stack to resolve the audit findings while preserving or improving the current Farmers Boot functionality.

## Priority Areas
1. **Authentication & Session Handling**
   - Persist the full session payload (`access_token`, `refresh_token`, `csrf_token`, expiry) under one storage key.
   - Update `AuthContext` to expose a stable getter and ensure `getAuthHeaders` always reads the latest session.
   - Fix the `validateToken` effect’s dependencies so reads stay synchronous with session updates.
   - Refactor `useOfflineQueue`, `unifiedApi`, `cloudflare.ts`, and any direct `localStorage` readers to consume the shared getter.

2. **Backend API Alignment**
   - Adjust `finance` delete handler to accept both `/api/finance-enhanced?id=` and `/api/finance-enhanced/:id`, returning a consistent `{ success, data }` shape.
   - Extend `tasks/time-logs` start/stop routes to emit and accept a `log_id`/`log_token` so stops can patch the correct record.
   - Wrap every new “enhanced” endpoint inside the `_database.js` helper (`runQuery`, `applyRateLimit`) to keep retries, allowlists, and observability consistent.
   - Document the canonical payload shapes so front- and backend stay in sync.

3. **Frontend Hooks & Pages**
   - Standardize on `useApiClient` + React Query hooks (`useInventory`, `useTasks`, `useCrops`, `useFinance`, etc.) instead of raw `fetch` calls or duplicate clients.
   - Align query keys and invalidations (e.g., use `['inventory', farmId]` everywhere so mutations can invalidate it; avoid mixing `['tasks']` vs `['tasks','enhanced']`).
   - Normalize all IDs to strings when entering the client to avoid filtering mismatches (currentFarm vs API data).
   - Make every mutation handler await the mutation result and surface errors before resetting UI state.
   - Ensure analytics/queue pages guard against unauthorized access and stop syncing when the session is invalid.

4. **Offline Queue & Conflict Handling**
   - Run queue operations through `useApiClient` to inherit the shared header getter.
   - Validate queue payloads before dereferencing (`payload?.id`, `idempotencyKey`) and mark malformed entries as failed with helpful messages.
   - Update `QueuePage` to respect auth state and show a clear message when the user must re-authenticate.

5. **Tooling, Tests & Deployment**
   - Review scripts (`setup-dev.ps1`, `start-dev.bat`, `scripts/`) to confirm dependencies, build steps, and Wrangler usage are documented.
   - Re-enable Vitest suites and Playwright flows that cover critical paths (auth, inventory CRUD, queue conflict resolution).
   - Add CI tasks for linting, type checking, Vitest, and Wrangler preview/publish (dry-run) so regressions surface early.
   - Update documentation (`README`, `docs/`) with the unified workflow, API client guidelines, and testing commands.

## Execution Order
1. **Fix Auth/session storage** so every request flows with valid tokens.
2. **Align backend routes** (finance delete, task logs) to match what the UI already sends.
3. **Refactor frontend hooks/pages** to consume the shared API layer and consistent query keys.
4. **Harden the offline queue** and queue UI around the refreshed auth contract.
5. **Audit tooling/tests/deployment**, add missing checks, and document the workflow.
6. **Run Playwright/Vitest smoke tests** to validate the entire experience end-to-end.

## Validation & Follow-up
- Add regression tests (unit/integration) for new auth helpers and API routes.
- Run the updated Playwright suite covering login, inventory CRUD, and queue conflict resolution.
- Document the final workflow in `README.md` with commands for lint/test/server.
- Circle back to the audit report once the new flows are verified.
