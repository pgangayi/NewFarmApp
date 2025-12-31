# API Authentication & Configuration Guide

## Overview

All API endpoints require proper authentication and CSRF protection. This document outlines the authentication flow, required headers, and endpoint specifications.

## Authentication Flow

### 1. Login/Signup

- **Endpoint**: `POST /api/auth/login` or `POST /api/auth/signup`
- **CSRF Required**: No (initial authentication)
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword",
    "name": "User Name" // signup only
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token",
    "csrfToken": "base64-token",
    "expiresIn": 3600
  }
  ```
- **Response Headers**:
  - `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`
  - `Set-Cookie: csrf_token=...; HttpOnly; SameSite=Strict; Max-Age=1800`
  - `X-CSRF-Token: base64-token`

### 2. Token Validation

- **Endpoint**: `GET /api/auth/validate` or `POST /api/auth/validate`
- **CSRF Required**: No (read-only by nature)
- **Headers Required**:
  - `Authorization: Bearer {accessToken}`
- **Response**: User object if valid, 401 if invalid

### 3. Token Refresh

- **Endpoint**: `POST /api/auth/refresh`
- **CSRF Required**: Recommended but not enforced (allows refresh after CSRF expiry)
- **Cookies Required**: `refresh_token=...`
- **Headers Recommended**:
  - `Authorization: Bearer {currentAccessToken}` (optional)
  - `X-CSRF-Token: {csrfToken}` (optional)
- **Response**: New tokens (same format as login)

### 4. Logout

- **Endpoint**: `POST /api/auth/logout` or `GET /api/auth/logout`
- **CSRF Required**: Not enforced (revokes all tokens regardless)
- **Headers Required**:
  - `Authorization: Bearer {accessToken}`
- **Cookies Required**: `refresh_token=...` (optional)
- **Response**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```
- **Response Headers**:
  - `Set-Cookie: refresh_token=; Max-Age=0` (clearing cookie)
  - `Set-Cookie: csrf_token=; Max-Age=0` (clearing cookie)

## Protected API Endpoints

### Authentication Required: YES

All endpoints below require:

1. Valid `Authorization: Bearer {accessToken}` header
2. CSRF token in `X-CSRF-Token` header (for POST/PUT/PATCH/DELETE)
3. Refresh token in cookies (handled automatically by browsers)

#### Farm Management

- `GET /api/farms` - List farms
- `POST /api/farms` - Create farm
- `PUT /api/farms/{id}` - Update farm
- `DELETE /api/farms/{id}` - Delete farm
- `GET /api/farms/stats` - Farm statistics
- `POST /api/farms/operations` - Farm operations

#### Inventory Management

- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/{id}` - Update item
- `DELETE /api/inventory/{id}` - Delete item
- `GET /api/inventory/alerts` - Get low-stock alerts
- `GET /api/inventory/suppliers` - Manage suppliers
- `GET /api/inventory/items` - Specific items

#### Tasks Management

- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/tasks/templates` - Task templates
- `POST /api/tasks/time-logs` - Time logging

#### Crops Management

- `GET /api/crops` - List crops
- `POST /api/crops` - Create crop
- `PUT /api/crops/{id}` - Update crop
- `DELETE /api/crops/{id}` - Delete crop
- `POST /api/crops/rotation` - Crop rotation planning
- `POST /api/crops/irrigation` - Irrigation management
- `POST /api/crops/pests-diseases` - Pest/disease tracking
- `POST /api/crops/soil-health` - Soil health analysis

#### Livestock Management

- `GET /api/livestock` - List animals
- `POST /api/livestock` - Add animal
- `PUT /api/livestock/{id}` - Update animal
- `DELETE /api/livestock/{id}` - Delete animal
- `GET /api/livestock/health` - Health records

#### Finance Management

- `GET /api/finance` - List finances
- `POST /api/finance` - Add entry
- `GET /api/finance/entries` - Detailed entries
- `POST /api/finance/reports` - Generate reports
- `GET /api/finance/budgets` - Budget tracking

#### Fields Management

- `GET /api/fields` - List fields
- `POST /api/fields` - Create field
- `PUT /api/fields/{id}` - Update field
- `DELETE /api/fields/{id}` - Delete field
- `POST /api/fields/soil-analysis` - Soil analysis

## CSRF Protection

### When CSRF is Required

- All `POST`, `PUT`, `PATCH`, `DELETE` requests to protected endpoints
- Automatically included in response to login/signup/refresh

