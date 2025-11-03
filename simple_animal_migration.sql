-- Simple Animal Module Migration for Essential Tables
-- Only creates tables that don't exist

-- Create breeds table
CREATE TABLE IF NOT EXISTS breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    name TEXT NOT NULL,
    origin_country TEXT,
    purpose TEXT,
    average_weight REAL,
    temperament TEXT,
    milk_production_daily REAL,
    egg_production_yearly REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal health records table
CREATE TABLE IF NOT EXISTS animal_health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL,
    vet_name TEXT,
    diagnosis TEXT,
    treatment TEXT,
    cost REAL,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal production table
CREATE TABLE IF NOT EXISTS animal_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    production_date DATE NOT NULL,
    production_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    price_per_unit REAL,
    total_value REAL,
    recorded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal breeding table
CREATE TABLE IF NOT EXISTS animal_breeding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    breeding_date DATE NOT NULL,
    sire_id INTEGER,
    breeding_type TEXT NOT NULL,
    breeding_result TEXT,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal pastures table
CREATE TABLE IF NOT EXISTS animal_pastures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    area_hectares REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_breeds_species ON breeds(species);
CREATE INDEX IF NOT EXISTS idx_health_records_animal ON animal_health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_production_animal ON animal_production(animal_id);
CREATE INDEX IF NOT EXISTS idx_breeding_animal ON animal_breeding(animal_id);
CREATE INDEX IF NOT EXISTS idx_pastures_farm ON animal_pastures(farm_id);

-- Insert basic breed data
INSERT OR IGNORE INTO breeds (species, name, origin_country, purpose, average_weight, temperament) VALUES
('goat', 'Matabele', 'Zimbabwe', 'dual-purpose', 50, 'hardy'),
('goat', 'Small East African', 'East Africa', 'dual-purpose', 30, 'resilient'),
('goat', 'Boer', 'South Africa', 'meat', 100, 'docile'),
('goat', 'Kalahari Red', 'South Africa', 'meat', 85, 'hardy'),
('goat', 'Saanen', 'Switzerland', 'dairy', 65, 'docile'),
('cattle', 'Holstein', 'Netherlands', 'dairy', 680, 'docile'),
('cattle', 'Angus', 'Scotland', 'meat', 800, 'calm'),
('chicken', 'Rhode Island Red', 'USA', 'dual-purpose', 3, 'hardy'),
('pig', 'Yorkshire', 'England', 'meat', 150, 'docile'),
('sheep', 'Merino', 'Spain', 'wool', 70, 'docile');