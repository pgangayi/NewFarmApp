-- Farm Management System - Fields Module Schema Enhancements
-- Phase 1: Foundation & Core Features
-- Date: October 31, 2025

-- Enhanced fields table with advanced agricultural features
ALTER TABLE fields ADD COLUMN soil_type TEXT;
ALTER TABLE fields ADD COLUMN field_capacity REAL;
ALTER TABLE fields ADD COLUMN current_cover_crop TEXT;
ALTER TABLE fields ADD COLUMN irrigation_system TEXT;
ALTER TABLE fields ADD COLUMN drainage_quality TEXT;
ALTER TABLE fields ADD COLUMN accessibility_score INTEGER;
ALTER TABLE fields ADD COLUMN environmental_factors TEXT;
ALTER TABLE fields ADD COLUMN maintenance_schedule TEXT;

-- Supporting tables for comprehensive field management

-- Soil analysis and monitoring
CREATE TABLE IF NOT EXISTS soil_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL,
    analysis_date DATE NOT NULL,
    ph_level REAL,
    nitrogen_content REAL,
    phosphorus_content REAL,
    potassium_content REAL,
    organic_matter REAL,
    soil_moisture REAL,
    temperature REAL,
    salinity REAL,
    recommendations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
);

-- Field equipment and infrastructure
CREATE TABLE IF NOT EXISTS field_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL,
    equipment_type TEXT NOT NULL,
    equipment_name TEXT,
    maintenance_schedule TEXT,
    last_maintenance DATE,
    next_maintenance DATE,
    performance_rating INTEGER,
    cost_per_use REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
);

-- Field productivity and usage tracking
CREATE TABLE IF NOT EXISTS field_usage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL,
    usage_period_start DATE NOT NULL,
    usage_period_end DATE NOT NULL,
    crop_planted TEXT,
    yield_achieved REAL,
    yield_per_hectare REAL,
    input_costs REAL,
    revenue_generated REAL,
    profitability_score REAL,
    environmental_impact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
);

-- Performance indexes for efficiency
CREATE INDEX IF NOT EXISTS idx_soil_analysis_field ON soil_analysis(field_id);
CREATE INDEX IF NOT EXISTS idx_soil_analysis_date ON soil_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_field_equipment_field ON field_equipment(field_id);
CREATE INDEX IF NOT EXISTS idx_field_equipment_type ON field_equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_field_usage_field ON field_usage_history(field_id);
CREATE INDEX IF NOT EXISTS idx_field_usage_period ON field_usage_history(usage_period_start);

-- Business rule validation (application level for D1)
-- - pH level validation (0-14 range)
-- - Accessibility score validation (1-10 range)
-- - Performance rating validation (1-10 range)
-- - Soil moisture validation (0-100% range)
-- - Temperature validation (reasonable agricultural ranges)
-- - Field capacity validation (hectares per unit)

-- Aggregate views for analytics (using materialized queries via APIs)
-- Note: D1 has limited view support, so complex queries will be handled in APIs

-- Integration points with other modules
-- - Link with crops for planting history
-- - Link with finance for cost/revenue tracking
-- - Link with tasks for maintenance scheduling
-- - Link with weather for climate impact analysis