-- Migration 0003: Enhanced Task, Finance, and Livestock Schema Support
-- Aligns SQLite/D1 schema with the expectations of the enhanced API handlers
-- Date: November 17, 2025

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- ---------------------------------------------------------------------------
-- Animals table enhancements for advanced livestock tracking
-- ---------------------------------------------------------------------------
ALTER TABLE animals ADD COLUMN current_location TEXT;
ALTER TABLE animals ADD COLUMN production_type TEXT;
ALTER TABLE animals ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE animals ADD COLUMN current_weight REAL;
ALTER TABLE animals ADD COLUMN target_weight REAL;
ALTER TABLE animals ADD COLUMN vaccination_status TEXT;
ALTER TABLE animals ADD COLUMN last_vet_check DATE;
ALTER TABLE animals ADD COLUMN acquisition_date DATE;
ALTER TABLE animals ADD COLUMN acquisition_cost REAL;
ALTER TABLE animals ADD COLUMN intake_type TEXT;
ALTER TABLE animals ADD COLUMN intake_date DATE;
ALTER TABLE animals ADD COLUMN purchase_price REAL;
ALTER TABLE animals ADD COLUMN seller_details TEXT;
ALTER TABLE animals ADD COLUMN father_id INTEGER;
ALTER TABLE animals ADD COLUMN mother_id INTEGER;
ALTER TABLE animals ADD COLUMN current_location_id INTEGER;

-- ---------------------------------------------------------------------------
-- Additional livestock support tables referenced by the API
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS animal_feeding_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    feeding_date DATE NOT NULL,
    feed_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT,
    feeding_method TEXT,
    ration_details TEXT,
    nutrition_notes TEXT,
    cost REAL,
    notes TEXT,
    recorded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS animal_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    source_location_id INTEGER,
    destination_location_id INTEGER,
    movement_date DATE NOT NULL,
    movement_type TEXT,
    reason TEXT,
    duration_hours REAL,
    accompanying_animals TEXT,
    staff_responsible TEXT,
    recorded_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_animal_feeding_records_animal ON animal_feeding_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_feeding_records_date ON animal_feeding_records(feeding_date);
CREATE INDEX IF NOT EXISTS idx_animal_movements_animal ON animal_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_movements_date ON animal_movements(movement_date);

-- Upgrade existing animal auxiliary tables with columns required by the API
ALTER TABLE animal_health_records ADD COLUMN status TEXT DEFAULT 'completed';
ALTER TABLE animal_production ADD COLUMN storage_location TEXT;
ALTER TABLE animal_breeding ADD COLUMN breeding_fee REAL;
ALTER TABLE animal_breeding ADD COLUMN breeding_result TEXT;
ALTER TABLE animal_breeding ADD COLUMN vet_supervision INTEGER DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Tasks table enhancements and supporting collaboration tables
-- ---------------------------------------------------------------------------
ALTER TABLE tasks ADD COLUMN priority_score REAL;
ALTER TABLE tasks ADD COLUMN estimated_duration REAL;
ALTER TABLE tasks ADD COLUMN actual_duration REAL;
ALTER TABLE tasks ADD COLUMN dependencies TEXT;
ALTER TABLE tasks ADD COLUMN resource_requirements TEXT;
ALTER TABLE tasks ADD COLUMN task_category TEXT;
ALTER TABLE tasks ADD COLUMN recurring_pattern TEXT;
ALTER TABLE tasks ADD COLUMN completion_criteria TEXT;
ALTER TABLE tasks ADD COLUMN progress_percentage REAL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN tags TEXT;
ALTER TABLE tasks ADD COLUMN location TEXT;

CREATE TABLE IF NOT EXISTS task_time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    break_time REAL DEFAULT 0,
    total_hours REAL DEFAULT 0,
    work_notes TEXT,
    productivity_rating INTEGER,
    interruptions_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'collaborator',
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    template_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    estimated_duration REAL,
    required_resources TEXT,
    priority_level TEXT,
    dependencies TEXT,
    instructions TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_task_time_logs_task ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_collaborators_task ON task_collaborators(task_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_farm ON task_templates(farm_id);

-- ---------------------------------------------------------------------------
-- Finance table enhancements and dependency tables
-- ---------------------------------------------------------------------------
ALTER TABLE finance_entries ADD COLUMN project_id TEXT;
ALTER TABLE finance_entries ADD COLUMN department TEXT;
ALTER TABLE finance_entries ADD COLUMN tax_category TEXT;
ALTER TABLE finance_entries ADD COLUMN approval_status TEXT DEFAULT 'pending';
ALTER TABLE finance_entries ADD COLUMN receipt_number TEXT;
ALTER TABLE finance_entries ADD COLUMN recurring_pattern TEXT;
ALTER TABLE finance_entries ADD COLUMN budget_category TEXT;
ALTER TABLE finance_entries ADD COLUMN tax_deductible INTEGER DEFAULT 0;
ALTER TABLE finance_entries ADD COLUMN bank_account TEXT;
ALTER TABLE finance_entries ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    customer_name TEXT,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    issued_date DATE DEFAULT (date('now')),
    due_date DATE,
    reference_entry_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    supplier_name TEXT,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    order_date DATE DEFAULT (date('now')),
    expected_delivery_date DATE,
    reference_entry_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_farm ON invoices(farm_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_farm ON purchase_orders(farm_id);

COMMIT;
PRAGMA foreign_keys = ON;
