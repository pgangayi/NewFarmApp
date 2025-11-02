-- Animal Module Schema Enhancements
-- Phase 1: Database Schema with Comprehensive Breed Management
-- Date: October 31, 2025

-- Enhanced animals table with additional fields
ALTER TABLE animals ADD COLUMN acquisition_date DATE;
ALTER TABLE animals ADD COLUMN acquisition_cost REAL;
ALTER TABLE animals ADD COLUMN current_weight REAL;
ALTER TABLE animals ADD COLUMN target_weight REAL;
ALTER TABLE animals ADD COLUMN vaccination_status TEXT DEFAULT 'up-to-date';
ALTER TABLE animals ADD COLUMN last_vet_check DATE;
ALTER TABLE animals ADD COLUMN current_location TEXT;
ALTER TABLE animals ADD COLUMN pasture_id INTEGER;
ALTER TABLE animals ADD COLUMN production_type TEXT; -- 'meat', 'milk', 'eggs', 'wool', 'breeding', 'companion'
ALTER TABLE animals ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased', 'slaughtered', 'breeding', 'retired'));
ALTER TABLE animals ADD COLUMN father_id INTEGER;
ALTER TABLE animals ADD COLUMN mother_id INTEGER;
ALTER TABLE animals ADD COLUMN genetic_profile TEXT; -- JSON string for genetic data

-- Breeds management table
CREATE TABLE IF NOT EXISTS breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    name TEXT NOT NULL,
    origin_country TEXT,
    purpose TEXT, -- 'dairy', 'meat', 'dual-purpose', 'companion', 'working'
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

-- Animal health records
CREATE TABLE IF NOT EXISTS animal_health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL, -- 'vaccination', 'vet_visit', 'illness', 'treatment', 'checkup'
    vet_name TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medication TEXT,
    dosage TEXT,
    cost REAL,
    next_due_date DATE,
    vet_contact TEXT,
    notes TEXT,
    attachments TEXT, -- JSON array of file paths
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Animal production tracking
CREATE TABLE IF NOT EXISTS animal_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    production_date DATE NOT NULL,
    production_type TEXT NOT NULL, -- 'milk', 'eggs', 'wool', 'meat', 'offspring'
    quantity REAL NOT NULL,
    unit TEXT NOT NULL, -- 'liters', 'pieces', 'kg', 'head'
    quality_grade TEXT, -- 'A', 'B', 'C', 'premium', 'standard'
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

-- Animal breeding records
CREATE TABLE IF NOT EXISTS animal_breeding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL, -- Female animal
    breeding_date DATE NOT NULL,
    sire_id INTEGER, -- Father animal ID
    breeding_type TEXT NOT NULL, -- 'natural', 'artificial', 'embryo_transfer'
    breeding_fee REAL,
    expected_calving_date DATE,
    actual_calving_date DATE,
    breeding_result TEXT, -- 'pregnant', 'not_pregnant', 'unknown'
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

-- Offspring tracking
CREATE TABLE IF NOT EXISTS animal_offspring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_female_id INTEGER NOT NULL,
    parent_male_id INTEGER,
    birth_date DATE NOT NULL,
    animal_id INTEGER, -- Link to actual animal record if kept
    offspring_type TEXT, -- 'calf', 'piglet', 'lamb', 'kid', 'chick'
    sex TEXT, -- 'male', 'female'
    birth_weight REAL,
    birth_notes TEXT,
    survival_status TEXT DEFAULT 'alive', -- 'alive', 'dead', 'sold', 'weaned'
    weaning_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_female_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_male_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (animal_id) REFERENCES animals(id)
);

-- Pastures/Fields for animal management
CREATE TABLE IF NOT EXISTS animal_pastures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    area_hectares REAL,
    pasture_type TEXT, -- 'grassland', 'scrub', 'crop_residue', 'managed_pasture'
    grass_species TEXT,
    capacity_animals INTEGER,
    rotation_schedule TEXT, -- JSON schedule
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

