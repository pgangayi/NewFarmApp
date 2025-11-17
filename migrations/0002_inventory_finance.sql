-- Inventory and Finance Tables Migration
-- Date: November 15, 2025
-- Adding inventory, finance, and related functionality

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    qty REAL NOT NULL DEFAULT 0,
    unit TEXT,
    reorder_threshold REAL DEFAULT 0,
    supplier_info TEXT, -- JSON string for supplier details
    cost_per_unit REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Inventory transactions table (single source of truth)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    farm_id INTEGER NOT NULL,
    qty_delta REAL NOT NULL, -- Positive for additions, negative for usage
    unit TEXT,
    reason_type TEXT NOT NULL, -- 'treatment', 'purchase', 'usage', 'adjustment'
    reference_type TEXT,
    reference_id TEXT, -- Could reference treatments.id or other entities
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Finance entries table
CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    entry_date DATE NOT NULL DEFAULT (date('now')),
    type TEXT NOT NULL, -- 'income', 'expense', 'investment'
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    account TEXT,
    description TEXT,
    reference_type TEXT,
    reference_id TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- MISSING TABLES FROM SCHEMA ANALYSIS

-- Inventory alert system
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL, -- 'low_stock', 'expired', 'overstock'
    alert_date DATE NOT NULL,
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

-- Inventory cost history tracking
CREATE TABLE IF NOT EXISTS inventory_cost_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    cost_date DATE NOT NULL,
    unit_cost REAL NOT NULL,
    quantity_purchased REAL NOT NULL,
    total_cost REAL NOT NULL,
    cost_reason TEXT NOT NULL, -- 'purchase', 'price_update', 'adjustment'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Inventory suppliers
CREATE TABLE IF NOT EXISTS inventory_suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    payment_terms TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'ordered', 'delivered', 'cancelled'
    created_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES inventory_suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    inventory_item_id INTEGER NOT NULL,
    quantity_ordered REAL NOT NULL,
    unit_cost REAL NOT NULL,
    total_cost REAL NOT NULL,
    received_quantity REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

-- Treatments table (for treatment application)
CREATE TABLE IF NOT EXISTS treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    target_type TEXT NOT NULL, -- 'crop', 'field', 'animal'
    target_id TEXT NOT NULL, -- Reference to specific entity
    treatment_type TEXT,
    product_used TEXT,
    notes TEXT,
    applied_at DATETIME NOT NULL,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_farm ON inventory_transactions(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_farm ON finance_entries(farm_id);
CREATE INDEX IF NOT EXISTS idx_treatments_farm ON treatments(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_item ON inventory_alerts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_cost_history_item ON inventory_cost_history(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_farm ON purchase_orders(farm_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);