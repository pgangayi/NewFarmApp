-- Farm Management System - Initial Schema
-- Material UI Enhanced Farm Management Application
-- Date: January 22, 2026
-- Version: 1.0.0

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- CORE USER MANAGEMENT
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    farm_name TEXT NOT NULL,
    location TEXT,
    farm_type TEXT DEFAULT 'mixed' CHECK (farm_type IN ('crop', 'livestock', 'mixed', 'organic')),
    total_area REAL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Farm members table
CREATE TABLE IF NOT EXISTS farm_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'worker', 'member')),
    permissions TEXT, -- JSON string of permissions
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(farm_id, user_id)
);

-- ============================================================================
-- FIELD MANAGEMENT
-- ============================================================================

-- Fields table
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    location_type TEXT DEFAULT 'field' CHECK (location_type IN ('field', 'greenhouse', 'orchard', 'pasture')),
    area REAL NOT NULL,
    soil_type TEXT,
    coordinates TEXT, -- JSON for lat/lng
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- ============================================================================
-- CROP MANAGEMENT
-- ============================================================================

-- Crop varieties lookup table
CREATE TABLE IF NOT EXISTS crop_varieties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_type TEXT NOT NULL,
    variety_name TEXT NOT NULL,
    description TEXT,
    growing_season_days INTEGER,
    water_requirements TEXT,
    soil_preferences TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crop_type, variety_name)
);

-- Crops table
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    name TEXT,
    crop_type TEXT NOT NULL,
    variety TEXT,
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'planted', 'growing', 'ready', 'harvested', 'failed')),
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'diseased', 'pest_damage')),
    area_planted REAL,
    expected_yield REAL,
    actual_yield REAL,
    current_weight REAL,
    target_weight REAL,
    notes TEXT,
    irrigation_schedule TEXT,
    fertilizer_type TEXT,
    pest_control_schedule TEXT,
    soil_preparation TEXT,
    weather_requirements TEXT,
    growth_stage TEXT,
    last_inspection_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL
);

-- Crop activities table
CREATE TABLE IF NOT EXISTS crop_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('planting', 'watering', 'fertilizing', 'pest_control', 'harvesting', 'inspection')),
    activity_date DATE NOT NULL,
    description TEXT,
    materials_used TEXT,
    cost REAL,
    performed_by TEXT,
    weather_conditions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- ============================================================================
-- LIVESTOCK MANAGEMENT
-- ============================================================================

-- Animal breeds lookup table
CREATE TABLE IF NOT EXISTS animal_breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    breed_name TEXT NOT NULL,
    origin_country TEXT,
    purpose TEXT,
    average_weight REAL,
    temperament TEXT,
    special_characteristics TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(species, breed_name)
);

-- Animals table
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    identification_tag TEXT UNIQUE,
    animal_name TEXT,
    species TEXT NOT NULL,
    breed TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased', 'transferred')),
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'sick', 'injured', 'quarantine')),
    current_location_id INTEGER,
    weight REAL,
    height REAL,
    current_weight REAL,
    target_weight REAL,
    purchase_date DATE,
    purchase_cost REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (current_location_id) REFERENCES fields(id) ON DELETE SET NULL
);

-- Animal health records
CREATE TABLE IF NOT EXISTS animal_health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    check_date DATE NOT NULL,
    health_status TEXT NOT NULL,
    weight REAL,
    temperature REAL,
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    veterinarian TEXT,
    cost REAL,
    next_check_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
);

-- Animal production records
CREATE TABLE IF NOT EXISTS animal_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    production_type TEXT NOT NULL CHECK (production_type IN ('milk', 'eggs', 'wool', 'meat', 'offspring')),
    production_date DATE NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    quality_grade TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE
);

-- ============================================================================
-- INVENTORY MANAGEMENT
-- ============================================================================

