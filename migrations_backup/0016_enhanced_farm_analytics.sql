-- Missing farm statistics and operations tables for enhanced analytics
-- Add these tables to support the farms API functionality

-- Farm statistics table for performance tracking
CREATE TABLE IF NOT EXISTS farm_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
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

-- Farm operations table for activity tracking
CREATE TABLE IF NOT EXISTS farm_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL, -- 'planting', 'harvesting', 'maintenance', 'treatment', etc.
    operation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    cost REAL DEFAULT 0,
    revenue REAL DEFAULT 0,
    staff_involved TEXT,
    success_rating INTEGER DEFAULT 0, -- 1-5 scale
    environmental_impact TEXT,
    weather_conditions TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farm_statistics_farm ON farm_statistics(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_statistics_date ON farm_statistics(report_date);
CREATE INDEX IF NOT EXISTS idx_farm_operations_farm ON farm_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_operations_date ON farm_operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_farm_operations_type ON farm_operations(operation_type);

-- Enhanced fields table for better crop management
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_hectares REAL,
    yield_per_hectare REAL,
    status TEXT DEFAULT 'planted', -- 'planned', 'planted', 'growing', 'harvested', 'failed'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL
);

-- Add crops indexes
CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_field ON crops(field_id);
CREATE INDEX IF NOT EXISTS idx_crops_type ON crops(crop_type);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);

-- Enhanced tasks table with more fields
CREATE TABLE IF NOT EXISTS enhanced_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- 'planting', 'harvesting', 'maintenance', 'treatment', 'general'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled', 'overdue'
    assigned_to TEXT,
    created_by TEXT NOT NULL,
    due_date DATE,
    started_date DATE,
    completed_date DATE,
    estimated_hours REAL,
    actual_hours REAL,
    cost REAL DEFAULT 0,
    equipment_used TEXT,
    weather_conditions TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add enhanced tasks indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_farm ON enhanced_tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_status ON enhanced_tasks(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_priority ON enhanced_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_due_date ON enhanced_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_assigned ON enhanced_tasks(assigned_to);