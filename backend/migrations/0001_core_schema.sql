-- Core Schema Migration
-- Basic tables required for the application to function
-- Date: November 18, 2025

-- Users table (authentication and user management)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Farms table (core business entity)
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

-- Farm members table (user permissions and access control)
CREATE TABLE IF NOT EXISTS farm_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(farm_id, user_id)
);

-- Fields table (farm field management)
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    area_hectares REAL,
    area_sqm REAL,
    crop_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Operations table (idempotency for API requests)
CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idempotency_key TEXT NOT NULL UNIQUE,
    user_id TEXT,
    request_body TEXT,
    response_body TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_operations_idempotency ON operations(idempotency_key);