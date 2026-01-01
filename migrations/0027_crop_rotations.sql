-- Migration 0027: Crop Rotations
-- Date: January 1, 2026
-- Supports crop rotation planning

CREATE TABLE IF NOT EXISTS crop_rotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id TEXT NOT NULL,
    field_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active', -- active, completed, archived
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_rotation_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rotation_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    crop_type TEXT NOT NULL,
    variety TEXT,
    season TEXT, -- Spring, Summer, Fall, Winter
    year_offset INTEGER DEFAULT 0, -- 0 = first year, 1 = second year, etc.
    notes TEXT,
    FOREIGN KEY (rotation_id) REFERENCES crop_rotations(id) ON DELETE CASCADE
);
