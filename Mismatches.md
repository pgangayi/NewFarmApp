# Data Retrieval Mismatches

This document captures the current inconsistencies in how backend processes fetch and expose data, along with actionable recommendations.

## 1. Repository return-shape mismatches

**Where:** Multiple repositories (tasks, fields, finance, etc.) still destructure `{ results, error }` from `DatabaseOperations.executeQuery`, although `executeQuery` now returns `{ success, data, changes, lastRowId, … }`.

- Example: `TaskRepository.findByUserAccess` relies on `results` and later `return results;`, which is always `undefined` now that `executeQuery` only exposes `data` (@backend/api/repositories/task-repository.js#22-131).
- `countByUserAccess` in the same repository pulls `results[0]?.total`, so counts are never resolved (@backend/api/repositories/task-repository.js#133-175).
- Field and finance repositories show the identical pattern in both list and count queries, and their `findByIdWithDetails` helpers also dereference `results[0]` (@backend/api/repositories/field-repository.js#22-400, @backend/api/repositories/finance-repository.js#22-230).

**Impact:** All consumer services receive `undefined` datasets and zero counts unless they defensively fall back. Pagination, filtering, and detail views silently fail.

**Recommendation:** Update every repository call to destructure `{ data }` (and optionally `{ success, changes, lastRowId }`). Return `data` directly or map over it before returning. If any code truly needs the raw D1 response, extend `executeQuery` to expose it consistently, but today the contract is already standardized on `data`.

## 2. Competing BaseRepository implementations

**Where:**
- `_database.js` exports a `BaseRepository` tightly coupled to `DatabaseOperations` helpers (findById, findMany, count, etc.) (@backend/api/_database.js#1124-1174).
- `_repositories.js` defines another `BaseRepository` with different expectations (`this.db.count` etc.) and is used by helper repositories like `FarmRepository` (@backend/api/_repositories.js#9-72).

**Impact:** Services that extend the `_database` version expect sanitized `data` responses, while helpers that extend the `_repositories` version assume the lower-level DB primitives return raw results. Mixing the two leads to inconsistent data contracts and duplicated logic.

**Recommendation:** Consolidate around a single `BaseRepository` (preferably the `_database` variant since it enforces validation/rate limiting). Deprecate or refactor the duplicate in `_repositories.js`, and ensure all repositories import from the same source.

## 3. Direct `env.DB` queries bypassing DatabaseOperations safeguards

**Where:** Controllers and security utilities (e.g., `BaseApiController.executeQueryWithTimeout`, `_auth.js`, `_token-management.js`, `_anomaly-detection.js`) issue raw `env.DB.prepare(...).all()` calls and expect `{ results, error }` from bespoke wrappers (@backend/api/_base-controller.js#166-188, @backend/api/_auth.js#106-190, @backend/api/_token-management.js#19-332).

**Impact:** These paths skip table whitelisting, parameter sanitation, retry/backoff, and the standardized response contract. They also continue to propagate the `results` expectation, reinforcing the mismatch.

**Recommendation:** Route these queries through `DatabaseOperations.executeQuery` (or at least wrap the raw response so callers still receive `{ data }`). Centralizing all DB access maintains consistent security controls and avoids further divergence.

## 4. CSRF header usage mismatch between frontend and backend

**Where:** The frontend `AuthContext` posts to `/api/auth/login` and `/api/auth/signup` using plain `fetch` calls with only `Content-Type` headers (@frontend/src/hooks/AuthContext.tsx#173-278). The backend session initializer emits CSRF cookies/headers and later expects `X-CSRF-Token` on state-changing requests and during refresh handling (@backend/api/auth/_session-response.js#117-182, @backend/api/auth/refresh.js#21-113).

**Impact:** When CSRF middleware is enforced (e.g., refresh or other protected endpoints), requests made right after sign-in/sign-up may lack the token header, causing intermittent 401/403 responses despite correct credentials.

**Recommendation:** Include `getAuthHeaders()` (which merges stored CSRF tokens) whenever calling authenticated endpoints, or explicitly allow these auth routes to bypass CSRF validation so the contract stays consistent.

## 5. Dual repository stacks with incompatible return contracts

**Where:** Auth flows rely on `SimpleUserRepository` in `_session-response.js`, which queries `env.DB` directly and expects `{ results }` from `prepare().all()` (@backend/api/auth/_session-response.js#23-71). Elsewhere, the shared `UserRepository` extends `BaseRepository` and uses `DatabaseOperations` which returns `{ data }` (@backend/api/repositories/user-repository.js#1-78). These classes expose different return shapes and bypass different layers of validation/rate limiting.

**Impact:** Depending on which repository is used, callers receive either raw D1 results or sanitized `data` objects, and only the latter path benefits from table whitelisting, retries, and rate limits. Bugs fixed in one layer won’t automatically apply to the other, creating divergent behavior for the same resource.

**Recommendation:** Consolidate auth endpoints onto the standardized `DatabaseOperations`/`UserRepository` stack, or wrap `SimpleUserRepository` so it internally calls `DatabaseOperations` and returns `{ data }`. Remove or refactor the duplicate pathways to keep a single data contract.

## 6. Password Reset Response Shape Mismatch

**Evidence**: 
- Backend (`forgot-password.js`): Always returns HTTP 200 with `{ message, status }`
- Frontend (`ForgotPasswordPage.tsx`): Expects `{ error }` for failures and checks `response.ok`

**Impact**: Users see generic success messages even when password reset fails, causing confusion.

**Files**:
- `backend/api/auth/forgot-password.js`
- `frontend/src/pages/ForgotPasswordPage.tsx`

**Recommendation**: Align frontend expectations with backend security practice or adjust backend to return appropriate status codes.

## 7. Password Reset Email Link Double-Wrapping

**Evidence**:
- Backend (`forgot-password.js`): Passes full reset URL to email service
- Email service (`_email.js`): Prepends base URL again, creating malformed URLs

**Impact:** Users click malformed links that contain nested URLs, causing the frontend reset page to read the `token` parameter as the entire URL, so actual token extraction fails and reset requests cannot be completed.

**Files**:
- `backend/api/auth/forgot-password.js`
- `backend/api/_email.js`

**Recommendation:** Pass only the raw token into `sendPasswordResetEmail` and let the email service construct the link, or update the email service to detect when it already receives a full URL and skip rebuilding it. Keep a single source of truth for link formatting.

## 8. Password Validation Requirements Mismatch

**Evidence**:
- Backend (`_validation.js`): Requires 12+ chars with complexity rules
- Backend (`signup.js`): Only requires 8+ chars
- Frontend (`SignupPage.tsx`): Only validates 6+ chars
- Frontend (`ResetPasswordPage.tsx`): Only validates 8+ chars

**Impact**: Inconsistent password requirements lead to user confusion and potential security gaps.

**Files**:
- `backend/api/_validation.js`
- `backend/api/auth/signup.js`
- `frontend/src/pages/SignupPage.tsx`
- `frontend/src/pages/ResetPasswordPage.tsx`

**Recommendation**: Centralize password validation requirements and enforce consistently across all endpoints and frontend.

## 9. API Response Format Inconsistency

**Evidence**:
- Auth endpoints (`_auth.js`): Return `{ error: message }` or raw data
- Error system (`_errors.js`): Returns structured `{ error: { type, message, timestamp } }`
- Response formatter (`_response-formatter.js`): Returns `{ type, status, code, message, data, metadata }`

**Impact**: Inconsistent API responses make frontend error handling unreliable and confusing.

**Files**:
- `backend/api/_auth.js`
- `backend/api/_errors.js`
- `backend/api/_response-formatter.js`

**Recommendation**: Standardize all API responses to use a single consistent format across the application.

---

Addressing these mismatches will realign every process/service on a single data access contract, restore pagination/filtering accuracy, ensure security safeguards are uniformly applied, and provide consistent user experience across authentication flows.
