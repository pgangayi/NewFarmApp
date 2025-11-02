-- Farm Management System - Tasks Module Schema Enhancements
-- Phase 1: Foundation & Core Features
-- Date: October 31, 2025

-- Enhanced tasks table with enterprise productivity features
ALTER TABLE tasks ADD COLUMN priority_score INTEGER;
ALTER TABLE tasks ADD COLUMN estimated_duration REAL;
ALTER TABLE tasks ADD COLUMN actual_duration REAL;
ALTER TABLE tasks ADD COLUMN dependencies TEXT;
ALTER TABLE tasks ADD COLUMN resource_requirements TEXT;
ALTER TABLE tasks ADD COLUMN task_category TEXT;
ALTER TABLE tasks ADD COLUMN recurring_pattern TEXT;
ALTER TABLE tasks ADD COLUMN completion_criteria TEXT;
ALTER TABLE tasks ADD COLUMN progress_percentage INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN tags TEXT;
ALTER TABLE tasks ADD COLUMN location TEXT;

-- Supporting tables for comprehensive task management

-- Task templates for repeatable processes
CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    template_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    estimated_duration REAL,
    required_resources TEXT,
    priority_level INTEGER,
    dependencies TEXT,
    instructions TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Detailed time logging and productivity tracking
CREATE TABLE IF NOT EXISTS task_time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    break_time REAL DEFAULT 0,
    total_hours REAL,
    work_notes TEXT,
    productivity_rating INTEGER, -- 1-5 scale
    interruptions_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Task comments and collaboration
CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    comment_type TEXT DEFAULT 'general', -- 'general', 'update', 'issue', 'completion'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Task attachments and documents
CREATE TABLE IF NOT EXISTS task_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    attachment_type TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Recurring task schedules
CREATE TABLE IF NOT EXISTS recurring_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    template_id INTEGER,
    task_title TEXT NOT NULL,
    task_description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    recurring_pattern TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly', 'custom'
    recurrence_interval INTEGER DEFAULT 1, -- Every N days/weeks/months
    next_occurrence_date DATE NOT NULL,
    last_generated_date DATE,
    active BOOLEAN DEFAULT 1,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES task_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Task performance analytics
CREATE TABLE IF NOT EXISTS task_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    completion_date DATE,
    actual_duration REAL,
    estimated_duration REAL,
    on_time_completion BOOLEAN,
    quality_score INTEGER, -- 1-10 scale
    efficiency_rating INTEGER, -- 1-5 scale
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Team collaboration and assignments
CREATE TABLE IF NOT EXISTS task_collaborators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'assignee', 'collaborator', 'observer', 'reviewer'
    permissions TEXT, -- JSON string with permissions
    invited_by TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (invited_by) REFERENCES users(id)
);

-- Performance indexes for efficiency
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_start_time ON task_time_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_farm ON recurring_tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next ON recurring_tasks(next_occurrence_date);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(active);
CREATE INDEX IF NOT EXISTS idx_task_performance_task ON task_performance(task_id);
CREATE INDEX IF NOT EXISTS idx_task_performance_user ON task_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_task_performance_date ON task_performance(completion_date);
CREATE INDEX IF NOT EXISTS idx_task_collaborators_task ON task_collaborators(task_id);
CREATE INDEX IF NOT EXISTS idx_task_collaborators_user ON task_collaborators(user_id);

-- Business rule validation (application level for D1)
-- - Time log validation (no overlapping time entries)
-- - Progress percentage validation (0-100)
-- - Priority score validation (1-10 scale)
-- - Recurrence pattern validation
-- - Dependency validation (no circular dependencies)
-- - Duration validation (positive values only)

-- Pre-populate with common task categories and templates
INSERT OR IGNORE INTO task_templates (farm_id, template_name, category, description, estimated_duration, priority_level) VALUES
(1, 'Daily Animal Feeding', 'Livestock', 'Feed all animals according to schedule', 2.0, 8),
(1, 'Field Irrigation Check', 'Field Management', 'Check irrigation systems and water levels', 1.5, 7),
(1, 'Crop Harvest Preparation', 'Crop Management', 'Prepare equipment and areas for harvest', 3.0, 9),
(1, 'Equipment Maintenance', 'Maintenance', 'Regular equipment check and maintenance', 4.0, 6),
(1, 'Inventory Stock Check', 'Inventory', 'Check and update inventory levels', 2.5, 7);

INSERT OR IGNORE INTO recurring_tasks (farm_id, task_title, task_description, category, recurring_pattern, next_occurrence_date, active) VALUES
(1, 'Daily Animal Feeding', 'Feed all livestock according to schedule', 'Livestock', 'daily', date('now', '+1 day'), 1),
(1, 'Weekly Equipment Check', 'Check all farm equipment for maintenance needs', 'Maintenance', 'weekly', date('now', 'weekday 1'), 1),
(1, 'Monthly Inventory Review', 'Review and update inventory levels', 'Inventory', 'monthly', date('now', 'start of month + 7 days'), 1);

-- Integration points with other modules
-- - Link with animals for livestock care tasks
-- - Link with crops for planting, maintenance, and harvest tasks
-- - Link with fields for field management tasks
-- - Link with inventory for procurement and stock tasks
-- - Link with finance for budget tracking
-- - Link with weather for weather-dependent task scheduling

-- Aggregate views for analytics (using materialized queries via APIs)
-- Note: D1 has limited view support, so complex queries will be handled in APIs