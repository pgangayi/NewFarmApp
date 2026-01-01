-- Migration 0028: Pest and Disease Records
-- Date: January 1, 2026
-- Supports pest and disease management

CREATE TABLE IF NOT EXISTS pest_disease_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id TEXT NOT NULL,
    field_id TEXT,
    crop_id TEXT,
    type TEXT NOT NULL, -- 'pest' or 'disease'
    name TEXT NOT NULL,
    severity TEXT, -- 'low', 'medium', 'high', 'critical'
    status TEXT DEFAULT 'active', -- 'active', 'resolved', 'monitoring'
    detection_date DATE,
    description TEXT,
    treatment_plan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
