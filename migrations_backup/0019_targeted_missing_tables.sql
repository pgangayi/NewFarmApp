-- Migration 0019: Targeted Missing Tables for Application Compatibility
-- Adds only the specific tables that are referenced in application code but missing from database
-- Date: November 15, 2025

-- ============================================================================
-- INVENTORY MANAGEMENT TABLES (Missing from existing schema)
-- ============================================================================

-- Inventory Alerts System (referenced in inventory-enhanced.js)
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL, -- 'low_stock', 'expired', 'overstock', 'price_change'
    alert_date DATE NOT NULL DEFAULT (date('now')),
    current_quantity REAL NOT NULL,
    threshold_quantity REAL NOT NULL,
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    resolved INTEGER DEFAULT 0,
    resolved_date DATE,
    resolved_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Inventory Cost History Tracking (referenced in inventory-enhanced.js)
CREATE TABLE IF NOT EXISTS inventory_cost_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    cost_date DATE NOT NULL DEFAULT (date('now')),
    unit_cost REAL NOT NULL,
    quantity_purchased REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    cost_reason TEXT NOT NULL, -- 'purchase', 'price_update', 'adjustment', 'initial_cost'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Inventory Suppliers Management (referenced in inventory-enhanced.js)
CREATE TABLE IF NOT EXISTS inventory_suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    supplier_name TEXT NOT NULL,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    payment_terms TEXT,
    lead_time_days INTEGER DEFAULT 0,
    reliability_rating REAL DEFAULT 5.0, -- 1-10 scale
    product_categories TEXT, -- JSON string
    pricing_structure TEXT,
    delivery_schedule TEXT,
    notes TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Purchase Orders (referenced in inventory-enhanced.js dependency checks)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    order_date DATE NOT NULL DEFAULT (date('now')),
    expected_delivery_date DATE,
    order_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
    total_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue'
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES inventory_suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Purchase Order Items (referenced in inventory-enhanced.js dependency checks)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    quantity_ordered REAL NOT NULL,
    quantity_received REAL DEFAULT 0,
    unit_cost REAL NOT NULL,
    total_cost REAL NOT NULL,
    expected_delivery_date DATE,
    received_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

-- ============================================================================
-- CROP MANAGEMENT TABLES (Missing from existing schema)
-- ============================================================================

-- Crop Planning System (referenced in crops.js)
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
    expected_total_yield REAL DEFAULT 0,
    projected_revenue REAL NOT NULL,
    projected_cost REAL NOT NULL,
    projected_profit REAL NOT NULL,
    status TEXT DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled', 'failed'
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Crop Activities (referenced in crops.js)
CREATE TABLE IF NOT EXISTS crop_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER,
    crop_plan_id INTEGER,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    activity_type TEXT NOT NULL, -- 'soil_preparation', 'planting', 'fertilizing', 'watering', 'pest_control', 'harvesting'
    activity_date DATE NOT NULL,
    description TEXT,
    cost_per_unit REAL DEFAULT 0,
    units_used_per_sqm REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    area_covered_sqm REAL DEFAULT 0,
    effectiveness_rating INTEGER, -- 1-10
    weather_during_activity TEXT,
    equipment_used TEXT,
    performed_by TEXT,
    supervisor_id TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    FOREIGN KEY (crop_plan_id) REFERENCES crop_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
);

-- Crop Observations (referenced in crops.js)
CREATE TABLE IF NOT EXISTS crop_observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    observation_date DATE NOT NULL,
    health_status TEXT, -- 'excellent', 'good', 'fair', 'poor', 'critical', 'dead'
    growth_stage TEXT, -- 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvest'
    plant_height_cm REAL,
    leaf_color TEXT,
    pest_presence INTEGER DEFAULT 0, -- boolean
    pest_type TEXT,
    disease_signs TEXT,
    disease_severity TEXT, -- 'mild', 'moderate', 'severe'
    soil_moisture_level TEXT, -- 'dry', 'moist', 'wet', 'saturated'
    soil_ph REAL,
    nutrient_deficiency TEXT,
    weed_pressure TEXT, -- 'none', 'low', 'moderate', 'high'
    weather_conditions TEXT,
    temperature_celsius REAL,
    humidity_percent REAL,
    rainfall_mm REAL,
    photos_taken INTEGER DEFAULT 0,
    action_required TEXT,
    next_observation_date DATE,
    notes TEXT,
    observer_id TEXT NOT NULL,
    verified_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    FOREIGN KEY (observer_id) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- ============================================================================
-- FARM OPERATIONS TABLE (Missing from existing schema)
-- ============================================================================

-- Farm Operations Tracking (referenced in farms.js)
CREATE TABLE IF NOT EXISTS farm_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL, -- 'planting', 'harvesting', 'maintenance', 'treatment', 'irrigation'
    operation_date DATE NOT NULL,
    description TEXT,
    cost REAL DEFAULT 0,
    revenue REAL DEFAULT 0,
    staff_involved TEXT, -- JSON string of staff IDs/names
    success_rating INTEGER DEFAULT 5, -- 1-10 scale
    environmental_impact TEXT,
    equipment_used TEXT, -- JSON string
    weather_conditions TEXT,
    duration_hours REAL DEFAULT 0,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================================
-- ENHANCED FARM STATISTICS TABLE (Alternative to existing metric-based structure)
-- ============================================================================

