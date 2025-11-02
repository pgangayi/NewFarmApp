# Comprehensive Codebase to Schema Audit Report
**Date:** November 2025  
**Status:** ⚠️ CRITICAL SCHEMA MISMATCHES FOUND  
**Priority:** IMMEDIATE FIX REQUIRED

---

## Executive Summary

**Schema Status:** ❌ **OUT OF SYNC**
- **Database State:** Partially initialized - some tables exist, but columns are missing
- **Code Expectations:** All code expects the complete schema from `0001_d1_complete_schema.sql`
- **Current Blockers:** `farms.owner_id` column missing - causing 500 errors on GET /api/farms
- **Additional Issues:** Multiple tables likely missing columns

### Critical Finding
The D1 database has the **farms table**, but is **missing the `owner_id` column**. This is a blocker for the authentication flow because `/api/farms` queries expect this column but it doesn't exist.

---

## Schema Definition (Expected vs Actual)

### Table: `farms`

| Column | Expected Type | Expected in Schema | Actual Status | Notes |
|--------|---|---|---|---|
| id | INTEGER PRIMARY KEY | ✓ Yes | ✓ EXISTS | |
| name | TEXT NOT NULL | ✓ Yes | ✓ EXISTS | |
| location | TEXT | ✓ Yes | ✓ EXISTS | |
| area_hectares | REAL | ✓ Yes | ✓ EXISTS | |
| metadata | TEXT (JSON) | ✓ Yes | ? Unknown | Not actively used in code |
| **owner_id** | **TEXT NOT NULL** | **✓ Yes** | **❌ MISSING** | **CRITICAL - Causes 500 errors** |
| created_at | DATETIME | ✓ Yes | ✓ EXISTS | |
| updated_at | DATETIME | ✓ Yes | ✓ EXISTS | |

**Foreign Keys:** `owner_id` → `users.id`

**Current Error:** D1 database has table but lacks `owner_id` column

---

## Complete Expected Schema Reference

### 1. **users** - Authentication & User Management
```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
**API Usage:**
- `functions/api/auth/login.js` - queries by email
- `functions/api/auth/signup.js` - queries by email, inserts new user
- `functions/api/_auth.js` - validates tokens against this table

**Expected Queries:**
- `SELECT * FROM users WHERE email = ?` (login)
- `INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (...)`

---

### 2. **farms** - Core Farm Entity
```sql
CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    area_hectares REAL,
    metadata TEXT,
    owner_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
```
**API Usage:**
- `functions/api/farms.js` - **CURRENTLY FAILING**
- `functions/api/farms-enhanced.js` - additional operations
- All related modules depend on this

**Expected Queries:**
- `SELECT * FROM farms WHERE owner_id = ?` (currently failing)
- `INSERT INTO farms (name, location, area_hectares, owner_id) VALUES (...)`
- `UPDATE farms SET ... WHERE id = ? AND owner_id = ?`

**Current Error:**
```
D1_ERROR: no such column: owner_id at offset 191: SQLITE_ERROR
```

---

### 3. **farm_members** - User Permissions & Multi-Tenant Access
```sql
CREATE TABLE IF NOT EXISTS farm_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```
**API Usage:**
- `functions/api/_auth.js` - `hasFarmAccess()`, `grantFarmAccess()`
- `functions/api/fields.js` - joins with farm_members for access control
- `functions/api/tasks.js` - joins with farm_members for access control
- `functions/api/animals.js` - joins with farm_members for access control

**Expected Queries:**
- `SELECT * FROM farm_members WHERE farm_id = ? AND user_id = ? AND role IN (...)` (permission checks)
- `INSERT INTO farm_members (farm_id, user_id, role) VALUES (...)`

---

### 4. **fields** - Field/Land Subdivision Management
```sql
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    area_hectares REAL,
    crop_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);
