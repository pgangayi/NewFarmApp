# Auth System Debugging Guide

## Quick Diagnostic Steps

### 1. Check Backend is Running

```bash
# From root directory
cd backend
wrangler dev
# Should see: ⛅ wrangler dev is running on http://localhost:8787
```

### 2. Test Auth Endpoint Directly

```bash
# Quick test - signup should return 201
curl -X POST http://localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!","name":"Test"}'

# Expected response:
# {
#   "accessToken": "eyJ0eXAi...",
#   "refreshToken": "eyJ0eXAi...",
#   "csrfToken": "...",
#   "user": {"id": "...", "email": "test@example.com", "name": "Test"}
# }
```

### 3. Common Error Patterns

#### Error: "<!DOCTYPE html>" or HTML in response

**Cause**: Backend threw an unhandled exception
**Check**:

1. Backend console for error messages
2. Verify all functions are exported correctly
3. Check for missing `env` parameter in function calls

#### Error: 401 Unauthorized on protected endpoints

**Cause**: Token validation failed
**Check**:

1. Token is present in Authorization header: `Bearer <token>`
2. Token hasn't expired (default: 1 hour)
3. Token signature is valid (use JWT.io to inspect)

#### Error: CSRF validation failed

**Cause**: CSRF token missing or invalid
**Check**:

1. `X-CSRF-Token` header is present
2. Header value matches `csrfToken` from login response
3. For POST/PUT/DELETE requests, include: `'X-CSRF-Token': csrfToken`

#### Error: 500 on login/signup

**Cause**: Usually parameter mismatch in session response creation
**Check**:

1. `createSessionResponse()` receives `env` parameter
2. `buildRefreshCookie()` called with `isDev` parameter
3. CSRF token generation succeeds
4. Database connection is working

## Key Function Signatures

### createSessionResponse()

```javascript
export async function createSessionResponse({
  user,                    // User object
  userId,                  // User ID (string)
  accessToken,            // JWT access token
  refreshToken,           // JWT refresh token
  csrf,                   // CSRFProtection instance
  ipAddress,              // Client IP
  userAgent,              // User-Agent string
  rateLimitHeaders,       // Rate limit headers (optional)
  status = 200,           // HTTP status code
  expiresIn = 3600,       // Access token expires in seconds
  refreshMaxAge = 2592000,// Refresh token max age in seconds
  env,                    // CRITICAL: Environment object with NODE_ENV/ENVIRONMENT
})
```

### buildRefreshCookie()

```javascript
export function buildRefreshCookie(
  refreshToken,           // JWT refresh token
  maxAge = 2592000,       // Max age in seconds
  isDev = false           // Development mode flag
)
// Returns: "refresh_token=<token>; HttpOnly; SameSite=Strict; Path=/; Max-Age=<n>; [Secure]"
```

## Token Flow

```
User Signup/Login
    ↓
Generate Access Token (1 hour expiry)
    ↓
Generate Refresh Token (30 days expiry)
    ↓
Create Session Response:
  - CSRF token generated
  - Refresh token as HttpOnly cookie
  - Access token in response body
  - CSRF token in response body
    ↓
Frontend stores:
  - Access token in memory/localStorage
  - CSRF token in memory
  - Refresh token in cookie (automatic)
    ↓
Protected Request:
  - Include: Authorization: Bearer <accessToken>
  - Include: X-CSRF-Token: <csrfToken>
    ↓
If Token Expired:
  - Call /api/auth/refresh
  - Get new tokens
  - Retry original request
```

## Environment Variables

These must be set in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "development"          # Set to "production" in prod
NODE_ENV = "development"             # Set to "production" in prod
JWT_SECRET = "your-secret-key"      # At least 32 characters
APP_URL = "http://localhost:3000"   # Frontend URL
RESEND_API_KEY = "re_..."           # For email notifications
FROM_EMAIL = "noreply@..."          # Email sender

[dev]
port = 8787                         # Backend port
```

## Testing Checklist

Run `node tests/test-auth-flow.js` and verify all tests pass:

- [ ] Signup returns 201 with tokens
- [ ] Login returns 200 with tokens
- [ ] Token validation returns valid user
- [ ] Token refresh returns new tokens
- [ ] Validation after refresh succeeds
- [ ] Logout returns 200
- [ ] Validation after logout fails (401)

## Log Locations

**Backend Console**:

- Errors: Watch for "Auth validation error", "CSRF token generation failed"
- Info: Signup/login/logout events
- Debug: Token verification, database queries

**Frontend Console**:

- Auth validation success: "User authenticated"
- Auth validation failure: "Auth validation failed: ..."
- Protected endpoint errors: "GET /api/livestock 500"

## Production Checklist

Before deploying to production:

1. [ ] Set `ENVIRONMENT = "production"` in wrangler.toml
2. [ ] Set `NODE_ENV = "production"` in wrangler.toml
3. [ ] Ensure JWT_SECRET is strong (32+ characters, random)
4. [ ] Update APP_URL to production frontend URL
5. [ ] Configure HTTPS for backend
6. [ ] Enable Secure flag for cookies (automatic in production when NODE_ENV=production)
7. [ ] Test full auth flow in production environment
8. [ ] Monitor error logs for any issues
9. [ ] Set up token revocation cleanup job (optional)

## Recovery Procedures

### Reset Database Auth State

```bash
# Clear all user sessions/tokens
# WARNING: All users will be logged out
cd backend
wrangler d1 execute farmers-boot-local --remote << EOF
  DELETE FROM token_revocation;
  DELETE FROM refresh_token_rotations;
  DELETE FROM login_attempts;
  DELETE FROM audit_logs WHERE action IN ('login', 'logout', 'signup');
EOF
```

### Force Logout All Users

```sql
DELETE FROM token_revocation;
DELETE FROM refresh_token_rotations;
UPDATE users SET last_activity = NULL;
```

### Clear Rate Limit Cache

```bash
# Rate limits are stored in memory - restart backend to clear
# Stop: Ctrl+C in backend terminal
# Start: wrangler dev
```

## Performance Tips

1. **Cache Validation**: Don't validate on every request, cache for 5-10 minutes
2. **Rate Limits**: Current limits: 5 failed logins per 15 min per IP
3. **Token Expiry**: Keep access tokens short (1 hour) and refresh tokens longer (30 days)
4. **Database**: Index users.email for faster lookups during login

## Security Reminders

- ✅ Always use HTTPS in production
- ✅ Keep JWT_SECRET secure and rotate periodically
- ✅ Enable CSRF protection on state-changing operations
- ✅ Log auth events for audit trail
- ✅ Implement rate limiting on auth endpoints
- ✅ Use HttpOnly flag for refresh tokens
- ✅ Never log sensitive data (passwords, tokens)
- ✅ Validate all inputs on backend

## References

- JWT Tokens: https://jwt.io/
- CSRF Protection: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- D1 Database: https://developers.cloudflare.com/workers/databases/d1/
