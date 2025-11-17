-- Migration 0023: Livestock Records Enhancements
-- Adds feeding records table and aligns production/breeding schemas used by the livestock APIs.
-- Date: November 20, 2025

-- Add storage location support for production tracking
ALTER TABLE animal_production ADD COLUMN storage_location TEXT;

-- Expand breeding metadata
ALTER TABLE animal_breeding ADD COLUMN breeding_fee REAL;
ALTER TABLE animal_breeding ADD COLUMN breeding_result TEXT;
ALTER TABLE animal_breeding ADD COLUMN vet_supervision INTEGER DEFAULT 0;

-- Comprehensive feeding records table
CREATE TABLE IF NOT EXISTS animal_feeding_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    feeding_date DATE NOT NULL,
    feed_type TEXT NOT NULL,
    ration_details TEXT,
    quantity REAL NOT NULL,
    unit TEXT,
    feeding_method TEXT,
    nutrition_notes TEXT,
    cost REAL,
    recorded_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_animal_feeding_animal ON animal_feeding_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_feeding_date ON animal_feeding_records(feeding_date);
