-- Complete Cloudflare D1 Database Schema Migration
-- Migrating from Supabase PostgreSQL to Cloudflare D1 SQLite
-- Date: October 31, 2025

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Using TEXT instead of UUID for D1
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Farms table (core entity)
CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    area_hectares REAL,
    metadata TEXT, -- JSON string instead of JSONB
    owner_id TEXT NOT NULL, -- References users.id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Farm members table (for user permissions)
CREATE TABLE IF NOT EXISTS farm_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'owner', 'manager', 'worker', 'accounting', 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Fields table (for field management)
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

-- Inventory items table
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

-- Inventory transactions table (single source of truth)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    farm_id INTEGER NOT NULL,
    qty_delta REAL NOT NULL, -- Positive for additions, negative for usage
    unit TEXT,
    reason_type TEXT NOT NULL, -- 'treatment', 'purchase', 'usage', 'adjustment'
    reference_type TEXT,
    reference_id TEXT, -- Could reference treatments.id or other entities
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Finance entries table
CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    entry_date DATE NOT NULL DEFAULT (date('now')),
    type TEXT NOT NULL, -- 'income', 'expense', 'investment'
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

-- Treatments table (for treatment application)
CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    target_type TEXT NOT NULL, -- 'crop', 'field', 'animal'
    target_id TEXT NOT NULL, -- Reference to specific entity
    notes TEXT,
    applied_at DATETIME NOT NULL,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Operations table for idempotency (migrated from Supabase)
CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idempotency_key TEXT NOT NULL UNIQUE,
    user_id TEXT,
    request_body TEXT, -- JSON string instead of JSONB
    response_body TEXT, -- JSON string instead of JSONB
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Animals table (for livestock management)
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL, -- 'cow', 'chicken', 'pig', etc.
    breed TEXT,
    birth_date DATE,
    sex TEXT, -- 'male', 'female'
    identification_tag TEXT,
    health_status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Tasks table (for task management)
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    due_date DATE,
    assigned_to TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Weather location table (for weather data)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_farm ON inventory_transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_farm ON finance_entries(farm_id);
CREATE INDEX IF NOT EXISTS idx_treatments_farm ON treatments(farm_id);
CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_weather_locations_farm ON weather_locations(farm_id);
CREATE INDEX IF NOT EXISTS idx_operations_idempotency ON operations(idempotency_key);

-- Create views for common queries (if needed)
-- Note: D1 has limited view support, so complex queries should be handled in APIs

-- Utility functions for D1 (if needed)
-- Note: D1 has limited function support compared to PostgreSQL