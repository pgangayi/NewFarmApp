-- Create notifications table for smart notification system
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  target_type TEXT DEFAULT 'user' CHECK(target_type IN ('user', 'farm', 'global')),
  target_id TEXT,
  action_url TEXT,
  is_read INTEGER DEFAULT 0,
  is_dismissed INTEGER DEFAULT 0,
  is_global INTEGER DEFAULT 0,
  read_at DATETIME,
  dismissed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  categories TEXT, -- JSON object with category preferences
  channels TEXT, -- JSON object with channel preferences (email, push, in-app)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notification history for analytics
CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- sent, delivered, opened, clicked, dismissed
  action_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON object with additional action data
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Create notification triggers table for automated notifications
CREATE TABLE IF NOT EXISTS notification_triggers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  farm_id INTEGER NOT NULL,
  trigger_name TEXT NOT NULL,
  condition_json TEXT NOT NULL, -- JSON object defining trigger conditions
  action_json TEXT NOT NULL, -- JSON object defining notification action
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_notification_id ON notification_history(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_action ON notification_history(action_type, action_timestamp);
CREATE INDEX IF NOT EXISTS idx_notification_triggers_farm_id ON notification_triggers(farm_id);
CREATE INDEX IF NOT EXISTS idx_notification_triggers_active ON notification_triggers(is_active, trigger_name);

-- Create notification categories table
CREATE TABLE IF NOT EXISTS notification_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_priority TEXT DEFAULT 'medium' CHECK(default_priority IN ('low', 'medium', 'high', 'urgent')),
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default notification categories
INSERT OR IGNORE INTO notification_categories (name, description, default_priority) VALUES
('tasks', 'Task and workflow notifications', 'medium'),
('inventory', 'Inventory and stock notifications', 'medium'),
('animals', 'Animal health and management', 'high'),
('crops', 'Crop monitoring and alerts', 'medium'),
('finance', 'Financial and budget alerts', 'medium'),
('weather', 'Weather and environmental alerts', 'medium'),
('system', 'System and security notifications', 'high'),
('general', 'General farm updates and news', 'low');

-- Create default notification triggers
INSERT OR IGNORE INTO notification_triggers (farm_id, trigger_name, condition_json, action_json) VALUES
(1, 'overdue_tasks', '{"type": "overdue_tasks", "threshold": 1}', '{"category": "tasks", "priority": "high", "title": "Overdue Tasks", "message": "You have overdue tasks requiring attention"}'),
(1, 'low_stock', '{"type": "low_stock", "threshold": 1}', '{"category": "inventory", "priority": "medium", "title": "Low Stock Alert", "message": "Items are running low on stock"}'),
(1, 'animal_health', '{"type": "unhealthy_animals", "threshold": 1}', '{"category": "animals", "priority": "high", "title": "Animal Health Alert", "message": "Animals need health attention"}'),
(1, 'financial_alert', '{"type": "expense_threshold", "threshold": 1.2}', '{"category": "finance", "priority": "medium", "title": "Financial Alert", "message": "Expenses are higher than expected"}');