-- Farm Management System - Farms Module Schema Enhancements
-- Phase 1: Foundation & Core Features
-- Date: October 31, 2025

-- Enhanced farms table with enterprise features
ALTER TABLE farms ADD COLUMN farm_type TEXT;
ALTER TABLE farms ADD COLUMN certification_status TEXT;
ALTER TABLE farms ADD COLUMN environmental_compliance TEXT;
ALTER TABLE farms ADD COLUMN total_acres REAL;
ALTER TABLE farms ADD COLUMN operational_start_date DATE;
ALTER TABLE farms ADD COLUMN management_structure TEXT;
ALTER TABLE farms ADD COLUMN seasonal_staff INTEGER;
ALTER TABLE farms ADD COLUMN annual_budget REAL;

-- Supporting tables for enterprise management

-- Farm statistics and KPI tracking
CREATE TABLE IF NOT EXISTS farm_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    report_date DATE NOT NULL,
    total_animals INTEGER,
    total_acres_under_cultivation REAL,
    annual_revenue REAL,
    total_operational_cost REAL,
    profit_margin REAL,
    employee_count INTEGER,
    productivity_score REAL,
    sustainability_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Farm operations tracking
CREATE TABLE IF NOT EXISTS farm_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL,
    operation_date DATE NOT NULL,
    description TEXT,
    cost REAL,
    revenue REAL,
    staff_involved TEXT,
    success_rating INTEGER,
    environmental_impact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Performance indexes for efficiency
CREATE INDEX IF NOT EXISTS idx_farm_statistics_farm ON farm_statistics(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_statistics_date ON farm_statistics(report_date);
CREATE INDEX IF NOT EXISTS idx_farm_operations_farm ON farm_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_operations_type ON farm_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_farm_operations_date ON farm_operations(operation_date);

-- Aggregate views for analytics (using materialized queries via APIs)
-- Note: D1 has limited view support, so complex queries will be handled in APIs

-- Performance tracking triggers (simplified for D1)
-- In production, these would be more sophisticated

-- Business rule validation (application level for D1)
-- - Annual budget validation
-- - Operational date consistency
-- - Staff count validation
-- - Sustainability score ranges (0-100)
-- - Productivity score ranges (0-100)