-- Inventory categories lookup
CREATE TABLE IF NOT EXISTS inventory_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT UNIQUE NOT NULL,
    parent_category_id INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES inventory_categories(id) ON DELETE SET NULL
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT NOT NULL,
    unit_cost REAL,
    total_cost REAL,
    location TEXT,
    supplier TEXT,
    purchase_date DATE,
    expiry_date DATE,
    minimum_quantity REAL DEFAULT 0,
    maximum_quantity REAL,
    reorder_level REAL,
    batch_number TEXT,
    storage_conditions TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'low_stock')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Inventory transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
    quantity REAL NOT NULL,
    unit_cost REAL,
    total_cost REAL,
    reference_type TEXT, -- 'task', 'sale', 'purchase', etc.
    reference_id INTEGER,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

-- Inventory alerts
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'expired', 'overstock', 'price_change')),
    alert_date DATE NOT NULL DEFAULT (date('now')),
    current_quantity REAL NOT NULL,
    threshold_quantity REAL NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_date DATE,
    resolved_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
);

-- ============================================================================
-- TASK MANAGEMENT
-- ============================================================================

-- Task templates lookup
CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,
    template_name TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER, -- in hours
    required_skills TEXT,
    materials_needed TEXT,
    safety_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    task_name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    start_date DATE,
    completion_date DATE,
    estimated_duration INTEGER, -- in hours
    actual_duration INTEGER, -- in hours
    related_entity_type TEXT, -- 'crop', 'animal', 'equipment', etc.
    related_entity_id INTEGER,
    location TEXT,
    materials_needed TEXT,
    cost REAL,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- ============================================================================
-- FINANCIAL MANAGEMENT
-- ============================================================================

-- Finance entries table
CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('income', 'expense')),
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    date DATE NOT NULL,
    vendor_customer TEXT,
    payment_method TEXT,
    reference_number TEXT,
    receipt_url TEXT,
    tags TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- ============================================================================
-- EQUIPMENT MANAGEMENT
-- ============================================================================

-- Equipment types lookup
CREATE TABLE IF NOT EXISTS equipment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT UNIQUE NOT NULL,
    category TEXT,
    description TEXT,
    maintenance_interval INTEGER, -- in days
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    equipment_name TEXT NOT NULL,
    type TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT UNIQUE,
    purchase_date DATE,
    purchase_cost REAL,
    current_value REAL,
    status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'repair', 'retired')),
    location TEXT,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    operating_hours INTEGER,
    fuel_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (type) REFERENCES equipment_types(type) ON DELETE RESTRICT
);

-- ============================================================================
-- WEATHER DATA
-- ============================================================================

-- Weather data table
CREATE TABLE IF NOT EXISTS weather_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    date DATE NOT NULL,
    temperature_high REAL,
    temperature_low REAL,
    humidity REAL,
    precipitation REAL,
    wind_speed REAL,
    conditions TEXT,
    forecast_data TEXT, -- JSON for detailed forecast
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    UNIQUE(farm_id, date)
);

-- ============================================================================
-- NOTIFICATIONS & COMMUNICATION
-- ============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    farm_id INTEGER,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'task', 'alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    farm_id INTEGER,
    table_name TEXT NOT NULL,
    record_id INTEGER,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
);

-- ============================================================================
-- SECURITY & SESSIONS
-- ============================================================================

-- Session tracking table
CREATE TABLE IF NOT EXISTS session_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    logout_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Token revocation table
CREATE TABLE IF NOT EXISTS token_revocation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token_hash TEXT UNIQUE NOT NULL,
    revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- ADVANCED FEATURES
-- ============================================================================

-- Crop rotation plans
CREATE TABLE IF NOT EXISTS crop_rotation_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    plan_name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL
);

-- Rotation sequence
CREATE TABLE IF NOT EXISTS rotation_sequence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rotation_plan_id INTEGER NOT NULL,
    sequence_order INTEGER NOT NULL,
    crop_type TEXT,
    variety TEXT,
    planting_date DATE,
    expected_harvest_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rotation_plan_id) REFERENCES crop_rotation_plans(id) ON DELETE CASCADE
);

