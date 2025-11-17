-- Create search history table for global search functionality
CREATE TABLE IF NOT EXISTS search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  type TEXT DEFAULT 'all',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);

-- Create search optimization indexes
CREATE INDEX IF NOT EXISTS idx_animals_search ON animals(name, species, breed, health_status);
CREATE INDEX IF NOT EXISTS idx_crops_search ON crops(name, crop_type, growth_stage);
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks(title, description, task_category);
CREATE INDEX IF NOT EXISTS idx_inventory_search ON inventory_items(name, category, supplier);
CREATE INDEX IF NOT EXISTS idx_farms_search ON farms(name, location, description);
CREATE INDEX IF NOT EXISTS idx_finance_search ON finance_entries(description, category);