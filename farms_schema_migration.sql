-- Safe migration to fix farms table schema
-- Date: November 2, 2025

-- Step 1: Create new table with correct schema
CREATE TABLE farms_new (
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

-- Step 2: Copy data from old table (mapping user_id to owner_id)
INSERT INTO farms_new (id, name, location, area_hectares, metadata, owner_id, created_at, updated_at)
SELECT id, name, location, area_hectares, metadata, COALESCE(owner_id, user_id) as owner_id, created_at, updated_at
FROM farms;

-- Step 3: Replace old table with new table
DROP TABLE farms;
ALTER TABLE farms_new RENAME TO farms;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON farms(owner_id);