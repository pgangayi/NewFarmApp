-- Migration 0026: Lookup Tables for Breeds and Varieties
-- Date: January 1, 2026
-- Supports dynamic dropdowns for breeds and crop varieties

CREATE TABLE IF NOT EXISTS breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(species, name)
);

CREATE TABLE IF NOT EXISTS crop_varieties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    days_to_maturity INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crop_type, name)
);

-- Seed some initial data
INSERT OR IGNORE INTO breeds (species, name) VALUES 
('Cattle', 'Angus'), ('Cattle', 'Holstein'), ('Cattle', 'Hereford'),
('Chicken', 'Rhode Island Red'), ('Chicken', 'Leghorn'), ('Chicken', 'Broiler'),
('Pig', 'Duroc'), ('Pig', 'Yorkshire'), ('Pig', 'Berkshire'),
('Sheep', 'Merino'), ('Sheep', 'Dorper'),
('Goat', 'Boer'), ('Goat', 'Nubian');

INSERT OR IGNORE INTO crop_varieties (crop_type, name) VALUES
('Corn', 'Sweet Corn'), ('Corn', 'Field Corn'),
('Wheat', 'Hard Red Winter'), ('Wheat', 'Soft Red Winter'),
('Soybean', 'Generic'),
('Tomato', 'Roma'), ('Tomato', 'Cherry'), ('Tomato', 'Beefsteak');
