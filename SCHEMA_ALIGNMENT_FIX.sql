-- Schema Alignment Fix for Farm Management System
-- This file resolves conflicts between base schema and enhancements
-- Safe to run after base migrations
-- Date: November 1, 2025

-- ============================================================================
-- CRITICAL FIX: Remove conflicting ALTER TABLE statement for farms.owner_id
-- ============================================================================

-- The base schema (0001_d1_complete_schema.sql) already defines owner_id in farms table
-- This line was causing conflicts: ALTER TABLE farms ADD COLUMN owner_id TEXT;
-- The column already exists with proper constraints in the base schema

-- ============================================================================
-- PHASE 1: Add missing columns to existing tables (safe to run multiple times)
-- ============================================================================

-- Tasks table enhancements (safe - columns may not exist yet)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority_score INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration REAL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_duration REAL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resource_requirements TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_category TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_pattern TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_criteria TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location TEXT;

-- Animals table enhancements (safe - columns may not exist yet)
ALTER TABLE animals ADD COLUMN IF NOT EXISTS acquisition_date DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS acquisition_cost REAL;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS current_weight REAL;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS target_weight REAL;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS vaccination_status TEXT DEFAULT 'up-to-date';
ALTER TABLE animals ADD COLUMN IF NOT EXISTS last_vet_check DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS current_location TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS pasture_id INTEGER;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS production_type TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE animals ADD COLUMN IF NOT EXISTS father_id INTEGER;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS mother_id INTEGER;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS genetic_profile TEXT;

-- Fields table enhancements (safe - columns may not exist yet)
ALTER TABLE fields ADD COLUMN IF NOT EXISTS soil_type TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS field_capacity REAL;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS current_cover_crop TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS irrigation_system TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS drainage_quality TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS accessibility_score INTEGER;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS environmental_factors TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS maintenance_schedule TEXT;

-- Inventory items enhancements (safe - columns may not exist yet)
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS supplier_info TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS storage_requirements TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS expiration_date DATE;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS quality_grade TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS minimum_order_quantity REAL;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS maximum_order_quantity REAL;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost_trend TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS current_cost_per_unit REAL;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS preferred_supplier_id INTEGER;

-- Inventory transactions enhancements (safe - columns may not exist yet)
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS location_code TEXT;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS quality_check BOOLEAN;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS damage_percentage REAL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS unit_cost REAL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS total_cost REAL;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS supplier_invoice TEXT;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'standard';

-- Finance entries enhancements (safe - columns may not exist yet)
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS tax_category TEXT;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS approval_status TEXT;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS recurring_pattern TEXT;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS budget_category TEXT;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS actual_vs_budgeted REAL;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN DEFAULT 0;
ALTER TABLE finance_entries ADD COLUMN IF NOT EXISTS bank_account TEXT;

-- Farms table enhancements (NOTE: owner_id already exists in base schema!)
ALTER TABLE farms ADD COLUMN IF NOT EXISTS farm_type TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS certification_status TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS environmental_compliance TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS total_acres REAL;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS operational_start_date DATE;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS management_structure TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS seasonal_staff INTEGER;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS annual_budget REAL;

-- ============================================================================
-- PHASE 2: Create supporting tables for enhanced functionality
-- ============================================================================

-- Farm statistics and analytics
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

-- Animal management enhancements
CREATE TABLE IF NOT EXISTS breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    name TEXT NOT NULL,
    origin_country TEXT,
    purpose TEXT,
    average_weight REAL,
    average_height REAL,
    lifespan_years REAL,
    temperament TEXT,
    special_requirements TEXT,
    milk_production_daily REAL,
    egg_production_yearly REAL,
    wool_production_yearly REAL,
    feed_requirements TEXT,
    health_considerations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Animal health records
CREATE TABLE IF NOT EXISTS animal_health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL,
    vet_name TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    dosage TEXT,
    cost REAL,
    next_due_date DATE,
    vet_contact TEXT,
    notes TEXT,
    attachments TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Animal production tracking
CREATE TABLE IF NOT EXISTS animal_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    production_date DATE NOT NULL,
    production_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    quality_grade TEXT,
    price_per_unit REAL,
    total_value REAL,
    market_destination TEXT,
    storage_location TEXT,
    notes TEXT,
    recorded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Enhanced inventory management
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL,
    alert_date DATE NOT NULL,
    current_quantity REAL,
    threshold_quantity REAL,
    severity TEXT,
    resolved BOOLEAN DEFAULT 0,
    resolved_date DATE,
    resolved_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    supplier_name TEXT NOT NULL,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    payment_terms TEXT,
    lead_time_days INTEGER,
    reliability_rating INTEGER,
    product_categories TEXT,
    pricing_structure TEXT,
    delivery_schedule TEXT,
    active BOOLEAN DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Enhanced crop management
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

-- ============================================================================
-- PHASE 3: Create comprehensive indexes for performance
-- ============================================================================

-- Farm analytics indexes
CREATE INDEX IF NOT EXISTS idx_farm_statistics_farm ON farm_statistics(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_statistics_date ON farm_statistics(report_date);
CREATE INDEX IF NOT EXISTS idx_farm_operations_farm ON farm_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_operations_type ON farm_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_farm_operations_date ON farm_operations(operation_date);

-- Animal management indexes
CREATE INDEX IF NOT EXISTS idx_breeds_species ON breeds(species);
CREATE INDEX IF NOT EXISTS idx_breeds_name ON breeds(name);
CREATE INDEX IF NOT EXISTS idx_health_records_animal ON animal_health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON animal_health_records(record_date);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON animal_health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_production_animal ON animal_production(animal_id);
CREATE INDEX IF NOT EXISTS idx_production_date ON animal_production(production_date);
CREATE INDEX IF NOT EXISTS idx_production_type ON animal_production(production_type);

-- Inventory management indexes
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_item ON inventory_alerts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_suppliers_farm ON inventory_suppliers(farm_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON inventory_suppliers(active);

-- Crop management indexes
CREATE INDEX IF NOT EXISTS idx_crop_varieties_type ON crop_varieties(crop_type);
CREATE INDEX IF NOT EXISTS idx_crop_activities_crop ON crop_activities(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_observations_crop ON crop_observations(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_yield_crop ON crop_yield_records(crop_id);

-- ============================================================================
-- SCHEMA ALIGNMENT COMPLETE
-- ============================================================================
-- This file ensures:
-- ✓ All enhancement columns are added safely (IF NOT EXISTS)
-- ✓ No conflicts with base schema columns
-- ✓ All supporting tables are created
-- ✓ Comprehensive indexing for performance
-- ✓ Foreign key relationships are maintained
--
-- Safe to run multiple times - all statements use IF NOT EXISTS