### How to Use CSRF Token

```javascript
// Get CSRF token from login response
const { csrfToken } = loginResponse;

// Include in all state-changing requests
fetch("/api/farms", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "X-CSRF-Token": csrfToken, // Include CSRF token
  },
  body: JSON.stringify(farmData),
});
```

### CSRF Token Lifecycle

- **Issued**: On login, signup, and token refresh
- **Expiration**: 30 minutes (Max-Age=1800)
- **Storage**: HTTP-only cookie + header value
- **Validation**: Double-submit pattern (header vs cookie)

## Security Best Practices

### Token Management

1. **Access Token**: Short-lived (1 hour), use for API requests
2. **Refresh Token**: Long-lived (30 days), stored in HTTP-only cookie
3. **CSRF Token**: 30 minutes, for preventing cross-site attacks
4. **Token Rotation**: Refresh tokens are rotated on each refresh request

### Cookie Security

- `HttpOnly`: Prevents JavaScript access (except CSRF which uses double-submit)
- `Secure`: Only sent over HTTPS (production)
- `SameSite=Strict`: Prevents CSRF and cross-site leakage
- `Path=/`: Available site-wide

### Rate Limiting

- Login attempts: Max 5 failed attempts per 15 minutes per IP
- After 5 failures: 30-minute IP block
- Suspicious user agents: Logged as security event

### Error Handling

- **401 Unauthorized**: Invalid/expired token or missing auth
- **403 Forbidden**: CSRF validation failed or insufficient permissions
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side issue

## Implementation Examples

### Frontend - React/TypeScript

```typescript
import { useAuth } from "./hooks/AuthContext";

function MyComponent() {
  const { signIn, user, getAuthHeaders } = useAuth();

  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.error) {
      console.error(result.error.message);
    } else {
      console.log("Logged in as", result.data?.user.name);
    }
  };

  const createFarm = async (farmData: any) => {
    const response = await fetch("/api/farms", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(farmData),
    });
    return response.json();
  };

  return <>{user ? `Welcome ${user.name}` : "Please login"}</>;
}
```

### Backend - Protected Route Handler

```javascript
import { AuthMiddleware } from "./_auth-middleware.js";

export async function onRequest(context) {
  const { request, env } = context;
  const middleware = new AuthMiddleware(env);

  // Protect route with auth + CSRF
  const protection = await middleware.createProtectedRoute({
    requireCSRF: true,
  })(request);

  if (!protection.authenticated) {
    return protection.response;
  }

  const { user, requestContext } = protection;

  // Your handler logic here
  try {
    // Access the authenticated user
    console.log("Request from:", user.email);

    // Return success response
    return new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

## Troubleshooting

### Issue: 401 Unauthorized on Protected Routes

- **Check**: Access token is expired (1 hour)
- **Solution**: Call `/api/auth/refresh` with refresh token to get new access token
- **Verify**: `Authorization` header is set correctly with `Bearer {token}`

### Issue: 403 CSRF Validation Failed

- **Check**: CSRF token is missing or expired (30 minutes)
- **Solution**: Get new CSRF token from login/refresh response
- **Verify**: `X-CSRF-Token` header is set correctly for POST/PUT/PATCH/DELETE

### Issue: Cookies Not Persisting

- **Check**: Browser privacy settings or incognito mode
- **Check**: Domain/path mismatch
- **Verify**: `credentials: 'include'` is set in fetch requests for cross-origin
- **Solution**: Ensure backend sets `Access-Control-Allow-Credentials: true`

### Issue: CORS Errors

- **Check**: Frontend origin matches `FRONTEND_ORIGIN` env variable
- **Verify**: Request includes required CORS headers
- **Solution**: Add frontend domain to allowed origins in backend env

## Configuration

### Environment Variables

#### Backend

- `JWT_SECRET`: Secret key for signing JWT tokens (required)
- `FRONTEND_ORIGIN`: Allowed frontend origin for CORS
- `REFRESH_TOKEN_ROTATION`: Enable token rotation (default: true)
- `NODE_ENV`: Environment (development/production)

#### Frontend

- `VITE_API_BASE_URL`: Backend API base URL (default: http://localhost:8787 for dev)
- `VITE_API_URL`: Alternative API URL config

## Version History

- **2024-11-25**: Initial authentication system with comprehensive security
  - JWT tokens (access + refresh)
  - CSRF protection with double-submit pattern
  - Token revocation system
  - Login attempt tracking and rate limiting
  - Audit logging for security events
