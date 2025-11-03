-- Safe Animal Module Schema Enhancements
-- Only adds columns that don't exist

-- Check and add columns that may be missing
ALTER TABLE animals ADD COLUMN IF NOT EXISTS acquisition_date DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS acquisition_cost REAL;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS current_weight REAL;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS target_weight REAL;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS vaccination_status TEXT DEFAULT 'up-to-date';
ALTER TABLE animals ADD COLUMN IF NOT EXISTS last_vet_check DATE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS current_location TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS pasture_id INTEGER;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS production_type TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS father_id INTEGER;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS mother_id INTEGER;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS genetic_profile TEXT;

-- Add status column only if it doesn't exist
ALTER TABLE animals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create new tables
CREATE TABLE IF NOT EXISTS breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    name TEXT NOT NULL,
    origin_country TEXT,
    purpose TEXT,
    average_weight REAL,
    average_height REAL,
    lifespan_years REAL,
    temperament TEXT,
    special_requirements TEXT,
    milk_production_daily REAL,
    egg_production_yearly REAL,
    wool_production_yearly REAL,
    feed_requirements TEXT,
    health_considerations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animal_health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL,
    vet_name TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    dosage TEXT,
    cost REAL,
    next_due_date DATE,
    vet_contact TEXT,
    notes TEXT,
    attachments TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS animal_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    production_date DATE NOT NULL,
    production_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    quality_grade TEXT,
    price_per_unit REAL,
    total_value REAL,
    market_destination TEXT,
    storage_location TEXT,
    notes TEXT,
    recorded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS animal_breeding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    breeding_date DATE NOT NULL,
    sire_id INTEGER,
    breeding_type TEXT NOT NULL,
    breeding_fee REAL,
    expected_calving_date DATE,
    actual_calving_date DATE,
    breeding_result TEXT,
    offspring_count INTEGER,
    breeding_notes TEXT,
    vet_supervision BOOLEAN DEFAULT 0,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (sire_id) REFERENCES animals(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS animal_pastures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    area_hectares REAL,
    pasture_type TEXT,
    grass_species TEXT,
    capacity_animals INTEGER,
    rotation_schedule TEXT,
    last_rotation_date DATE,
    soil_type TEXT,
    water_access BOOLEAN DEFAULT 1,
    shelter_available BOOLEAN DEFAULT 0,
    grazing_restrictions TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS animal_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    from_location TEXT,
    to_location TEXT,
    from_pasture_id INTEGER,
    to_pasture_id INTEGER,
    movement_date DATE NOT NULL,
    movement_reason TEXT,
    notes TEXT,
    moved_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (moved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS animal_feeding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    feeding_date DATE NOT NULL,
    feed_type TEXT NOT NULL,
    feed_name TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit REAL,
    total_cost REAL,
    feeding_method TEXT,
    nutritional_notes TEXT,
    recorded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_breed ON animals(breed);
CREATE INDEX IF NOT EXISTS idx_animals_health_status ON animals(health_status);
CREATE INDEX IF NOT EXISTS idx_animals_location ON animals(current_location);
CREATE INDEX IF NOT EXISTS idx_animals_production_type ON animals(production_type);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_pasture ON animals(pasture_id);
CREATE INDEX IF NOT EXISTS idx_animals_father ON animals(father_id);
CREATE INDEX IF NOT EXISTS idx_animals_mother ON animals(mother_id);

CREATE INDEX IF NOT EXISTS idx_breeds_species ON breeds(species);
CREATE INDEX IF NOT EXISTS idx_breeds_name ON breeds(name);
CREATE INDEX IF NOT EXISTS idx_health_records_animal ON animal_health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_production_animal ON animal_production(animal_id);
CREATE INDEX IF NOT EXISTS idx_breeding_animal ON animal_breeding(animal_id);
CREATE INDEX IF NOT EXISTS idx_pastures_farm ON animal_pastures(farm_id);
CREATE INDEX IF NOT EXISTS idx_movements_animal ON animal_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_feeding_animal ON animal_feeding(animal_id);

-- Insert breed data (skip if already exists)
INSERT OR IGNORE INTO breeds (species, name, origin_country, purpose, average_weight, temperament, milk_production_daily, egg_production_yearly) VALUES
('goat', 'Matabele', 'Zimbabwe', 'dual-purpose', 50, 'hardy', 1, NULL),
('goat', 'Small East African', 'East Africa', 'dual-purpose', 30, 'resilient', 0.8, NULL),
('goat', 'Boer', 'South Africa', 'meat', 100, 'docile', 1.5, NULL),
('goat', 'Kalahari Red', 'South Africa', 'meat', 85, 'hardy', 1.2, NULL),
('goat', 'Saanen', 'Switzerland', 'dairy', 65, 'docile', 3, NULL),
('cattle', 'Holstein', 'Netherlands', 'dairy', 680, 'docile', 30, NULL),
('cattle', 'Angus', 'Scotland', 'meat', 800, 'calm', NULL, NULL),
('chicken', 'Rhode Island Red', 'USA', 'dual-purpose', 3, 'hardy', NULL, 250),
('pig', 'Yorkshire', 'England', 'meat', 150, 'docile', NULL, NULL),
('sheep', 'Merino', 'Spain', 'wool', 70, 'docile', NULL, NULL);

-- Add constraints if they don't exist
PRAGMA foreign_keys = ON;
PRAGMA foreign_key_check;