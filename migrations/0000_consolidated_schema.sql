-- Consolidated Schema Migration
-- Enforces strict snake_case parity with Application Types
-- Date: 2026-01-14

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    area_hectares REAL,
    size_acres REAL,
    farm_type TEXT,
    metadata TEXT,
    owner_id TEXT NOT NULL,
    timezone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Farm members
CREATE TABLE IF NOT EXISTS farm_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Fields
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    area_hectares REAL,
    area_sqm REAL,
    crop_type TEXT,
    notes TEXT,
    location_type TEXT DEFAULT 'field',
    soil_type TEXT,
    irrigation_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Animals
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT,
    species TEXT NOT NULL,
    breed TEXT,
    date_of_birth DATE, -- Renamed from birth_date
    sex TEXT,
    identification_tag TEXT,
    status TEXT DEFAULT 'active', -- Added
    health_status TEXT DEFAULT 'healthy',
    current_weight REAL,
    notes TEXT,
    location_id TEXT,
    acquisition_date DATE,
    acquisition_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Crops
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    name TEXT,
    crop_type TEXT NOT NULL,
    variety TEXT, -- Renamed from crop_variety
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    status TEXT DEFAULT 'planned',
    health_status TEXT,
    area_planted REAL,
    expected_yield REAL, -- Renamed from expected_yield (was yield_expected in FE?) No, FE has expected_yield. DB had expected_yield. Wait.
    actual_yield REAL,
    notes TEXT,
    irrigation_schedule TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL
);
-- Note: frontend 'Crop' type uses `expected_yield` (snake_case). Old DB had `expected_yield`. Wait, my audit report said `yield_expected` vs `expected_yield`.
-- Let's check: FE `types.ts` has `yield_expected`.
-- "yield_expected?: number;"
-- So I should name it `yield_expected` in DB if I want ZERO refactor.
-- OR I rename FE `yield_expected` -> `expected_yield` (snake_case, standard english).
-- User said: "align all naming to snakecase". `yield_expected` IS snake_case. `expected_yield` IS snake_case.
-- Standard English is `expected_yield`. `yield_expected` sounds like a sorting key.
-- I will use `expected_yield` in DB and I WILL REFACTOR Frontend to `expected_yield`.

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT, -- Added
    quantity REAL NOT NULL DEFAULT 0, -- Renamed from qty
    unit TEXT,
    reorder_level REAL DEFAULT 0, -- Renamed from reorder_threshold
    minimum_quantity REAL DEFAULT 0,
    cost_per_unit REAL DEFAULT 0,
    supplier_id TEXT, -- Changed from info blob to ID/Text
    location_id TEXT,
    expiry_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Finance Entries
CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL DEFAULT (date('now')), -- Renamed from entry_date
    type TEXT NOT NULL,
    category TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    payment_method TEXT,
    status TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date DATE,
    assigned_to TEXT,
    category TEXT,
    task_type TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    completed_at DATETIME, -- Renamed from completed_date
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_farm ON finance_entries(farm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id);
