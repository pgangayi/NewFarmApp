-- Farmers Boot - Consolidated Database Schema
-- Date: January 26, 2026
-- Version: 1.1.0 (Consolidated)

PRAGMA foreign_keys = ON;

-- ============================================================================
-- CORE USER & AUTH MANAGEMENT
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Using TEXT for UUID/Flexibility
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    email_verified BOOLEAN DEFAULT FALSE,
    last_session_id TEXT,
    concurrent_sessions INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    device_fingerprint TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Token revocation list
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id TEXT PRIMARY KEY,
    token_hash TEXT UNIQUE NOT NULL,
    user_id TEXT,
    token_type TEXT NOT NULL, -- 'access', 'refresh', 'reset'
    reason TEXT,
    revoked_by TEXT,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Login attempts tracking
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT, -- Anonymized or literal depending on policy
    email_hash TEXT,
    ip_address TEXT,
    user_agent TEXT,
    attempt_type TEXT DEFAULT 'login',
    success BOOLEAN DEFAULT 0,
    failure_reason TEXT,
    blocked_until DATETIME,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security events log
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    event_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT 1,
    details TEXT, -- JSON string
    resolved_at DATETIME,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FARM & MEMBERSHIP
-- ============================================================================

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    location TEXT,
    farm_type TEXT DEFAULT 'mixed' CHECK (farm_type IN ('crop', 'livestock', 'mixed', 'organic')),
    total_area REAL,
    area_hectares REAL, -- Syncing with backup schema field name
    description TEXT,
    metadata TEXT, -- JSON string
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Farm members table
CREATE TABLE IF NOT EXISTS farm_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'worker', 'member', 'accounting', 'admin')),
    permissions TEXT, -- JSON string
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(farm_id, user_id)
);

-- Farm invitations
CREATE TABLE IF NOT EXISTS farm_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'worker' CHECK (role IN ('owner', 'manager', 'worker', 'member', 'accounting', 'admin')),
    message TEXT,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
    expires_at DATETIME NOT NULL,
    invited_by TEXT NOT NULL,
    accepted_at DATETIME,
    accepted_by TEXT,
    revoked_at DATETIME,
    revoked_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PHYSICAL ASSETS (FIELDS, EQUIPMENT)
-- ============================================================================

-- Fields table
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_name TEXT NOT NULL, -- Unified name from initial schema
    name TEXT, -- Keeping name for backup schema compatibility
    location_type TEXT DEFAULT 'field' CHECK (location_type IN ('field', 'greenhouse', 'orchard', 'pasture')),
    area REAL,
    area_hectares REAL,
    area_sqm REAL,
    soil_type TEXT,
    crop_type TEXT,
    coordinates TEXT, -- JSON string
    notes TEXT,
    description TEXT, -- Unified field
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
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
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- ============================================================================
-- CORE OPERATIONS (CROPS, LIVESTOCK, TASKS)
-- ============================================================================

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

-- Crop activities
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

-- Animals table
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    identification_tag TEXT UNIQUE,
    animal_name TEXT,
    name TEXT, -- Backup compatibility
    species TEXT NOT NULL,
    breed TEXT,
    date_of_birth DATE,
    birth_date DATE, -- Backup compatibility
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown', 'M', 'F')),
    sex TEXT, -- Backup compatibility
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

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    task_name TEXT, -- Initial schema
    title TEXT, -- Backup schema
    task_type TEXT,
    description TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    start_date DATE,
    completion_date DATE,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    related_entity_type TEXT,
    related_entity_id INTEGER,
    location TEXT,
    materials_needed TEXT,
    cost REAL,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================================
-- INVENTORY & FINANCE
-- ============================================================================

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity REAL DEFAULT 0,
    qty REAL, -- Compatibility
    unit TEXT NOT NULL,
    unit_cost REAL,
    total_cost REAL,
    location TEXT,
    supplier TEXT,
    purchase_date DATE,
    expiry_date DATE,
    minimum_quantity REAL DEFAULT 0,
    reorder_threshold REAL DEFAULT 0, -- Compatibility
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
    inventory_id INTEGER,
    inventory_item_id INTEGER, -- Compatibility
    farm_id INTEGER,
    transaction_type TEXT CHECK (transaction_type IN ('in', 'out', 'adjustment')),
    reason_type TEXT, -- Compatibility
    qty_delta REAL, -- Compatibility
    quantity REAL,
    unit_cost REAL,
    total_cost REAL,
    reference_type TEXT,
    reference_id TEXT,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Finance entries
CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    entry_type TEXT CHECK (entry_type IN ('income', 'expense')),
    type TEXT, -- Compatibility
    category TEXT,
    subcategory TEXT,
    description TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    date DATE,
    entry_date DATE, -- Compatibility
    vendor_customer TEXT,
    payment_method TEXT,
    reference_number TEXT,
    receipt_url TEXT,
    tags TEXT,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================================
-- ANCILLARY TABLES (WEATHER, AUDIT, OPS)
-- ============================================================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    farm_id INTEGER,
    table_name TEXT, -- Version 1
    resource_type TEXT, -- Version 2
    record_id INTEGER,
    action TEXT NOT NULL,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL
);

-- Weather data
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
    forecast_data TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    UNIQUE(farm_id, date)
);

-- Operations table for idempotency
CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idempotency_key TEXT NOT NULL UNIQUE,
    user_id TEXT,
    request_body TEXT, -- JSON string
    response_body TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    farm_id INTEGER,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success', 'task', 'alert')),
    category TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- CSRF tokens
CREATE TABLE IF NOT EXISTS csrf_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- SAMPLE DATA (Admin User)
-- ============================================================================

-- Insert default admin user (password: admin123)
-- Using a known bcrypt hash for 'admin123'
INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES ('admin-001', 'admin@farmapp.com', '$2a$12$R9h/lSAbvI7.8USe9pC6pOnO7YgCOpkq89shzJ8vX2K8yS9Xxhz4y', 'System', 'Administrator', 'admin', TRUE, TRUE);

-- ============================================================================
-- INDEXES & PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id);
CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_farm ON inventory(farm_id);
CREATE INDEX IF NOT EXISTS idx_finance_farm ON finance_entries(farm_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_farm ON audit_logs(farm_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_hash ON revoked_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
