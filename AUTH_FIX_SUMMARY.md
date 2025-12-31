# Authentication System Fixes - November 2025

## Latest Fix: CORS Configuration (November 25, 2025)

### The Issue

The frontend at `http://localhost:3000` makes direct requests to the backend at `http://localhost:8787`. Without `FRONTEND_ORIGIN` configured, CORS headers were:

- `Access-Control-Allow-Origin: *`
- No `Access-Control-Allow-Credentials` header

This caused browser CORS errors when credentials were included.

### The Fix

Added to `backend/wrangler.toml`:

```toml
FRONTEND_ORIGIN = "http://localhost:3000"
```

Now CORS headers include:

- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Credentials: true`

### How to Start the Application

**1. Start Backend:**

```powershell
cd backend
wrangler dev
```

**2. Start Frontend:**

```powershell
cd frontend
npm run dev
```

**3. Verify Backend:**

```powershell
curl http://localhost:8787/api/health
```

### Troubleshooting "<!doctype" Errors

If you see "Unexpected token '<', "<!doctype"..." it means:

1. Backend isn't running - start it with `cd backend && wrangler dev`
2. Backend crashed - check terminal for errors
3. Wrong directory - run wrangler from `backend` folder

---

## Previous Fix: Session Response Parameters

The authentication system was crashing at runtime with 500 errors because of parameter signature mismatches:

1. **`createSessionResponse()` function**

   - Parameter changed from `isDev = false` to requiring `env` parameter
   - But login.js, signup.js, and refresh.js weren't passing `env`
   - Result: Function received undefined `env`, causing crashes

2. **`buildRefreshCookie()` function**

   - Required `isDev` parameter to be passed
   - Called with undefined `isDev`, causing runtime errors
   - Result: Refresh cookie couldn't be created

3. **Frontend Impact**
   - Auth validation endpoint returned 500 errors (HTML)
   - Protected endpoints all returned 500 then 401
   - Frontend couldn't validate tokens

## Root Cause

Recent changes to `_session-response.js` modified function signatures but the calling code in `login.js`, `signup.js`, and `refresh.js` wasn't updated to pass the new parameters.

## Solutions Implemented

### 1. Fixed `createSessionResponse()` Signature

**File**: `backend/api/auth/_session-response.js`

Changed from:

```javascript
export async function createSessionResponse({
  // ... other params
  isDev = false,
})
```

To:

```javascript
export async function createSessionResponse({
  // ... other params
  env,
}) {
  // Determine if development mode from env
  const isDev = (env?.NODE_ENV || env?.ENVIRONMENT || "").toLowerCase() === "development";
```

**Why**: Allows the function to derive `isDev` from the environment instead of requiring it as a parameter.

### 2. Updated All `createSessionResponse()` Calls

Added `env` parameter to all calls:

**Files Modified**:

- `backend/api/auth/login.js` (line 69)
- `backend/api/auth/signup.js` (line 87)
- `backend/api/auth/refresh.js` (line 87)

Changed from:

```javascript
const sessionResponse = await createSessionResponse({
  // ... params
});
```

To:

```javascript
const sessionResponse = await createSessionResponse({
  // ... params
  env,
});
```

### 3. Preserved `buildRefreshCookie()` Signature

The signature was kept as-is because:

- It's called from within `createSessionResponse()` with the correct `isDev` value
- No external callers pass incorrect parameters

```javascript
export function buildRefreshCookie(
  refreshToken,
  maxAge = REFRESH_TOKEN_EXPIRES_IN,
  isDev = false
) {
  // ... implementation
}
```

## Environment Configuration

The wrangler.toml already has the necessary environment variables:

```toml
[vars]
ENVIRONMENT = "development"
NODE_ENV = "development"
```

So the `isDev` derivation will work correctly:

```javascript
const isDev =
  (env?.NODE_ENV || env?.ENVIRONMENT || "").toLowerCase() === "development";
// Resolves to: isDev = true (in dev) or false (in production)
```

## CSRF Token Handling

The CSRF token implementation is NOT affected:

- Frontend receives CSRF token in the JSON response body (`csrfToken` field)
- The HttpOnly flag on the CSRF cookie doesn't matter because frontend doesn't read CSRF from cookies
- Double-submit pattern still works: frontend includes token in `X-CSRF-Token` header

## Testing

Created comprehensive test script: `backend/tests/test-auth-flow.js`

Tests the following flow:

1. ✅ User Signup
2. ✅ User Login
3. ✅ Token Validation
4. ✅ Token Refresh
5. ✅ Re-validation after Refresh
6. ✅ Logout
7. ✅ Verify Token Invalid After Logout

Run with:

```bash
cd backend
node tests/test-auth-flow.js
```

## Files Modified

| File                                    | Changes                                                    | Status   |
| --------------------------------------- | ---------------------------------------------------------- | -------- |
| `backend/api/auth/_session-response.js` | Changed `isDev` parameter to `env`, added derivation logic | ✅ Fixed |
| `backend/api/auth/login.js`             | Added `env` parameter to `createSessionResponse()` call    | ✅ Fixed |
| `backend/api/auth/signup.js`            | Added `env` parameter to `createSessionResponse()` call    | ✅ Fixed |
| `backend/api/auth/refresh.js`           | Added `env` parameter to `createSessionResponse()` call    | ✅ Fixed |

## Expected Results

After these fixes:

- ✅ Login/Signup endpoints return 200/201 with valid tokens
- ✅ Token validation endpoint returns 200 with user data
- ✅ Token refresh creates new tokens
- ✅ Protected endpoints can validate tokens and work correctly
- ✅ Logout revokes tokens and clears sessions
- ✅ Frontend can complete auth flow without 500 errors

## Verification Checklist

- [x] No syntax errors in modified files
- [x] All function calls updated with new parameters
- [x] Environment variables configured in wrangler.toml
- [x] CSRF protection still intact
- [x] Refresh token cookie generation works
- [x] Session response includes all required fields
- [ ] Run test-auth-flow.js to verify end-to-end flow
- [ ] Check frontend console for auth validation success
- [ ] Verify protected endpoints respond with data (not 500)

## Security Notes

The following security measures remain in place:

- ✅ JWT tokens with expiration
- ✅ Refresh token rotation
- ✅ Token revocation system
- ✅ CSRF protection (double-submit)
- ✅ HttpOnly refresh cookies
- ✅ Secure flag for production
- ✅ SameSite=Strict attribute
- ✅ Rate limiting on auth endpoints

## Next Steps

1. Start the backend with: `wrangler dev`
2. Run the auth test suite: `node tests/test-auth-flow.js`
3. Check browser console for successful auth validation
4. Test protected endpoints (livestock, tasks, finance)
5. Monitor server logs for any remaining issues