-- Animal movements/relocations
CREATE TABLE IF NOT EXISTS animal_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    from_location TEXT,
    to_location TEXT,
    from_pasture_id INTEGER,
    to_pasture_id INTEGER,
    movement_date DATE NOT NULL,
    movement_reason TEXT, -- 'rotation', 'treatment', 'breeding', 'sale', 'purchase'
    notes TEXT,
    moved_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (moved_by) REFERENCES users(id)
);

-- Feed and nutrition tracking
CREATE TABLE IF NOT EXISTS animal_feeding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    feeding_date DATE NOT NULL,
    feed_type TEXT NOT NULL, -- 'pasture', 'hay', 'grain', 'supplement', 'silage'
    feed_name TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL, -- 'kg', 'bales', 'liters'
    cost_per_unit REAL,
    total_cost REAL,
    feeding_method TEXT, -- 'free_access', 'controlled', 'supplemental'
    nutritional_notes TEXT,
    recorded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Create comprehensive indexes for performance
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_breed ON animals(breed);
CREATE INDEX IF NOT EXISTS idx_animals_health_status ON animals(health_status);
CREATE INDEX IF NOT EXISTS idx_animals_location ON animals(current_location);
CREATE INDEX IF NOT EXISTS idx_animals_production_type ON animals(production_type);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_pasture ON animals(pasture_id);
CREATE INDEX IF NOT EXISTS idx_animals_father ON animals(father_id);
CREATE INDEX IF NOT EXISTS idx_animals_mother ON animals(mother_id);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_breeds_species ON breeds(species);
CREATE INDEX IF NOT EXISTS idx_breeds_name ON breeds(name);

CREATE INDEX IF NOT EXISTS idx_health_records_animal ON animal_health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON animal_health_records(record_date);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON animal_health_records(record_type);

CREATE INDEX IF NOT EXISTS idx_production_animal ON animal_production(animal_id);
CREATE INDEX IF NOT EXISTS idx_production_date ON animal_production(production_date);
CREATE INDEX IF NOT EXISTS idx_production_type ON animal_production(production_type);

CREATE INDEX IF NOT EXISTS idx_breeding_animal ON animal_breeding(animal_id);
CREATE INDEX IF NOT EXISTS idx_breeding_sire ON animal_breeding(sire_id);
CREATE INDEX IF NOT EXISTS idx_breeding_date ON animal_breeding(breeding_date);

CREATE INDEX IF NOT EXISTS idx_offspring_parent_female ON animal_offspring(parent_female_id);
CREATE INDEX IF NOT EXISTS idx_offspring_birth_date ON animal_offspring(birth_date);

CREATE INDEX IF NOT EXISTS idx_pastures_farm ON animal_pastures(farm_id);

CREATE INDEX IF NOT EXISTS idx_movements_animal ON animal_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON animal_movements(movement_date);

CREATE INDEX IF NOT EXISTS idx_feeding_animal ON animal_feeding(animal_id);
CREATE INDEX IF NOT EXISTS idx_feeding_date ON animal_feeding(feeding_date);

-- Insert common breed data
INSERT INTO breeds (species, name, origin_country, purpose, average_weight, temperament, milk_production_daily, egg_production_yearly) VALUES
('cattle', 'Holstein', 'Netherlands', 'dairy', 680, 'docile', 30, NULL),
('cattle', 'Angus', 'Scotland', 'meat', 800, 'calm', NULL, NULL),
('cattle', 'Hereford', 'England', 'meat', 720, 'docile', NULL, NULL),
('cattle', 'Jersey', 'Jersey Island', 'dairy', 450, 'gentle', 20, NULL),
('cattle', 'Brahman', 'India', 'dual-purpose', 900, 'resilient', 15, NULL),

('chicken', 'Leghorn', 'Italy', 'egg', 2, 'active', NULL, 280),
('chicken', 'Rhode Island Red', 'USA', 'dual-purpose', 3, 'hardy', NULL, 250),
('chicken', 'Plymouth Rock', 'USA', 'dual-purpose', 3.5, 'friendly', NULL, 240),
('chicken', 'Orpington', 'England', 'meat', 4, 'docile', NULL, 200),
('chicken', 'Australorp', 'Australia', 'egg', 2.5, 'calm', NULL, 300),

