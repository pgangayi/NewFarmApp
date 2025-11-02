# Farmers Boot - Farm Management Platform

## Overview

Farmers Boot is a progressive web application (PWA) designed for small-to-medium farmers to manage farms, fields, livestock, tasks, inventory, and users. Built with React + TypeScript (Vite frontend), Cloudflare D1 (backend/database), R2 (storage), and Cloudflare Pages + Functions for deployment.

## Features

- **Farm Management**: Create and manage multiple farms with user roles (owner, manager, worker).
- **Fields & Livestock**: Track fields, animals, health records, and treatments.
- **Inventory & Finance**: Manage inventory items, transactions, and basic finance entries.
- **Tasks**: Assign and track tasks across fields and animals.
- **Offline Support**: PWA with service worker for offline viewing and queued operations.
- **API**: Serverless endpoints for CRUD operations, with transactional treatment application.

## Architecture

- **Frontend**: React + TypeScript, Vite build, PWA with service worker.
- **Backend**: Cloudflare Pages Functions (Workers) with custom JWT authentication.
- **Database**: Cloudflare D1 (SQLite) with custom REST API wrapper.
- **Storage**: Cloudflare R2 for file uploads and management.
- **Deployment**: Cloudflare Pages (frontend) + Pages Functions (API).

## Getting Started

### Prerequisites

- Node.js 18+
- Cloudflare account (for deployment)
- Wrangler CLI (installed via npm)

### Local Development

Run the automated setup script:

```powershell
# Windows
npm run setup:local:windows

# Unix/Linux/macOS
npm run setup:local:unix
```

Then:

1. Edit `.env` with your `JWT_SECRET` and `DATABASE_URL` (optional for local D1).
2. Start development:
   ```powershell
   npm run dev
   ```
3. Visit: http://localhost:8788

**Setup includes:**
- Environment variable initialization from `.env.example`
- Dependency installation for frontend and functions
- Validation of required tools (Wrangler)

**Useful Development Commands:**
- `npm run dev` — Start frontend + functions locally  
- `npm run build` — Build for production
- `wrangler pages dev` — Test Pages Functions directly
- `wrangler d1 execute <database_id> --remote "SELECT 1"` — Test D1 connection

### Deployment

#### Production Deployment (Cloudflare Pages)

1. **Connect GitHub repo to Cloudflare Pages:**
   - Go to Cloudflare Dashboard → Pages
   - Select "Connect to Git"
   - Select your repository

2. **Set build configuration:**
   - Build command: `npm run build`
   - Build output directory: `frontend/dist`

3. **Set environment variables in Cloudflare Pages dashboard:**
   - `JWT_SECRET` — Secret key for signing/verifying JWT tokens (required)
   - `VITE_MAPBOX_TOKEN` — Mapbox access token for maps (optional)
   - `SENTRY_DSN` — Sentry error tracking URL (optional)

4. **Deploy:**
   - Push to GitHub branch
   - Cloudflare automatically builds and deploys
   - Functions deployed with code from `functions/` folder

#### Local Deployment Testing

```powershell
# Build production bundle
npm run build

# Test with Wrangler locally before deploying
wrangler pages dev frontend/dist
```

#### Deployment Scripts

- `npm run deploy` — Deploy to Cloudflare Pages (Unix/macOS)
- `npm run deploy:windows` — Deploy to Cloudflare Pages (Windows PowerShell)

### API Usage

All API endpoints use JWT bearer token authentication. The token is automatically obtained via the `/api/auth/login` endpoint and stored in localStorage.

#### Authentication

```powershell
# Login to get JWT token
curl -X POST https://your-site.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Response includes: { token: "jwt-token-here" }
# Use token in subsequent requests as: Authorization: Bearer <token>
```

#### Example Endpoints

```powershell
# Get all farms for current user
curl -X GET https://your-site.pages.dev/api/farms \
  -H "Authorization: Bearer <user-jwt>"

# Get fields for a farm
curl -X GET https://your-site.pages.dev/api/fields?farmId=farm-123 \
  -H "Authorization: Bearer <user-jwt>"

# Apply treatment to animal (with idempotency key)
curl -X POST https://your-site.pages.dev/api/operations/apply-treatment \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Idempotency-Key: <uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "farmId": "farm-123",
    "animalId": "animal-456",
    "appliedAt": "2025-01-15T12:00:00Z",
    "items": [{"inventoryItemId": "item-789", "qty": 2, "unit": "bottle"}]
  }'
```

#### Database Access (D1)

D1 connections are handled through Cloudflare Pages Functions. To interact with D1 directly during development:

```powershell
# List D1 databases
wrangler d1 list

# Query remote D1 database
wrangler d1 execute farming-db --remote "SELECT COUNT(*) FROM farms;"

# Create local D1 database
wrangler d1 create farming-db-local

# Query local D1
wrangler d1 execute farming-db-local --file ./migrations/0001_d1_complete_schema.sql
```

## Project Structure

- `frontend/` — React app
- `functions/api/` — Cloudflare Pages Functions
- `supabase/migrations/` — DB migrations
- `migrations/` — Original migration files
- `.github/workflows/ci.yml` — CI pipeline

## Contributing

- Run tests before committing.
- Use the PR template for changes.
- Follow the phase plan in `build.md`.

## License

MIT