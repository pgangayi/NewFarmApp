# Quick Reference - Authentication & API

## 🚀 Quick Start

### Frontend - React Hook

```typescript
import { useAuth } from "./hooks/AuthContext";

function App() {
  const { signIn, user, signOut, getAuthHeaders } = useAuth();

  // Login
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await signIn(email, password);
    if (error) console.error(error.message);
    else console.log("Logged in as", data?.user.name);
  };

  // Protected API call
  const getFarms = async () => {
    const response = await fetch("/api/farms", {
      headers: getAuthHeaders(),
    });
    return response.json();
  };

  // Logout
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div>
      {user ? (
        <>
          <p>Welcome, {user.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={() => handleLogin("test@example.com", "password")}>
          Login
        </button>
      )}
    </div>
  );
}
```

### Backend - Protected Endpoint

```javascript
import { AuthMiddleware } from "./_auth-middleware.js";
import { createErrorResponse, createSuccessResponse } from "./_auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const middleware = new AuthMiddleware(env);

  // Protect route
  const protection = await middleware.createProtectedRoute({
    requireCSRF: true,
  })(request);

  if (!protection.authenticated) {
    return protection.response;
  }

  const { user, requestContext } = protection;

  // Your code here
  try {
    const result = await processRequest(user);
    return createSuccessResponse({ success: true, data: result }, 200);
  } catch (error) {
    return createErrorResponse(error.message, 500);
  }
}
```

## 🔐 Token Management

### Tokens Included in Login Response

```json
{
  "user": { "id": "...", "email": "...", "name": "...", ... },
  "accessToken": "eyJ...",      // 1 hour validity
  "refreshToken": "eyJ...",     // 30 day validity
  "csrfToken": "base64...",     // 30 min validity
  "expiresIn": 3600
}
```

### Required Headers for API Requests

```javascript
const headers = {
  Authorization: `Bearer ${accessToken}`,
  "X-CSRF-Token": `${csrfToken}`,
  "Content-Type": "application/json",
};
```

### Refresh When Access Token Expires

```javascript
// Call this when you get 401 response
const response = await fetch("/api/auth/refresh", {
  method: "POST",
  headers: getAuthHeaders(),
  credentials: "include", // Important for cookies
});
const { accessToken, csrfToken } = await response.json();
```

## 📊 API Endpoints

### Public (No Auth Required)

```
POST   /api/auth/login              - Login
POST   /api/auth/signup             - Register
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Complete password reset
GET    /api/health                  - Health check
```

### Protected (Auth + CSRF Required)

```
GET    /api/auth/validate           - Check token validity
POST   /api/auth/refresh            - Get new access token
POST   /api/auth/logout             - Logout

GET    /api/farms                   - List farms
POST   /api/farms                   - Create farm
PUT    /api/farms/{id}              - Update farm
DELETE /api/farms/{id}              - Delete farm

GET    /api/inventory               - List inventory
POST   /api/inventory               - Add item
... (see API_AUTH_GUIDE.md for full list)
```

## 🔄 Common Workflows

### Login Flow

```javascript
// 1. Login
const loginRes = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { accessToken, refreshToken, csrfToken } = await loginRes.json();

// 2. Store tokens
localStorage.setItem("accessToken", accessToken);
// Cookies are set automatically by browser

// 3. Use in requests
const apiRes = await fetch("/api/farms", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "X-CSRF-Token": csrfToken,
  },
});
```

### Handling Token Expiration

```javascript
// Wrap fetch calls to auto-refresh
async function apiCall(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    headers: getAuthHeaders(),
  });

  // Token expired?
  if (response.status === 401) {
    // Refresh
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (refreshRes.ok) {
      const { accessToken, csrfToken } = await refreshRes.json();
      // Update stored tokens
      updateTokens(accessToken, csrfToken);
      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: getAuthHeaders(),
      });
    }
  }

  return response;
}
```

### Logout Flow

```javascript
// 1. Call logout
await fetch("/api/auth/logout", {
  method: "POST",
  headers: getAuthHeaders(),
});

// 2. Clear stored tokens
localStorage.removeItem("auth_session");
localStorage.removeItem("auth_token");

// 3. Redirect to login
window.location.href = "/login";
```

## ⚠️ Error Codes

| Code | Meaning           | Action                                  |
| ---- | ----------------- | --------------------------------------- |
| 400  | Bad request       | Check request format                    |
| 401  | Unauthorized      | Refresh token or re-login               |
| 403  | Forbidden         | CSRF token missing/expired or no access |
| 429  | Too many requests | Wait (rate limited)                     |
| 500  | Server error      | Check server logs                       |

## 🛡️ Security Checklist

- ✅ Always use HTTPS in production
- ✅ Don't expose tokens in URLs
- ✅ Store refresh tokens in HTTP-only cookies
- ✅ Always include CSRF token in mutations
- ✅ Refresh tokens before expiration
- ✅ Clear tokens on logout
- ✅ Handle token refresh automatically
- ✅ Validate requests on backend

## 📝 Environment Setup

### Backend

```bash
# .env
JWT_SECRET=your-very-secret-key-at-least-32-characters-long
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
REFRESH_TOKEN_ROTATION=true
```

### Frontend

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8787
```

## 🔗 Documentation Links

- **Full Guide**: See `API_AUTH_GUIDE.md`
- **Implementation Details**: See `AUTHENTICATION_SUMMARY.md`
- **Middleware Examples**: See `backend/api/_auth-middleware.js`
- **API Implementation**: See `backend/api/auth/` directory

## 💡 Tips & Tricks

### Debugging Auth Issues

```javascript
// Check if token is valid
const response = await fetch("/api/auth/validate", {
  headers: getAuthHeaders(),
});
console.log("Token valid:", response.ok);

// See what's in token (don't do in production)
const decoded = JSON.parse(atob(token.split(".")[1]));
console.log("Token payload:", decoded);
```

### Testing with curl

```bash
# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt

# Use token
curl http://localhost:8787/api/farms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF" \
  -b cookies.txt
```

### React Component - Protected Route

```typescript
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <YourComponent />;
}
```

---

**Last Updated**: November 25, 2025  
**Status**: Production Ready ✅
