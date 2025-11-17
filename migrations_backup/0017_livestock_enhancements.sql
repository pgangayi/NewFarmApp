-- Migration 0017: Livestock Enhancements
-- Adds pedigree tracking, intake types, movement tracking, and location management
-- Date: November 13, 2025

-- Add pedigree fields to animals table
ALTER TABLE animals ADD COLUMN father_id INTEGER REFERENCES animals(id);
ALTER TABLE animals ADD COLUMN mother_id INTEGER REFERENCES animals(id);

-- Add intake tracking fields
ALTER TABLE animals ADD COLUMN intake_type TEXT CHECK(intake_type IN ('Birth', 'Purchase', 'Transfer'));
ALTER TABLE animals ADD COLUMN intake_date DATE;
ALTER TABLE animals ADD COLUMN purchase_price REAL;
ALTER TABLE animals ADD COLUMN seller_details TEXT;

-- Add location tracking
ALTER TABLE animals ADD COLUMN current_location_id INTEGER REFERENCES locations(id);

-- Create locations table for farm locations (barns, pastures, etc.)
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'barn', 'pasture', 'pen', 'field', etc.
    capacity INTEGER, -- maximum animals
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

-- Create animal movements table for tracking animal location changes
CREATE TABLE IF NOT EXISTS animal_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    source_location_id INTEGER,
    destination_location_id INTEGER NOT NULL,
    movement_date DATE NOT NULL,
    recorded_by TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (source_location_id) REFERENCES locations(id),
    FOREIGN KEY (destination_location_id) REFERENCES locations(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_animals_father ON animals(father_id);
CREATE INDEX IF NOT EXISTS idx_animals_mother ON animals(mother_id);
CREATE INDEX IF NOT EXISTS idx_animals_intake_type ON animals(intake_type);
CREATE INDEX IF NOT EXISTS idx_animals_current_location ON animals(current_location_id);
CREATE INDEX IF NOT EXISTS idx_locations_farm ON locations(farm_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_animal_movements_animal ON animal_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_movements_date ON animal_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_animal_movements_destination ON animal_movements(destination_location_id);

-- Add some default locations for existing farms (optional - farms can add their own)
-- This is commented out as it should be done through the API
-- INSERT INTO locations (farm_id, name, type, description)
-- SELECT id, 'Main Barn', 'barn', 'Default barn location' FROM farms;

-- Update existing animals to have default intake_type if not set
-- This ensures backward compatibility
UPDATE animals SET intake_type = 'Birth' WHERE intake_type IS NULL AND birth_date IS NOT NULL;
UPDATE animals SET intake_type = 'Purchase' WHERE intake_type IS NULL AND birth_date IS NULL;