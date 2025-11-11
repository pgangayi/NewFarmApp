-- Create bulk operations table for batch processing system
CREATE TABLE IF NOT EXISTS bulk_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  farm_id INTEGER,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'completed_with_errors')),
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  template_id TEXT,
  options TEXT, -- JSON object with operation options
  error_details TEXT, -- JSON array of error details
  started_at DATETIME,
  completed_at DATETIME,
  cancelled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Create bulk operation items table for detailed tracking
CREATE TABLE IF NOT EXISTS bulk_operation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bulk_operation_id INTEGER NOT NULL,
  item_index INTEGER NOT NULL,
  item_data TEXT NOT NULL, -- JSON object with original item data
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'success', 'error', 'skipped')),
  result_data TEXT, -- JSON object with processing result
  error_message TEXT,
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bulk_operation_id) REFERENCES bulk_operations(id) ON DELETE CASCADE
);

-- Create generated reports table for bulk report generation
CREATE TABLE IF NOT EXISTS generated_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id INTEGER NOT NULL,
  report_type TEXT NOT NULL,
  time_range TEXT NOT NULL,
  format TEXT DEFAULT 'pdf',
  include_charts INTEGER DEFAULT 0,
  report_url TEXT,
  file_size INTEGER,
  status TEXT NOT NULL DEFAULT 'generating' CHECK(status IN ('generating', 'completed', 'failed', 'expired')),
  parameters TEXT, -- JSON object with report parameters
  email_recipients TEXT, -- JSON array of email addresses
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create operation templates table for reusable bulk operations
CREATE TABLE IF NOT EXISTS bulk_operation_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  operation_type TEXT NOT NULL,
  category TEXT NOT NULL,
  required_fields TEXT, -- JSON array of required field names
  optional_fields TEXT, -- JSON array of optional field names
  sample_data TEXT, -- JSON array of sample data
  is_public INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bulk_operations_user_id ON bulk_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_farm_id ON bulk_operations(farm_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_type ON bulk_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_at ON bulk_operations(created_at);

CREATE INDEX IF NOT EXISTS idx_bulk_operation_items_operation_id ON bulk_operation_items(bulk_operation_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_items_status ON bulk_operation_items(status);

CREATE INDEX IF NOT EXISTS idx_generated_reports_farm_id ON generated_reports(farm_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_bulk_operation_templates_type ON bulk_operation_templates(operation_type);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_templates_category ON bulk_operation_templates(category);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_templates_public ON bulk_operation_templates(is_public);

-- Insert default operation templates
INSERT OR IGNORE INTO bulk_operation_templates (
  name, description, operation_type, category, required_fields, optional_fields, sample_data, is_public, created_by
) VALUES
(
  'Daily Tasks Template',
  'Template for creating daily routine tasks',
  'bulk_task_creation',
  'tasks',
  '["title", "description", "task_category", "priority"]',
  '["due_date", "assigned_to", "estimated_duration"]',
  '[{"title": "Morning Animal Check", "description": "Check all animals for health and behavior", "task_category": "Livestock", "priority": "high", "due_date": "2025-11-11"}, {"title": "Irrigation Check", "description": "Verify all irrigation systems are functioning", "task_category": "Crops", "priority": "medium", "due_date": "2025-11-11"}]',
  1,
  'system'
),
(
  'Inventory Restock Template',
  'Template for adding inventory items',
  'bulk_inventory_update',
  'inventory',
  '["item_name", "action", "quantity"]',
  '["unit_cost", "supplier", "category"]',
  '[{"item_name": "Feed Pellets", "action": "add", "quantity": 200, "unit_cost": 15.50, "supplier": "Farm Supply Co", "category": "Animal Feed"}, {"item_name": "Fertilizer", "action": "add", "quantity": 100, "unit_cost": 25.00, "supplier": "Agri Supplies", "category": "Soil Amendments"}]',
  1,
  'system'
),
(
  'Monthly Financial Report Template',
  'Template for generating monthly financial reports',
  'bulk_report_generation',
  'reports',
  '["report_type", "time_range"]',
  '["include_charts", "format", "email_recipients"]',
  '[{"report_type": "financial", "time_range": "30d", "include_charts": true, "format": "pdf"}, {"report_type": "expense_summary", "time_range": "30d", "include_charts": false, "format": "csv"}]',
  1,
  'system'
);

-- Create triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_bulk_operations_timestamp 
AFTER UPDATE ON bulk_operations
FOR EACH ROW
BEGIN
  UPDATE bulk_operations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_bulk_operation_templates_timestamp 
AFTER UPDATE ON bulk_operation_templates
FOR EACH ROW
BEGIN
  UPDATE bulk_operation_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;