('pig', 'Yorkshire', 'England', 'meat', 150, 'docile', NULL, NULL),
('pig', 'Hampshire', 'USA', 'meat', 140, 'active', NULL, NULL),
('pig', 'Duroc', 'USA', 'meat', 160, 'friendly', NULL, NULL),
('pig', 'Landrace', 'Denmark', 'meat', 130, 'calm', NULL, NULL),
('pig', 'Berkshire', 'England', 'meat', 145, 'intelligent', NULL, NULL),

('sheep', 'Merino', 'Spain', 'wool', 70, 'docile', NULL, NULL),
('sheep', 'Suffolk', 'England', 'meat', 80, 'alert', NULL, NULL),
('sheep', 'Dorper', 'South Africa', 'meat', 70, 'resilient', NULL, NULL),
('sheep', 'Hampshire Down', 'England', 'meat', 85, 'calm', NULL, NULL),
('sheep', 'Jacob', 'England', 'wool', 60, 'independent', NULL, NULL),

('goat', 'Saanen', 'Switzerland', 'dairy', 65, 'docile', 3, NULL),
('goat', 'Alpine', 'France', 'dairy', 60, 'active', 2.5, NULL),
('goat', 'Boer', 'South Africa', 'meat', 70, 'hardy', NULL, NULL),
('goat', 'Angora', 'Turkey', 'wool', 50, 'gentle', NULL, NULL),
('goat', 'Nubian', 'Africa', 'dual-purpose', 65, 'vocal', 2, NULL);

-- Update foreign key constraints
ALTER TABLE animals ADD CONSTRAINT fk_animals_father FOREIGN KEY (father_id) REFERENCES animals(id);
ALTER TABLE animals ADD CONSTRAINT fk_animals_mother FOREIGN KEY (mother_id) REFERENCES animals(id);
ALTER TABLE animals ADD CONSTRAINT fk_animals_pasture FOREIGN KEY (pasture_id) REFERENCES animal_pastures(id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_breeds_timestamp AFTER UPDATE ON breeds
BEGIN
    UPDATE breeds SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_health_records_timestamp AFTER UPDATE ON animal_health_records
BEGIN
    UPDATE animal_health_records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_pastures_timestamp AFTER UPDATE ON animal_pastures
BEGIN
    UPDATE animal_pastures SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Helper views for common queries
CREATE VIEW IF NOT EXISTS animal_summary AS
SELECT 
    a.id,
    a.name,
    a.species,
    b.name as breed_name,
    a.sex,
    a.age_months,
    a.health_status,
    a.current_location,
    ap.name as pasture_name,
    a.production_type,
    a.status,
    f.name as farm_name,
    COUNT(hr.id) as health_records_count,
    COUNT(pr.id) as production_records_count,
    a.created_at,
    a.updated_at
FROM animals a
LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
LEFT JOIN animal_pastures ap ON a.pasture_id = ap.id
LEFT JOIN farms f ON a.farm_id = f.id
LEFT JOIN animal_health_records hr ON a.id = hr.animal_id
LEFT JOIN animal_production pr ON a.id = pr.animal_id
GROUP BY a.id;

CREATE VIEW IF NOT EXISTS breed_statistics AS
SELECT 
    b.species,
    b.name as breed_name,
    COUNT(a.id) as animal_count,
    AVG(a.age_months) as avg_age_months,
    COUNT(CASE WHEN a.sex = 'female' THEN 1 END) as female_count,
    COUNT(CASE WHEN a.sex = 'male' THEN 1 END) as male_count,
    COUNT(CASE WHEN a.health_status = 'healthy' THEN 1 END) as healthy_count,
    SUM(pr.quantity) as total_production,
    b.purpose,
    b.average_weight
FROM breeds b
LEFT JOIN animals a ON a.breed = b.name AND a.species = b.species
LEFT JOIN animal_production pr ON a.id = pr.animal_id
GROUP BY b.id;