```
**API Usage:**
- `functions/api/fields.js` - main CRUD
- `functions/api/fields-enhanced.js` - additional operations

**Expected Queries:**
- `SELECT f.* FROM fields f JOIN farm_members fm ON ... WHERE fm.user_id = ?`
- `INSERT INTO fields (farm_id, name, area_hectares, crop_type, notes) VALUES (...)`

---

### 5. **inventory_items** - Inventory Management
```sql
CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    qty REAL NOT NULL DEFAULT 0,
    unit TEXT,
    reorder_threshold REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);
```
**API Usage:**
- `functions/api/inventory-enhanced.js` - comprehensive inventory management

---

### 6. **inventory_transactions** - Single Source of Truth for Inventory Changes
```sql
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    farm_id INTEGER NOT NULL,
    qty_delta REAL NOT NULL,
    unit TEXT,
    reason_type TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```
**API Usage:**
- `functions/api/inventory-enhanced.js` - transaction logging

---

### 7. **finance_entries** - Financial Tracking
```sql
CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    entry_date DATE NOT NULL DEFAULT (date('now')),
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    account TEXT,
    description TEXT,
    reference_type TEXT,
    reference_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```
**API Usage:**
- `functions/api/finance-enhanced.js` - financial operations

---

### 8. **treatments** - Treatment Application Log
```sql
CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    notes TEXT,
    applied_at DATETIME NOT NULL,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```
**API Usage:**
- `functions/api/operations/apply-treatment.js` - treatment application

---

### 9. **operations** - Idempotency & Operation Tracking
```sql
CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idempotency_key TEXT NOT NULL UNIQUE,
    user_id TEXT,
    request_body TEXT,
    response_body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```
**API Usage:**
- `functions/api/_rate-limit.js` - idempotency handling

---

### 10. **animals** - Livestock Management
```sql
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    birth_date DATE,
    sex TEXT,
    identification_tag TEXT,
    health_status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);
```
**API Usage:**
- `functions/api/animals.js` - main animal management
- `functions/api/animals-enhanced.js` - enhanced operations (health records, breeding, feeding, etc.)

---

### 11. **tasks** - Task Management
```sql
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date DATE,
    assigned_to TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```
**API Usage:**
- `functions/api/tasks.js` - main task management
- `functions/api/tasks-enhanced.js` - additional operations

---

### 12. **weather_locations** - Weather Tracking
```sql
CREATE TABLE IF NOT EXISTS weather_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    location_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);
```
**API Usage:**
- `functions/api/weather-location.js` - weather management

---

## API Endpoints & Their Database Requirements

### Critical Endpoints (CURRENTLY FAILING)

#### GET /api/farms (🔴 BLOCKING)
**Status:** 500 Error
**Root Cause:** `farms.owner_id` column missing
```javascript
// From functions/api/farms.js line 27-36
SELECT 
  id, name, location, area_hectares, 
  created_at, updated_at
