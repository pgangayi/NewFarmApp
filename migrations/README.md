# Cloudflare D1 Database Migration Guide
# Migration files for Cloudflare D1 database setup

## Setup

```bash
# For local development with Cloudflare D1
wrangler d1 start db
wrangler d1 execute db --local --file=./migrations/0001_d1_complete_schema.sql

# For production deployment
wrangler d1 execute db --file=./migrations/0001_d1_complete_schema.sql
```

## Migrations

Run migrations in order:
- `0001_d1_complete_schema.sql` - Core database schema
- `0002_core_inventory_finance.sql` - Inventory and finance modules
- `0003_operations_idempotency_and_rls.sql` - Operations and security
- `0004_fn_apply_treatment.sql` - Treatment functions
- `0005_audit_logs_and_operations.sql` - Audit system

## Environment Variables

Required:
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT signing secret

Optional:
- `SENTRY_DSN` - Error tracking
- `RATE_LIMIT_KV_ID` - Rate limiting namespace
