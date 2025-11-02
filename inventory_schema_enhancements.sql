-- Farm Management System - Inventory Module Schema Enhancements
-- Phase 1: Foundation & Core Features
-- Date: October 31, 2025

-- Enhanced inventory tables with comprehensive supply chain features
ALTER TABLE inventory_items ADD COLUMN category TEXT;
ALTER TABLE inventory_items ADD COLUMN supplier_info TEXT;
ALTER TABLE inventory_items ADD COLUMN storage_requirements TEXT;
ALTER TABLE inventory_items ADD COLUMN expiration_date DATE;
ALTER TABLE inventory_items ADD COLUMN quality_grade TEXT;
ALTER TABLE inventory_items ADD COLUMN minimum_order_quantity REAL;
ALTER TABLE inventory_items ADD COLUMN maximum_order_quantity REAL;
ALTER TABLE inventory_items ADD COLUMN cost_trend TEXT;
ALTER TABLE inventory_items ADD COLUMN current_cost_per_unit REAL;
ALTER TABLE inventory_items ADD COLUMN preferred_supplier_id INTEGER;

-- Advanced transactions with enhanced tracking
ALTER TABLE inventory_transactions ADD COLUMN batch_number TEXT;
ALTER TABLE inventory_transactions ADD COLUMN location_code TEXT;
ALTER TABLE inventory_transactions ADD COLUMN quality_check BOOLEAN;
ALTER TABLE inventory_transactions ADD COLUMN damage_percentage REAL;
ALTER TABLE inventory_transactions ADD COLUMN unit_cost REAL;
ALTER TABLE inventory_transactions ADD COLUMN total_cost REAL;
ALTER TABLE inventory_transactions ADD COLUMN supplier_invoice TEXT;
ALTER TABLE inventory_transactions ADD COLUMN transaction_type TEXT DEFAULT 'standard'; -- 'standard', 'return', 'adjustment', 'transfer'

-- Supporting tables for comprehensive inventory management

-- Inventory alerts and notifications
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL, -- 'low_stock', 'expiring', 'overstock', 'price_change', 'quality_issue'
    alert_date DATE NOT NULL,
    current_quantity REAL,
    threshold_quantity REAL,
    severity TEXT, -- 'low', 'medium', 'high', 'critical'
    resolved BOOLEAN DEFAULT 0,
    resolved_date DATE,
    resolved_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Supplier management
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
    reliability_rating INTEGER, -- 1-10 scale
    product_categories TEXT, -- JSON or comma-separated
    pricing_structure TEXT,
    delivery_schedule TEXT,
    active BOOLEAN DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Purchase orders and procurement tracking
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    supplier_id INTEGER,
    order_number TEXT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    order_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
    total_amount REAL,
    currency TEXT DEFAULT 'USD',
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'partial'
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES inventory_suppliers(id) ON DELETE SET NULL
);

-- Purchase order line items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    quantity_ordered REAL NOT NULL,
    quantity_received REAL DEFAULT 0,
    unit_price REAL NOT NULL,
    total_price REAL,
    received_date DATE,
    quality_approved BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Inventory locations and storage tracking
CREATE TABLE IF NOT EXISTS inventory_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    location_code TEXT NOT NULL,
    location_name TEXT NOT NULL,
    location_type TEXT NOT NULL, -- 'warehouse', 'storage_room', 'freezer', 'refrigerator', 'outdoor', 'field_storage'
    capacity REAL,
    temperature_controlled BOOLEAN DEFAULT 0,
    humidity_controlled BOOLEAN DEFAULT 0,
    security_level TEXT DEFAULT 'standard', -- 'standard', 'secure', 'restricted'
    description TEXT,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Item locations (where specific items are stored)
CREATE TABLE IF NOT EXISTS item_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    quantity_stored REAL NOT NULL,
    allocated_quantity REAL DEFAULT 0, -- Quantity reserved for orders/production
    minimum_stock REAL DEFAULT 0,
    maximum_stock REAL,
    storage_cost_per_period REAL DEFAULT 0,
    last_restocked_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE CASCADE
);

-- Cost tracking and analysis
CREATE TABLE IF NOT EXISTS inventory_cost_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    cost_date DATE NOT NULL,
    unit_cost REAL NOT NULL,
    supplier_id INTEGER,
    purchase_order_id INTEGER,
    quantity_purchased REAL,
    total_cost REAL,
    currency TEXT DEFAULT 'USD',
    cost_reason TEXT, -- 'new_supplier', 'bulk_purchase', 'seasonal', 'inflation', 'promotion'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES inventory_suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
);

-- Quality control tracking
CREATE TABLE IF NOT EXISTS quality_inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    inspection_date DATE NOT NULL,
    inspection_type TEXT NOT NULL, -- 'incoming', 'periodic', 'complaint', 'recall'
    inspector_name TEXT,
    quality_grade TEXT, -- 'A', 'B', 'C', 'reject'
    quantity_inspected REAL,
    quantity_accepted REAL,
    quantity_rejected REAL,
    defect_description TEXT,
    corrective_action TEXT,
    next_inspection_date DATE,
    status TEXT DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'conditional'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Performance indexes for efficiency
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_item ON inventory_alerts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_suppliers_farm ON inventory_suppliers(farm_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON inventory_suppliers(active);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_farm ON purchase_orders(farm_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item ON purchase_order_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_item_locations_item ON item_locations(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_item_locations_location ON item_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_cost_history_item ON inventory_cost_history(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_cost_history_date ON inventory_cost_history(cost_date);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_item ON quality_inspections(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_date ON quality_inspections(inspection_date);

-- Business rule validation (application level for D1)
-- - Quantity validation (no negative stocks except for transactions)
-- - Expiration date validation (cannot be before current date)
-- - Quality grade consistency validation
-- - Lead time validation (suppliers)
-- - Cost validation (positive values only)
-- - Location capacity validation
-- - Reorder threshold validation

-- Pre-populate with common inventory categories and suppliers
INSERT OR IGNORE INTO inventory_suppliers (farm_id, supplier_name, contact_person, product_categories, reliability_rating) VALUES
(1, 'Local Farm Supply Co', 'John Smith', 'seeds,fertilizer,pesticides', 8),
(1, 'AgriTech Solutions', 'Sarah Johnson', 'equipment,tools,seeds', 9),
(1, 'Organic Farming Supply', 'Mike Davis', 'organic_seeds,compost,organic_fertilizer', 7);

INSERT OR IGNORE INTO inventory_locations (farm_id, location_code, location_name, location_type, capacity, temperature_controlled) VALUES
(1, 'WH001', 'Main Warehouse', 'warehouse', 1000.0, 0),
(1, 'FR001', 'Refrigerated Storage', 'refrigerator', 100.0, 1),
(1, 'FS001', 'Field Storage Shed', 'storage_room', 200.0, 0);

-- Integration points with other modules
-- - Link with crops for seed and input tracking
-- - Link with animals for feed and medication tracking
-- - Link with finance for cost and revenue tracking
-- - Link with tasks for procurement scheduling
-- - Link with suppliers for automated ordering

-- Aggregate views for analytics (using materialized queries via APIs)
-- Note: D1 has limited view support, so complex queries will be handled in APIs