FROM farms 
WHERE owner_id = ?  // ❌ Column doesn't exist!
```

**Error Message:**
```
D1_ERROR: no such column: owner_id at offset 191: SQLITE_ERROR
```

**Fix Required:** Run migration to add `owner_id` column

---

### Other Endpoints That Will Fail

#### GET /api/fields
**Expected Query:**
```sql
SELECT f.id, f.name, f.area_hectares, f.crop_type, f.notes, ...
FROM fields f
JOIN farm_members fm ON f.farm_id = fm.farm_id
WHERE fm.user_id = ?
```
**Issue:** `farm_members` table likely missing

---

#### GET /api/tasks
**Expected Query:**
```sql
SELECT t.*, fa.name as farm_name, assignee.name as assigned_to_name
FROM tasks t
JOIN farm_members fm ON t.farm_id = fm.farm_id
WHERE fm.user_id = ?
```
**Issue:** `farm_members` table likely missing

---

#### GET /api/animals
**Expected Query:**
```sql
SELECT a.* FROM animals a
JOIN farm_members fm ON a.farm_id = fm.farm_id
WHERE fm.user_id = ?
```
**Issue:** `farm_members` table likely missing

---

## Migration Fix Required

### Immediate Action: Add Missing `owner_id` Column to `farms`

**Current File:** `functions/api/migrate.js`

**File Content (CURRENT):**
```javascript
const sql = `
  PRAGMA table_info(farms);
  ALTER TABLE farms ADD COLUMN owner_id TEXT NOT NULL DEFAULT '';
  UPDATE farms SET owner_id = '...'; -- Need user ID
`;
```

**Problem:** The current migrate.js doesn't properly handle adding the column because:
1. Missing `FOREIGN KEY` constraint
2. No way to assign existing rows to a user
3. D1 doesn't support `DEFAULT` with `NOT NULL` in ALTER

**Solution:** Need proper migration that:
1. Adds the column
2. Adds foreign key constraint
3. Handles existing records

---

## Recommended Fix Order

### Phase 1: Immediate (BLOCKER)
1. ✅ Visit `/api/migrate` endpoint to add `owner_id` column to `farms`
2. ✅ Verify column exists with `/api/debug-db`
3. ✅ Test GET /api/farms - should return empty array or error mentioning no farms, not column error

### Phase 2: Secondary Tables (NEXT)
1. Create `farm_members` table (used by fields, tasks, animals for access control)
2. Create `inventory_items` and `inventory_transactions`
3. Create `finance_entries`
4. Create `operations` (for idempotency)
5. Create all remaining tables

### Phase 3: Testing & Validation
1. Grant test user farm access via farm_members
2. Test all CRUD endpoints
3. Run full integration tests

---

## Summary Table: What Exists vs What Code Expects

| Table | Exists in DB | Expected | Status | When Needed |
|-------|---|---|---|---|
| users | ✓ | ✓ | ✓ READY | Already working (login/signup) |
| farms | ✓ partial | ✓ | ⚠️ COLUMN MISSING | **NOW** - /api/farms fails |
| farm_members | ❓ | ✓ | ❌ UNKNOWN | Soon - /api/fields, /api/tasks, /api/animals |
| fields | ❓ | ✓ | ❌ UNKNOWN | Soon |
| inventory_items | ❓ | ✓ | ❌ UNKNOWN | Later |
| inventory_transactions | ❓ | ✓ | ❌ UNKNOWN | Later |
| finance_entries | ❓ | ✓ | ❌ UNKNOWN | Later |
| treatments | ❓ | ✓ | ❌ UNKNOWN | Later |
| operations | ❓ | ✓ | ❌ UNKNOWN | Later |
| animals | ❓ | ✓ | ❌ UNKNOWN | Soon |
| tasks | ❓ | ✓ | ❌ UNKNOWN | Soon |
| weather_locations | ❓ | ✓ | ❌ UNKNOWN | Later |

---

## Next Steps

### Immediate Action Required

**1. Run Migration Endpoint**
```
Visit: https://[current-deployment].farmers-boot.pages.dev/api/migrate
```

This will execute the migration to add the missing `owner_id` column to farms.

**2. Verify Schema**
```
Visit: https://[current-deployment].farmers-boot.pages.dev/api/debug-db
```

Check the response to see:
- farms table columns (should now have `owner_id`)
- All table names present
- Row counts

**3. Test Farms Endpoint**
After migration, try logging in and accessing:
```
GET /api/farms
Authorization: Bearer [token]
```

Should return: `{"success":true,"data":[]}`  
(Empty array = success, farms table queryable)

---

## Full Schema Initialization Plan

If Phase 1 migration works, Phase 2 requires full initialization. Create a comprehensive migration endpoint that will:

1. Add missing columns to farms
2. Create all missing tables
3. Verify all indexes
4. Return complete schema status

See `SCHEMA_INITIALIZATION_MIGRATION.sql` (next document) for complete migration script.
