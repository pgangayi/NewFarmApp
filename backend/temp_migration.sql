-- Inventory Alerts System
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_item_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL,
    alert_date DATE NOT NULL DEFAULT (date('now')),
    current_quantity REAL NOT NULL,
    threshold_quantity REAL NOT NULL,
    severity TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,
    resolved_date DATE,
    resolved_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);