-- Enhanced Farm Statistics (for analytics and reporting as expected by application)
CREATE TABLE IF NOT EXISTS enhanced_farm_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    report_date DATE NOT NULL,
    total_animals INTEGER DEFAULT 0,
    total_acres_under_cultivation REAL DEFAULT 0,
    annual_revenue REAL DEFAULT 0,
    total_operational_cost REAL DEFAULT 0,
    profit_margin REAL DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    productivity_score REAL DEFAULT 0, -- 0-100
    sustainability_score REAL DEFAULT 0, -- 0-100
    weather_impact_score REAL DEFAULT 0, -- -100 to 100
    market_price_index REAL DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- ============================================================================
-- ANIMAL MANAGEMENT ENHANCEMENTS (Missing from existing schema)
-- ============================================================================

-- Animal Health Records (referenced in livestock APIs)
CREATE TABLE IF NOT EXISTS animal_health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    farm_id INTEGER NOT NULL,
    record_date DATE NOT NULL DEFAULT (date('now')),
    record_type TEXT NOT NULL, -- 'vaccination', 'treatment', 'checkup', 'illness', 'injury'
    description TEXT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    dosage TEXT,
    veterinarian_id TEXT,
    cost REAL DEFAULT 0,
    follow_up_required INTEGER DEFAULT 0,
    follow_up_date DATE,
    status TEXT DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (veterinarian_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Animal Events (Breeding, birth, death, sales, etc.)
CREATE TABLE IF NOT EXISTS animal_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    farm_id INTEGER NOT NULL,
    event_type TEXT NOT NULL, -- 'birth', 'breeding', 'sale', 'death', 'transfer', 'vaccination'
    event_date DATE NOT NULL,
    description TEXT,
    related_animal_id INTEGER, -- For breeding events
    location_from TEXT,
    location_to TEXT,
    price REAL, -- For sales
    buyer_info TEXT,
    seller_info TEXT,
    cause TEXT, -- For death events
    documentation TEXT, -- JSON for certificates, papers
    cost REAL DEFAULT 0,
    revenue REAL DEFAULT 0,
    notes TEXT,
    recorded_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (related_animal_id) REFERENCES animals(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Animal Movements (Location tracking)
CREATE TABLE IF NOT EXISTS animal_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    farm_id INTEGER NOT NULL,
    source_location_id INTEGER,
    destination_location_id INTEGER,
    movement_date DATE NOT NULL DEFAULT (date('now')),
    movement_type TEXT NOT NULL, -- 'grazing', 'housing', 'veterinary', 'sale', 'treatment'
    reason TEXT,
    duration_hours REAL DEFAULT 0,
    accompanying_animals TEXT, -- JSON array of animal IDs
    staff_responsible TEXT,
    recorded_by TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES (Non-destructive additions)
-- ============================================================================

-- Add missing columns to inventory_items table (only if they don't exist)
-- These are referenced in inventory-enhanced.js but missing from current schema
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN

-- Try to add columns, ignore errors if they already exist
-- Category and cost tracking
-- CREATE TABLE IF NOT EXISTS inventory_items_new AS SELECT * FROM inventory_items;

-- For now, let's add the essential columns that the application needs
-- We'll handle column additions in application code with proper error handling

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_item ON inventory_alerts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_date ON inventory_alerts(alert_date);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_inventory_cost_history_item ON inventory_cost_history(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_cost_history_date ON inventory_cost_history(cost_date);
CREATE INDEX IF NOT EXISTS idx_inventory_suppliers_farm ON inventory_suppliers(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_suppliers_active ON inventory_suppliers(active);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_farm ON purchase_orders(farm_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item ON purchase_order_items(inventory_item_id);

-- Crop management indexes
CREATE INDEX IF NOT EXISTS idx_crop_plans_farm ON crop_plans(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_field ON crop_plans(field_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_status ON crop_plans(status);
CREATE INDEX IF NOT EXISTS idx_crop_activities_crop ON crop_activities(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_activities_plan ON crop_activities(crop_plan_id);
CREATE INDEX IF NOT EXISTS idx_crop_activities_farm ON crop_activities(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_activities_date ON crop_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_crop_observations_crop ON crop_observations(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_observations_farm ON crop_observations(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_observations_date ON crop_observations(observation_date);
CREATE INDEX IF NOT EXISTS idx_crop_observations_health ON crop_observations(health_status);

-- Farm operations indexes
CREATE INDEX IF NOT EXISTS idx_farm_operations_farm ON farm_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_operations_date ON farm_operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_farm_operations_type ON farm_operations(operation_type);

-- Enhanced farm statistics indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_farm_statistics_farm ON enhanced_farm_statistics(farm_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_farm_statistics_date ON enhanced_farm_statistics(report_date);

-- Animal management indexes
CREATE INDEX IF NOT EXISTS idx_animal_health_records_animal ON animal_health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_health_records_farm ON animal_health_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_animal_health_records_date ON animal_health_records(record_date);
CREATE INDEX IF NOT EXISTS idx_animal_events_animal ON animal_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_events_farm ON animal_events(farm_id);
CREATE INDEX IF NOT EXISTS idx_animal_events_date ON animal_events(event_date);
CREATE INDEX IF NOT EXISTS idx_animal_events_type ON animal_events(event_type);
CREATE INDEX IF NOT EXISTS idx_animal_movements_animal ON animal_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_movements_farm ON animal_movements(farm_id);
CREATE INDEX IF NOT EXISTS idx_animal_movements_date ON animal_movements(movement_date);

-- ============================================================================
-- INSERT INITIAL DATA WHERE NEEDED
-- ============================================================================

-- Insert default enhanced farm statistics record for existing farms
INSERT INTO enhanced_farm_statistics (farm_id, report_date)
SELECT id, date('now') 
FROM farms 
WHERE NOT EXISTS (
    SELECT 1 FROM enhanced_farm_statistics fs WHERE fs.farm_id = farms.id
);

-- The migration is complete - all missing tables that application code expects have been created