-- Pest and disease management
CREATE TABLE IF NOT EXISTS pest_diseases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT CHECK (type IN ('pest', 'disease')),
    description TEXT,
    symptoms TEXT,
    treatment_methods TEXT,
    prevention_methods TEXT,
    affected_crops TEXT, -- JSON array
    severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crop pest/disease records
CREATE TABLE IF NOT EXISTS crop_pest_disease_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    crop_id INTEGER,
    pest_disease_id INTEGER,
    detection_date DATE,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    affected_area REAL,
    treatment_method TEXT,
    treatment_cost REAL,
    treatment_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'treated', 'resolved', 'monitoring')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL,
    FOREIGN KEY (pest_disease_id) REFERENCES pest_diseases(id) ON DELETE SET NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Farms indexes
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farms_farm_type ON farms(farm_type);
CREATE INDEX IF NOT EXISTS idx_farms_created_at ON farms(created_at);

-- Farm members indexes
CREATE INDEX IF NOT EXISTS idx_farm_members_farm_id ON farm_members(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_user_id ON farm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_role ON farm_members(role);
CREATE INDEX IF NOT EXISTS idx_farm_members_composite ON farm_members(farm_id, user_id);

-- Fields indexes
CREATE INDEX IF NOT EXISTS idx_fields_farm_id ON fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_fields_location_type ON fields(location_type);

-- Crops indexes
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_field_id ON crops(field_id);
CREATE INDEX IF NOT EXISTS idx_crops_crop_type ON crops(crop_type);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON crops(planting_date);
CREATE INDEX IF NOT EXISTS idx_crops_composite ON crops(farm_id, status, crop_type);

-- Animals indexes
CREATE INDEX IF NOT EXISTS idx_animals_farm_id ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_health_status ON animals(health_status);
CREATE INDEX IF NOT EXISTS idx_animals_composite ON animals(farm_id, species, status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_farm_id ON tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_composite ON tasks(farm_id, status, priority);

-- Finance indexes
CREATE INDEX IF NOT EXISTS idx_finance_entries_farm_id ON finance_entries(farm_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_entry_type ON finance_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_finance_entries_date ON finance_entries(date);
CREATE INDEX IF NOT EXISTS idx_finance_entries_composite ON finance_entries(farm_id, entry_type, date);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_farm_id ON inventory(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_composite ON inventory(farm_id, category, name);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Session tracking indexes
CREATE INDEX IF NOT EXISTS idx_session_tracking_user_id ON session_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tracking_session_id ON session_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tracking_expires_at ON session_tracking(expires_at);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Farm overview view
CREATE VIEW IF NOT EXISTS farm_overview AS
SELECT 
    f.id as farm_id,
    f.farm_name,
    f.location,
    f.farm_type,
    f.total_area,
    u.first_name || ' ' || u.last_name as owner_name,
    COUNT(DISTINCT fm.user_id) as member_count,
    COUNT(DISTINCT c.id) as crop_count,
    COUNT(DISTINCT a.id) as animal_count,
    COUNT(DISTINCT t.id) as active_task_count,
    COALESCE(SUM(CASE WHEN fe.entry_type = 'income' THEN fe.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN fe.entry_type = 'expense' THEN fe.amount ELSE 0 END), 0) as total_expense
FROM farms f
LEFT JOIN users u ON f.owner_id = u.id
LEFT JOIN farm_members fm ON f.id = fm.farm_id
LEFT JOIN crops c ON f.id = c.farm_id AND c.status IN ('planted', 'growing')
LEFT JOIN animals a ON f.id = a.farm_id AND a.status = 'active'
LEFT JOIN tasks t ON f.id = t.farm_id AND t.status IN ('pending', 'in_progress')
LEFT JOIN finance_entries fe ON f.id = fe.farm_id
GROUP BY f.id;

-- Active alerts view
CREATE VIEW IF NOT EXISTS active_alerts AS
SELECT 
    ia.id,
    ia.inventory_id,
    i.name as item_name,
    ia.alert_type,
    ia.severity,
    ia.current_quantity,
    ia.threshold_quantity,
    ia.alert_date,
    f.farm_name
FROM inventory_alerts ia
JOIN inventory i ON ia.inventory_id = i.id
JOIN farms f ON i.farm_id = f.id
WHERE ia.resolved = FALSE
ORDER BY ia.severity DESC, ia.alert_date DESC;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update inventory total cost when quantity or unit cost changes
CREATE TRIGGER IF NOT EXISTS update_inventory_total_cost
    AFTER UPDATE OF quantity, unit_cost ON inventory
BEGIN
    UPDATE inventory 
    SET total_cost = quantity * COALESCE(unit_cost, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Update inventory total cost on insert
CREATE TRIGGER IF NOT EXISTS insert_inventory_total_cost
    AFTER INSERT ON inventory
BEGIN
    UPDATE inventory 
    SET total_cost = quantity * COALESCE(unit_cost, 0)
    WHERE id = NEW.id;
END;

-- Create audit log entry for task updates
CREATE TRIGGER IF NOT EXISTS audit_task_update
    AFTER UPDATE ON tasks
BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, new_values)
    VALUES ('tasks', NEW.id, 'UPDATE', json_object(
        'task_name', NEW.task_name,
        'status', NEW.status,
        'updated_at', CURRENT_TIMESTAMP
    ));
END;

-- ============================================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================================

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES (1, 'admin@farmapp.com', '$2b$10$rQZ8kHWKQGYXkYQxQxOQOeXQxQxQxQxQxQxQxQxQxQxQxQxQxQxQxQ', 'System', 'Administrator', 'admin', TRUE, TRUE);

-- Insert sample farm
INSERT OR IGNORE INTO farms (id, owner_id, farm_name, location, farm_type, total_area)
VALUES (1, 1, 'Green Valley Farm', 'California, USA', 'mixed', 100.5);

-- Insert basic crop varieties
INSERT OR IGNORE INTO crop_varieties (crop_type, variety_name, growing_season_days)
VALUES 
    ('Corn', 'Sweet Corn', 80),
    ('Corn', 'Field Corn', 120),
    ('Wheat', 'Winter Wheat', 240),
    ('Wheat', 'Spring Wheat', 110),
    ('Tomato', 'Roma', 75),
    ('Tomato', 'Beefsteak', 85),
    ('Potato', 'Russet', 90),
    ('Potato', 'Red', 80);

-- Insert basic animal breeds
INSERT OR IGNORE INTO animal_breeds (species, breed_name, purpose, average_weight)
VALUES 
    ('Cattle', 'Angus', 'Beef', 650),
    ('Cattle', 'Holstein', 'Dairy', 680),
    ('Chicken', 'Rhode Island Red', 'Eggs', 3.5),
    ('Chicken', 'Broiler', 'Meat', 2.5),
    ('Pig', 'Yorkshire', 'Meat', 250),
    ('Sheep', 'Merino', 'Wool', 70);

-- Insert basic inventory categories
INSERT OR IGNORE INTO inventory_categories (category_name)
VALUES 
    ('Seeds'),
    ('Fertilizers'),
    ('Pesticides'),
    ('Feed'),
    ('Medicine'),
    ('Tools'),
    ('Equipment Parts');

-- Insert basic task templates
INSERT OR IGNORE INTO task_templates (task_type, template_name, description, estimated_duration)
VALUES 
    ('Planting', 'Corn Planting', 'Standard corn planting procedure', 8),
    ('Harvesting', 'Corn Harvest', 'Mechanical corn harvesting', 12),
    ('Feeding', 'Livestock Feeding', 'Daily feeding routine', 2),
    ('Maintenance', 'Equipment Check', 'Regular equipment maintenance', 4);

-- Insert basic pest/disease entries
INSERT OR IGNORE INTO pest_diseases (name, type, description, severity_level)
VALUES 
    ('Corn Borer', 'pest', 'Common corn pest that damages stalks', 'medium'),
    ('Aphids', 'pest', 'Small insects that suck plant sap', 'low'),
    ('Powdery Mildew', 'disease', 'Fungal disease affecting leaves', 'medium'),
    ('Root Rot', 'disease', 'Soil-borne fungal disease', 'high');
