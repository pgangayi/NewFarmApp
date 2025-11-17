# Database Schema vs Application Queries Analysis Report

## Executive Summary

Analysis of the database schema (migrations) against the application queries reveals several critical mismatches that could cause runtime errors, data corruption, or functionality failures.

## Critical Issues Found

### 1. ID Column Type Mismatches

**Schema (D1/SQLite):**

- Most tables use `INTEGER PRIMARY KEY AUTOINCREMENT` for main entities
- `users` table uses `TEXT PRIMARY KEY` for IDs

**Application Code Issues:**

```javascript
// farms.js - Line 358, 441, 1263
const farm = await farmRepo.findWithStats(farmId, { userId: user.id });
const farms = await farmRepo.findByOwner(user.id, {...});
```

**Problem:** The code treats all IDs as strings/numbers interchangeably, but D1 expects specific types.

### 2. Missing Tables Referenced in Application

**Tables in Code but NOT in Schema:**

- `inventory_alerts` (referenced in inventory-enhanced.js lines 74, 305)
- `inventory_cost_history` (referenced in inventory-enhanced.js lines 89, 283)
- `inventory_suppliers` (referenced in inventory-enhanced.js lines 700, 784)
- `purchase_orders` and `purchase_order_items` (referenced in inventory-enhanced.js lines 501)
- `farm_statistics` (referenced in farms.js lines 366, 483, 1262)
- `farm_operations` (referenced in farms.js lines 381, 1262)
- `crop_plans` (referenced in crops.js line 468)
- `crop_activities` (referenced in crops.js line 111)
- `crop_observations` (referenced in crops.js line 119)
- `animals`, `fields`, `tasks` (referenced but may have wrong structure)

### 3. Column Name Inconsistencies

**Schema vs Application:**

- Application expects `farm_name` but schema doesn't have this column in `farms` table
- Application uses `area_sqm` in fields table query (line 422) but schema shows `area_hectares`
- Application references `user.farm_id` (line 426) but schema has `owner_id` in farms table

### 4. Metadata Field Structure

**Schema:** Uses `TEXT` for JSON storage (SQLite limitation)
**Application:** Expects structured JSON objects

```javascript
// farms.js - Lines 120-127
validated.area_hectares = this.validateNumeric(
  data.area_hectares,
  "area_hectares",
  0,
  100000
);
```

### 5. Missing Foreign Key Relationships

**Schema Missing:**

- No foreign key constraints defined in the D1 schema
- No RLS (Row Level Security) implementation for D1
- Missing junction tables for many-to-many relationships

### 6. Timestamp Format Inconsistencies

**Schema:** Uses `DATETIME DEFAULT CURRENT_TIMESTAMP`
**Application:** Mixes ISO strings and date strings

```javascript
// crops.js - Line 400
expected_yield_unit: parseFloat(expected_yield_unit),
// vs
planting_date: new Date().toISOString().split("T")[0]
```

## Immediate Action Items

### High Priority (Critical Errors)

1. **Create Missing Tables**

   - `inventory_alerts` - Alert system for low stock
   - `inventory_cost_history` - Track price changes over time
   - `inventory_suppliers` - Supplier management
   - `farm_statistics` - Analytics data
   - `farm_operations` - Operational tracking
   - `crop_plans`, `crop_activities`, `crop_observations` - Crop management

2. **Fix ID Handling**

   - Standardize ID types across all tables
   - Ensure consistent string/number handling in application code

3. **Column Alignment**
   - Add missing columns or fix application queries
   - Resolve field area measurement units (hectares vs sqm)

### Medium Priority (Functionality Gaps)

4. **Enhance Schema**

   - Add proper foreign key constraints
   - Implement soft delete patterns
   - Add audit trail columns

5. **Data Type Consistency**
   - Standardize timestamp handling
   - Fix JSON field expectations

### Low Priority (Optimizations)

6. **Performance**
   - Add missing indexes
   - Optimize common query patterns

## Recommended Schema Updates

### New Tables to Add:

```sql
-- Inventory Alert System
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL, -- 'low_stock', 'expired', 'overstock'
    alert_date DATE NOT NULL,
    current_quantity REAL NOT NULL,
    threshold_quantity REAL NOT NULL,
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    resolved INTEGER DEFAULT 0,
    resolved_date DATE,
    resolved_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Cost History Tracking
CREATE TABLE IF NOT EXISTS inventory_cost_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    cost_date DATE NOT NULL,
    unit_cost REAL NOT NULL,
    quantity_purchased REAL NOT NULL,
    total_cost REAL NOT NULL,
    cost_reason TEXT NOT NULL, -- 'purchase', 'price_update', 'adjustment'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Farm Statistics
CREATE TABLE IF NOT EXISTS farm_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    report_date DATE NOT NULL,
    total_animals INTEGER DEFAULT 0,
    total_acres_under_cultivation REAL DEFAULT 0,
    annual_revenue REAL DEFAULT 0,
    total_operational_cost REAL DEFAULT 0,
    profit_margin REAL DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    productivity_score REAL DEFAULT 0,
    sustainability_score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Crop Planning System
CREATE TABLE IF NOT EXISTS crop_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER NOT NULL,
    plan_name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    planting_date DATE NOT NULL,
    expected_yield_per_sqm REAL NOT NULL,
    expected_price_per_unit REAL NOT NULL,
    projected_revenue REAL NOT NULL,
    projected_cost REAL NOT NULL,
    projected_profit REAL NOT NULL,
    status TEXT DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
);

-- Crop Activities
CREATE TABLE IF NOT EXISTS crop_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL, -- 'planting', 'fertilizing', 'watering', 'pest_control', 'harvesting'
    activity_date DATE NOT NULL,
    description TEXT,
    cost_per_unit REAL DEFAULT 0,
    units_used_per_sqm REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    performed_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Crop Observations
CREATE TABLE IF NOT EXISTS crop_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    observation_date DATE NOT NULL,
    health_status TEXT, -- 'excellent', 'good', 'fair', 'poor', 'critical'
    growth_stage TEXT,
    height_cm REAL,
    pest_presence INTEGER DEFAULT 0, -- boolean
    disease_signs TEXT,
    soil_moisture_level TEXT,
    weather_conditions TEXT,
    notes TEXT,
    observer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    FOREIGN KEY (observer_id) REFERENCES users(id)
);
```

## Code Changes Required

### 1. Fix ID Type Handling

```javascript
// Before (problematic)
const farm = await farmRepo.findWithStats(farmId, { userId: user.id });

// After (type-safe)
const farm = await farmRepo.findWithStats(String(farmId), {
  userId: String(user.id),
});
```

### 2. Add Missing Column Handling

```javascript
// Add to farms query
const { results } = await env.DB.prepare(
  `
    SELECT 
        f.*,
        f.name as farm_name, -- Add this alias
        COALESCE(...) as animal_count
    FROM farms f
    WHERE f.owner_id = ?
`
)
  .bind(ownerId)
  .all();
```

### 3. Timestamp Consistency

```javascript
// Standardize timestamp format
const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
```

## Testing Recommendations

1. **Schema Validation Test**

   - Create test that checks all referenced tables/columns exist
   - Verify foreign key relationships

2. **Data Type Test**

   - Test ID handling with different formats
   - Verify timestamp consistency

3. **Query Performance Test**
   - Test queries with missing indexes
   - Verify join performance

## Migration Strategy

1. **Phase 1:** Create missing tables
2. **Phase 2:** Update existing tables with missing columns
3. **Phase 3:** Fix application code to match schema
4. **Phase 4:** Add indexes and constraints
5. **Phase 5:** Performance testing and optimization

## Risk Assessment

- **High Risk:** Missing tables will cause immediate runtime errors
- **Medium Risk:** Column mismatches may cause data corruption
- **Low Risk:** Performance issues from missing indexes

## Conclusion

The current schema is incomplete for the application's requirements. Immediate action is needed to create missing tables and align column structures to prevent runtime failures and data integrity issues.
