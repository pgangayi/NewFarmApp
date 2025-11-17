-- Simple Tables Migration (Part 3)
-- Date: November 15, 2025
-- Adding basic tables without complex foreign key dependencies

-- Animals table (for livestock management)
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    birth_date DATE,
    sex TEXT,
    identification_tag TEXT,
    health_status TEXT DEFAULT 'healthy',
    weight REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table (for task management)
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date DATE,
    completed_date DATE,
    assigned_to TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weather location table (for weather data)
CREATE TABLE IF NOT EXISTS weather_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    location_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Farm operations (for operational tracking)
CREATE TABLE IF NOT EXISTS farm_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    operation_date DATE NOT NULL,
    description TEXT,
    cost REAL DEFAULT 0,
    duration_hours REAL,
    equipment_used TEXT,
    performed_by TEXT,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    status TEXT DEFAULT 'planned',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_weather_locations_farm ON weather_locations(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_statistics_farm ON farm_statistics(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_operations_farm ON farm_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_farm ON crop_plans(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_field ON crop_plans(field_id);