# Frontend-Backend API Alignment Audit Report

## Executive Summary

This report analyzes the alignment between frontend API calls and backend endpoint implementations in the Farm Management System. The audit identified several misalignments that could cause frontend-backend communication issues.

## Methodology

- **Frontend Analysis**: Examined API calls in React hooks (`frontend/src/api/hooks/`) and authentication context
- **Backend Analysis**: Reviewed route definitions in `backend/index.js` and corresponding API modules
- **Comparison Criteria**: HTTP methods, URL paths, request parameters, response formats, and authentication headers

## Key Findings

### 1. Authentication Endpoints

**Issue**: Frontend calls `/api/auth/validate` but backend exposes `/api/auth/me`

**Frontend Calls**:
- `GET/POST /api/auth/validate` (from `AuthContext.tsx`)

**Backend Routes**:
- `GET /api/auth/me` (routes to `validate.js` handler)

**Impact**: Authentication validation will fail
**Severity**: Critical
**Recommendation**: Update frontend to use `/api/auth/me` instead of `/api/auth/validate`

### 2. Finance Endpoints

**Issue**: Frontend calls `/api/finance` but backend exposes `/api/finance-enhanced`

**Frontend Calls**:
- `GET /api/finance`
- `GET /api/finance?id={id}`
- `POST /api/finance`
- `PUT /api/finance/{id}`
- `DELETE /api/finance/{id}`

**Backend Routes**:
- `ALL /api/finance-enhanced`

**Impact**: All finance operations will fail
**Severity**: Critical
**Recommendation**: Update frontend to use `/api/finance-enhanced` or add route alias in backend

### 3. Task Time Logs

**Issue**: Frontend calls `/api/tasks/time-logs` but backend doesn't handle this sub-path

**Frontend Calls**:
- `POST /api/tasks/time-logs`
- `PUT /api/tasks/time-logs/{id}`

**Backend Routes**:
- `ALL /api/tasks` (handled by `tasks-enhanced.js`)
- `ALL /api/tasks/:id?`

**Analysis**: The `tasks-enhanced.js` handler doesn't specifically handle `/time-logs` sub-path
**Impact**: Time logging functionality will fail
**Severity**: High
**Recommendation**: Update tasks handler to support time-logs endpoints or add separate route

### 4. Locations Endpoints

**Issue**: Frontend has full CRUD for `/api/locations` but no backend implementation

**Frontend Calls**:
- `GET /api/locations`
- `GET /api/locations?id={id}`
- `POST /api/locations`
- `PUT /api/locations/{id}`
- `DELETE /api/locations/{id}`

**Backend Routes**: None

**Impact**: Location management features will fail
**Severity**: High
**Recommendation**: Implement locations API or remove frontend locations functionality

### 5. Fields Endpoints

**Issue**: Frontend calls `/api/fields` but no backend route exists

**Frontend ENDPOINTS** (from `config.ts`):
```javascript
fields: {
  list: '/fields',
  details: (id: string) => `/fields/${id}`,
  create: '/fields',
  update: (id: string) => `/fields/${id}`,
  delete: (id: string) => `/fields/${id}`,
  soilAnalysis: '/fields/soil-analysis',
}
```

**Backend**: `fields-enhanced.js` exists but no route in `index.js`

**Impact**: Field management will fail
**Severity**: High
**Recommendation**: Add `/api/fields` route to `index.js`

### 6. Weather Endpoints

**Issue**: Frontend expects weather endpoints but backend has different structure

**Frontend ENDPOINTS**:
- `/weather/farm`
- `/weather/impact-analysis`
- `/weather/recommendations`

**Backend Routes**:
- `ALL /api/market/*` (market data)
- `weather-location.js` and `weather-recommendations.js` exist but no routes

**Impact**: Weather features will fail
**Severity**: Medium
**Recommendation**: Implement weather routes or update frontend expectations

### 7. Animals vs Livestock

**Issue**: Frontend has separate `animals` endpoints that duplicate `livestock`

**Frontend ENDPOINTS**:
```javascript
animals: {
  list: '/livestock',  // Same as livestock
  details: (id: string) => `/livestock/${id}`,
  // ... more endpoints
}
```

**Backend**: Only `/api/livestock`

**Impact**: Redundant code, potential confusion
**Severity**: Low
**Recommendation**: Remove duplicate animals endpoints, use livestock consistently

## Detailed API Mapping

### ✅ Aligned Endpoints

| Endpoint | Methods | Status |
|----------|---------|--------|
| `/api/auth/login` | POST | ✅ |
| `/api/auth/signup` | POST | ✅ |
| `/api/farms` | GET, POST, PUT, DELETE | ✅ |
| `/api/crops` | GET, POST, PUT, DELETE | ✅ |
| `/api/livestock` | GET, POST, PUT, DELETE | ✅ |
| `/api/tasks` | GET, POST, PUT, DELETE | ✅ |
| `/api/inventory` | GET, POST, PUT, DELETE | ✅ |
| `/api/rotations` | GET, POST, DELETE | ✅ |
| `/api/pest-disease` | GET, POST, DELETE | ✅ |

### ❌ Misaligned Endpoints

| Frontend Call | Backend Route | Issue |
|---------------|---------------|-------|
| `GET/POST /api/auth/validate` | `GET /api/auth/me` | Path mismatch |
| `ALL /api/finance*` | `ALL /api/finance-enhanced` | Path mismatch |
| `POST /api/tasks/time-logs` | None | Missing endpoint |
| `PUT /api/tasks/time-logs/{id}` | None | Missing endpoint |
| `ALL /api/locations*` | None | Missing implementation |
| `ALL /api/fields*` | None | Missing route |
| `/api/weather/*` | None | Missing routes |

## Request/Response Format Analysis

### Authentication Headers
- **Frontend**: Uses `Authorization: Bearer ${token}` (via `apiClient`)
- **Backend**: Expects `Authorization` header
- **Status**: ✅ Aligned

### Response Formats
- **Backend**: Consistent JSON responses with `{ success: boolean, data/error }` structure
- **Frontend**: Expects various response formats (arrays, objects, paginated)
- **Status**: ⚠️ Needs verification per endpoint

### Error Handling
- **Backend**: Returns HTTP status codes with error messages
- **Frontend**: Handles errors via try/catch in hooks
- **Status**: ✅ Generally aligned

## Recommendations

### Immediate Actions (Critical)
1. **Fix auth endpoint**: Change frontend `/api/auth/validate` to `/api/auth/me`
2. **Fix finance endpoint**: Change frontend `/api/finance` to `/api/finance-enhanced`

### Short-term Actions (High Priority)
3. **Add locations API** or remove locations functionality
4. **Add fields route** to `index.js`
5. **Implement task time-logs** in tasks handler

### Medium-term Actions
6. **Implement weather routes** or update frontend
7. **Clean up duplicate animals endpoints**

### Testing Recommendations
8. **Add API integration tests** to catch future misalignments
9. **Implement API contract testing** between frontend and backend
10. **Add runtime API validation** in development mode

## Conclusion

The audit revealed 7 critical misalignments that will prevent the application from functioning properly. The most critical issues involve authentication and finance endpoints. Implementing the recommended fixes will ensure proper frontend-backend communication.

## Next Steps

1. Prioritize and implement critical fixes
2. Update frontend API calls
3. Add missing backend routes
4. Implement comprehensive API testing
5. Establish API versioning strategy to prevent future issues
