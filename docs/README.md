# Master Documentation — Farmers Boot (Consolidated) 📚

This single master document consolidates project documentation so only a single source of truth is maintained. It includes setup guides, API docs, policies, and audit reports. Originals have been archived in `archive/docs-originals/`.

## Table of Contents
- [API Reference](#api-reference)
- [AI Setup Guide](#ai-setup-guide)
- [Artifact & Cleanup Policy](#artifact--cleanup-policy)
- [Backend Secrets & Environment Variables](#backend-secrets--environment-variables)
- [Comprehensive Audit Report (MAJOR)](#comprehensive-audit-report-major)
- [API Alignment Audit](#api-alignment-audit)
- [Configuration Updates Summary](#configuration-updates-summary)
- [Lint Analysis Summary](#lint-analysis-summary)
- [Fix Report: Backup Noise Issue](#fix-report-backup-noise-issue)
- [Scalability Evaluation Summary](#scalability-evaluation-summary)
- [Plans and Roadmaps](#plans-and-roadmaps)

---

## API Reference

*Source: `docs/API`*

---

# Farmers Boot API Documentation

## Base URL
- **Local Development**: `http://localhost:3000/api` (proxied to localhost:8787)
- **Production**: Configured via wrangler.toml

## Authentication Endpoints

### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_1731420800_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-11-13T08:48:17.000Z"
  },
  "token": "jwt_access_token_here",
  "message": "User created successfully"
}
```

### POST /api/auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt_access_token_here"
}
```

**Headers:** Sets HTTP-only refresh token cookie and CSRF token

### GET /api/auth/validate
Validate current user session (requires Authorization header).

**Headers:**
```
Authorization: Bearer jwt_access_token
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/auth/logout
Invalidate current session and revoke tokens.

**Headers:**
```
Authorization: Bearer jwt_access_token
Cookie: refresh_token=...
X-CSRF-Token: ...
```

### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST /api/auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePassword123!"
}
```

## Core Management Endpoints

### Farm Management (/api/farms)

**GET /api/farms** - List user's farms
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Response:** Array of farms with member roles

**POST /api/farms** - Create new farm
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Body:**
```json
{
  "name": "Green Valley Farm",
  "location": "California, USA",
  "area_hectares": 50.5,
  "metadata": {
    "farm_type": "organic",
    "established": "2020"
  }
}
```

**PUT /api/farms/:id** - Update farm details
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Body:** Partial farm update object

**DELETE /api/farms/:id** - Delete farm (owner only)
- **Headers:** `Authorization: Bearer jwt_access_token`

### Animal Management (/api/animals)

**GET /api/animals** - List animals (requires farm access)
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Query:** `?farm_id=123`

**POST /api/animals** - Add new animal
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Body:**
```json
{
  "farm_id": 123,
  "name": "Bessie",
  "species": "cow",
  "breed": "Holstein",
  "birth_date": "2022-03-15",
  "sex": "female",
  "identification_tag": "COW001",
  "health_status": "healthy"
}
```

**PUT /api/animals/:id** - Update animal details
**DELETE /api/animals/:id** - Remove animal

### Crop Management (/api/crops)

**GET /api/crops** - List crops
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Query:** `?farm_id=123`

**POST /api/crops** - Add new crop
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Body:**
```json
{
  "farm_id": 123,
  "name": "Corn Field A",
  "crop_type": "corn",
  "area_hectares": 10.5,
  "planting_date": "2025-04-15",
  "expected_harvest_date": "2025-09-15",
  "status": "planted"
}
```

### Task Management (/api/tasks)

**GET /api/tasks** - List tasks
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Query:** `?farm_id=123&status=pending`

**POST /api/tasks** - Create new task
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Body:**
```json
{
  "farm_id": 123,
  "title": "Irrigate Field A",
  "description": "Water the corn field for 2 hours",
  "status": "pending",
  "priority": "high",
  "due_date": "2025-11-15",
  "assigned_to": "user_123"
}
```

**PUT /api/tasks/:id** - Update task
**DELETE /api/tasks/:id** - Remove task

### Enhanced Finance (/api/finance-enhanced)

**GET /api/finance-enhanced** - Get financial data
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Query:** `?farm_id=123&start_date=2025-01-01&end_date=2025-12-31`

**POST /api/finance-enhanced** - Add financial entry
- **Headers:** `Authorization: Bearer jwt_access_token`
- **Body:**
```json
{
  "farm_id": 123,
  "entry_date": "2025-11-13",
  "type": "expense",
  "amount": 150.50,
  "currency": "USD",
  "account": "operational",
  "description": "Purchased fertilizer",
  "reference_type": "purchase",
  "reference_id": "PO-2025-001"
}
```

## Utility Endpoints

### GET /api/health
Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T08:48:17.000Z",
  "version": "1.0.0",
  "database": "connected"
}
```

### GET /api/search
Global search across entities.

**Headers:** `Authorization: Bearer jwt_access_token`
**Query:** `?q=corn&farm_id=123`

### GET /api/notifications
Get user notifications and alerts.

**Headers:** `Authorization: Bearer jwt_access_token`

### GET /api/performance
Application performance metrics.

**Headers:** `Authorization: Bearer jwt_access_token`
**Query:** `?farm_id=123&period=30d`

### POST /api/bulk-operations
Perform bulk operations on multiple entities.

**Headers:** `Authorization: Bearer jwt_access_token`
**Body:**
```json
{
  "operation": "update_status",
  "entity_type": "tasks",
  "entity_ids": [1, 2, 3],
  "updates": {
    "status": "completed"
  }
}
```

## WebSocket Endpoints

### WebSocket /api/websocket
Real-time updates for dashboard changes.

**Connection:**
```
ws://localhost:8787/api/websocket
```

**Protocol:**
- Client sends: `{ "type": "authenticate", "token": "jwt_token" }`
- Server sends: `{ "type": "data_update", "entity": "farm", "data": {...} }`

## Security Features

### Rate Limiting
- **Login/Auth**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **Bulk Operations**: 10 requests per minute per user

### CSRF Protection
- CSRF token required for state-changing operations
- Token included in response headers: `X-CSRF-Token`

### Access Control
- Role-based permissions: `owner`, `manager`, `admin`, `member`, `worker`
- Farm-level access control for all farm-related operations

## Error Responses

### Standard Error Format
```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Rate Limited
- `500` - Internal Server Error

## Headers Reference

### Required Headers
- `Content-Type: application/json` (for POST/PUT requests)
- `Authorization: Bearer jwt_access_token` (for authenticated endpoints)

### Optional Headers
- `X-CSRF-Token: csrf_token` (for state-changing operations)

### Response Headers
- `X-CSRF-Token: csrf_token` (set after login)
- `Set-Cookie: refresh_token=...` (HTTP-only cookie)
- `Access-Control-Allow-Origin: *` (CORS)

## Database Schema

Main entities and relationships:
- **users** → **farms** (ownership/membership)
- **farms** → **animals**, **crops**, **tasks**, **inventory**, **finance_entries**
- **farm_members** (user-farm relationship with roles)
- **inventory_transactions** (audit trail for inventory changes)

For detailed schema, see `migrations/0001_d1_complete_schema.sql`

---

**Note:** All endpoints implement proper error handling, input validation, and follow RESTful conventions. The API is designed to be self-documenting and user-friendly while maintaining security best practices.

---

## AI Setup Guide

*Source: `docs/AI_SETUP.md`*

(Full AI setup information — Google AI / Gemini integration follows)

# Google AI Setup Guide for Farm Management App

## Overview
This guide walks you through setting up Google AI models (Gemini 2.0 Flash) for intelligent farm insights and recommendations.

## Prerequisites
- Google account
- Active farm management app project
- Basic knowledge of environment variables

## Step 1: Get Google AI Studio API Key

1. **Visit Google AI Studio**
   - Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**
   - Click **"Create API Key"**
   - Choose **"Create new API key"**
   - Copy the generated key (starts with `AIza...`)

3. **Note Your Quotas**
   - Free tier: 1,000,000 tokens/minute, 1,500 requests/day
   - Monitor usage in Google AI Studio dashboard

## Step 2: Configure Environment Variables

### For Local Development
1. Copy `.env.local` to `.env`:
   ```bash
   cp .env.local .env
   ```

2. Edit `.env` and replace:
   ```env
   GOOGLE_AI_API_KEY=AIza...your-actual-key-here
   GOOGLE_AI_MODEL=gemini-2.0-flash-exp
   ```

### For Production (Cloudflare Workers)
1. Go to your Cloudflare Workers dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `GOOGLE_AI_API_KEY`: Your API key
   - `GOOGLE_AI_MODEL`: `gemini-2.0-flash-exp`

## Step 3: Test the Integration

### Backend Testing
```bash
# Start your backend
npm run dev

# Test the AI endpoint
curl -X POST http://localhost:8787/api/ai/insights \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What are the best practices for tomato farming?"}'
```

### Frontend Testing
1. Navigate to any page with the AI Insights Panel
2. Ask a question like "What should I prioritize this week?"
3. Verify you get a helpful AI response

## Available AI Features

(See original `docs/AI_SETUP.md` for detailed endpoints, examples and security notes.)

---

## Artifact & Cleanup Policy

*Source: `docs/ARTIFACTS_CLEANUP_POLICY.md`*

(Policy summary and commands)

# Artifact & Cleanup Policy 🔧

**Purpose**
This document defines how temporary build, lint, and debug artifacts are handled in the repository to keep the repo clean, reproducible, and small.

(Refer to `docs/ARTIFACTS_CLEANUP_POLICY.md` for full details; archived originals are in `archive/docs-originals/`.)

---

## Backend Secrets & Environment Variables

*Source: `backend/SECRETS.md`*

# Backend Secrets & Environment Variables

This document describes secrets required by the backend and recommended GitHub Actions secret names.

## Required / Important

- `APP_URL` — The public URL for the frontend (used in reset links and verification emails).
- `JWT_SECRET` — Secret used to sign JWT tokens. **Must be kept secret** and rotated periodically.

## Optional but recommended

- `RESEND_API_KEY` — API key for Resend (email provider). If missing, the app will use a mock email implementation in dev/test.
- `FROM_EMAIL` — Sender email address to use for outgoing messages (e.g. `noreply@example.com`).
- `SENTRY_DSN` — Sentry DSN for error reporting and observability.

## Testing helpers

- `TEST_ENABLE_RESET_LINK_TO_RESPONSE` — Set to `1` in test/staging to enable the password reset endpoint to return the reset link when the request includes `?debug=1` or header `X-TEST-MODE: 1`. Do **not** enable in production.

---

## Comprehensive Audit Report (MAJOR)

*Source: `MAJOR.md`*

(Concise executive summary included below; refer to archived MAJOR.md for full report.)

# Comprehensive Audit Report for Farmers Boot Farm Management App

## App Overview
Farmers Boot is a comprehensive farm management application designed to help farmers manage their agricultural operations. The app provides features for crop management, livestock tracking, financial management, inventory control, task scheduling, and weather integration. It is built with a modern tech stack including React for the frontend, Node.js for the backend, and Cloudflare Workers with D1 database for scalable deployment.

## Key Strengths & Critical Issues
- Strengths: Modern stack, modular design, RBAC, audit logging.
- Critical issues: DB performance (missing indexes), inconsistent error handling, test coverage gaps, missing features for analytics and integrations.

(For full recommendations and prioritized roadmap see archived `MAJOR.md`.)

---

## API Alignment Audit

*Source: `API_AUDIT_REPORT.md`*

Summary: The audit found critical mismatches between frontend and backend endpoints (e.g., `/api/auth/validate` vs `/api/auth/me`, finance endpoint mismatch). Action items include fixing auth & finance endpoints, adding locations/fields APIs, and adding integration tests.

---

## Configuration Updates Summary

*Source: `configuration_update_report.md`*

Summary: ESLint plugins and other config updates applied (accessibility and security plugins). Verify by running `npm run lint` in `frontend`.

---

## Lint Analysis Summary

*Source: `lint_analysis_report.md`*

Summary: Enabling stricter lint rules increased issue visibility (~589 problems). Plan: fix duplicate strings, accessibility and security warnings first.

---

## Fix Report: Backup Noise Issue

*Source: `fix_report_14k_errors.md`*

Summary: A backup `node_modules._bak_*` folder caused 14k+ lint/type errors. Fix: added ignore patterns and removed backup from the working tree.

---

## Scalability Evaluation Summary

*Source: `scalability_evaluation_report.md`*

Summary: Recommends phased microservices decomposition, distributed caching (Cloudflare KV), CDN optimizations and a 6-9 month roadmap to enterprise scale.

---

## Plans & Roadmaps

*Source: `plans/user-repository-integration-plan.md`*

(Plan details archived; see original file for step-by-step actions.)

---

*If you prefer condensed summaries rather than full file inclusions, tell me and I will shorten the master doc accordingly.*