-- Farm Management System - Crops Module Schema Enhancements
-- Phase 1: Foundation & Core Features
-- Date: October 31, 2025

-- Enhanced crops table with comprehensive agricultural features
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    crop_type TEXT NOT NULL,
    crop_variety TEXT,
    planting_date DATE,
    harvest_date DATE,
    expected_yield REAL,
    actual_yield REAL,
    seeds_used INTEGER,
    fertilizer_type TEXT,
    irrigation_schedule TEXT,
    pest_control_schedule TEXT,
    soil_preparation TEXT,
    weather_requirements TEXT,
    growth_stage TEXT,
    status TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'planted', 'growing', 'harvested', 'failed'
    current_weight REAL,
    target_weight REAL,
    health_status TEXT,
    last_inspection_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL
);

-- Supporting tables for comprehensive crop management

-- Crop varieties and characteristics
CREATE TABLE IF NOT EXISTS crop_varieties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    maturity_days INTEGER,
    climate_requirements TEXT,
    soil_requirements TEXT,
    water_needs REAL,
    nutrient_requirements TEXT,
    yield_potential REAL,
    disease_resistance TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crop activities and operations tracking
CREATE TABLE IF NOT EXISTS crop_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    activity_date DATE NOT NULL,
    description TEXT,
    cost REAL,
    worker_id TEXT,
    weather_conditions TEXT,
    effectiveness_rating INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Crop observations and monitoring
CREATE TABLE IF NOT EXISTS crop_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    observation_date DATE NOT NULL,
    growth_stage TEXT,
    health_status TEXT,
    height_cm REAL,
    leaf_count INTEGER,
    pest_presence BOOLEAN,
    disease_signs TEXT,
    soil_moisture REAL,
    photos TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Yield tracking and analysis
CREATE TABLE IF NOT EXISTS crop_yield_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    harvest_date DATE NOT NULL,
    total_yield REAL,
    yield_per_hectare REAL,
    quality_grade TEXT,
    market_price REAL,
    revenue REAL,
    storage_location TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Pest and disease management
CREATE TABLE IF NOT EXISTS crop_pest_management (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    pest_disease_type TEXT NOT NULL,
    severity TEXT,
    detection_date DATE NOT NULL,
    treatment_applied TEXT,
    treatment_date DATE,
    effectiveness_rating INTEGER,
    follow_up_required BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Irrigation schedules integration
CREATE TABLE IF NOT EXISTS irrigation_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    crop_id INTEGER,
    irrigation_type TEXT NOT NULL,
    frequency_days INTEGER NOT NULL,
    duration_minutes REAL,
    water_amount_liters REAL,
    priority TEXT DEFAULT 'medium',
    next_watering_date DATE,
    status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT 1,
    optimized_at DATETIME,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Irrigation logs and monitoring
CREATE TABLE IF NOT EXISTS irrigation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    crop_id INTEGER,
    actual_water_used REAL,
    log_date DATE NOT NULL,
    action TEXT NOT NULL, -- 'scheduled', 'completed', 'skipped', 'modified'
    details TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES irrigation_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL
);

-- Performance indexes for efficiency
CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_field ON crops(field_id);
CREATE INDEX IF NOT EXISTS idx_crops_type ON crops(crop_type);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_planting ON crops(planting_date);
CREATE INDEX IF NOT EXISTS idx_crop_activities_crop ON crop_activities(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_observations_crop ON crop_observations(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_yield_crop ON crop_yield_records(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_pest_crop ON crop_pest_management(crop_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_farm ON irrigation_schedules(farm_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_crop ON irrigation_schedules(crop_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_schedule ON irrigation_schedules(next_watering_date);

-- Business rule validation (application level for D1)
-- - Planting date cannot be after harvest date
-- - Expected yield should be greater than 0
-- - Growth stage progression validation
-- - Health status consistency
-- - Water needs validation by crop type
-- - Maturity days validation by variety

-- Pre-populate with common crop varieties
INSERT OR IGNORE INTO crop_varieties (name, crop_type, maturity_days, yield_potential) VALUES
('Sweet Corn', 'corn', 85, 12.5),
('Field Corn', 'corn', 120, 9.8),
('Hard Red Winter Wheat', 'wheat', 220, 3.2),
('Hard Red Spring Wheat', 'wheat', 100, 3.8),
('Soybeans - Non-GMO', 'soybeans', 110, 3.5),
('Soybeans - Roundup Ready', 'soybeans', 105, 4.2),
('Roma Tomatoes', 'tomato', 80, 45.0),
('Beefsteak Tomatoes', 'tomato', 85, 35.0),
('Russet Potatoes', 'potato', 90, 25.0),
('Yukon Gold Potatoes', 'potato', 80, 22.0),
('Romaine Lettuce', 'lettuce', 60, 18.0),
('Iceberg Lettuce', 'lettuce', 75, 20.0),
('Cabbage - Green', 'cabbage', 85, 30.0),
('Cabbage - Red', 'cabbage', 90, 28.0);

-- Integration points with other modules
-- - Link with fields for field-specific crop management
-- - Link with finance for revenue tracking
-- - Link with tasks for farming operation scheduling
-- - Link with weather for climate impact analysis
-- - Link with inventory for seed and input tracking