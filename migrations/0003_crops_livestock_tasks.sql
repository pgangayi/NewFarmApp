-- Crops, Livestock, and Tasks Migration
-- Date: November 15, 2025
-- Adding agricultural and operational functionality

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
    health_status TEXT DEFAULT 'healthy',
    weight REAL,
    notes TEXT,
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
    completed_date DATE,
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

-- MISSING TABLES FROM SCHEMA ANALYSIS

-- Farm statistics (for analytics)
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

-- Farm operations (for operational tracking)
CREATE TABLE IF NOT EXISTS farm_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL, -- 'planting', 'harvesting', 'irrigation', 'fertilizing'
    target_type TEXT, -- 'field', 'crop', 'area'
    target_id TEXT,
    operation_date DATE NOT NULL,
    description TEXT,
    cost REAL DEFAULT 0,
    duration_hours REAL,
    equipment_used TEXT,
    performed_by TEXT,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Crop planning system
CREATE TABLE IF NOT EXISTS crop_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER NOT NULL,
    plan_name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
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

-- Crop activities
CREATE TABLE IF NOT EXISTS crop_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_plan_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL, -- 'planting', 'fertilizing', 'watering', 'pest_control', 'harvesting'
    activity_date DATE NOT NULL,
    description TEXT,
    cost_per_unit REAL DEFAULT 0,
    units_used_per_sqm REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    performed_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_plan_id) REFERENCES crop_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Crop observations
CREATE TABLE IF NOT EXISTS crop_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_plan_id INTEGER NOT NULL,
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
    FOREIGN KEY (crop_plan_id) REFERENCES crop_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (observer_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_weather_locations_farm ON weather_locations(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_statistics_farm ON farm_statistics(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_operations_farm ON farm_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_farm ON crop_plans(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_field ON crop_plans(field_id);
CREATE INDEX IF NOT EXISTS idx_crop_activities_plan ON crop_activities(crop_plan_id);
CREATE INDEX IF NOT EXISTS idx_crop_observations_plan ON crop_observations(crop_plan_id);