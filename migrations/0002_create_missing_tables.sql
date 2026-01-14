-- Missing Database Tables Migration
-- Fixes the critical API failures by creating missing tables
-- Date: November 11, 2025

-- Create crops table (referenced in API but missing)
CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farm_id INTEGER NOT NULL,
    field_id INTEGER,
    crop_type TEXT NOT NULL,
    crop_variety TEXT,
    planting_date DATE,
    harvest_date DATE,
    expected_yield REAL,
    actual_yield REAL,
    seeds_used REAL,
    fertilizer_type TEXT,
    irrigation_schedule TEXT,
    pest_control_schedule TEXT,
    soil_preparation TEXT,
    weather_requirements TEXT,
    growth_stage TEXT,
    status TEXT DEFAULT 'active',
    current_weight REAL,
    target_weight REAL,
    health_status TEXT,
    last_inspection_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE SET NULL
);

-- Create breeds table (referenced in animals API but missing)
CREATE TABLE IF NOT EXISTS breeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    name TEXT NOT NULL,
    origin_country TEXT,
    purpose TEXT,
    average_weight REAL,
    temperament TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(species, name)
);

-- crop_activities moved to 0003 to resolve FK dependency on crop_plans
-- crop_observations moved to 0003 to resolve FK dependency on crop_plans

-- Create crop_yield_records table (referenced in crops API)
CREATE TABLE IF NOT EXISTS crop_yield_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    harvest_date DATE NOT NULL,
    total_yield REAL,
    yield_per_hectare REAL,
    revenue REAL,
    quality_grade TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Create irrigation_schedules table (referenced in crops API)
CREATE TABLE IF NOT EXISTS irrigation_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id INTEGER NOT NULL,
    schedule_name TEXT NOT NULL,
    frequency_days INTEGER,
    water_amount REAL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
);

-- Create animal_health_records table (referenced in animals API)
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
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create animal_production table (referenced in animals API)
CREATE TABLE IF NOT EXISTS animal_production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    production_date DATE NOT NULL,
    production_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT,
    quality_grade TEXT,
    price_per_unit REAL,
    total_value REAL,
    market_destination TEXT,
    notes TEXT,
    recorded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Create animal_breeding table (referenced in animals API)
CREATE TABLE IF NOT EXISTS animal_breeding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    breeding_date DATE NOT NULL,
    breeding_type TEXT NOT NULL,
    partner_id INTEGER,
    expected_birth_date DATE,
    actual_birth_date DATE,
    offspring_count INTEGER,
    notes TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES animals(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Add missing columns to existing animals table
-- Note: The seed runs on a fresh local DB; adding columns unconditionally is acceptable here.
ALTER TABLE animals ADD COLUMN current_location TEXT;
ALTER TABLE animals ADD COLUMN pasture_id INTEGER;
ALTER TABLE animals ADD COLUMN production_type TEXT;
ALTER TABLE animals ADD COLUMN current_weight REAL;
ALTER TABLE animals ADD COLUMN target_weight REAL;
ALTER TABLE animals ADD COLUMN vaccination_status TEXT;
ALTER TABLE animals ADD COLUMN last_vet_check DATE;
ALTER TABLE animals ADD COLUMN acquisition_date DATE;
ALTER TABLE animals ADD COLUMN acquisition_cost REAL;
ALTER TABLE animals ADD COLUMN father_id INTEGER;
ALTER TABLE animals ADD COLUMN mother_id INTEGER;
ALTER TABLE animals ADD COLUMN genetic_profile TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crops_farm ON crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_field ON crops(field_id);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON crops(planting_date);

CREATE INDEX IF NOT EXISTS idx_breeds_species ON breeds(species);
CREATE INDEX IF NOT EXISTS idx_breeds_name ON breeds(name);

CREATE INDEX IF NOT EXISTS idx_crop_activities_crop ON crop_activities(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_activities_date ON crop_activities(activity_date);

CREATE INDEX IF NOT EXISTS idx_crop_observations_crop ON crop_observations(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_observations_date ON crop_observations(observation_date);

CREATE INDEX IF NOT EXISTS idx_crop_yield_records_crop ON crop_yield_records(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_yield_records_harvest_date ON crop_yield_records(harvest_date);

CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_crop ON irrigation_schedules(crop_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_active ON irrigation_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_animal_health_records_animal ON animal_health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_health_records_date ON animal_health_records(record_date);

CREATE INDEX IF NOT EXISTS idx_animal_production_animal ON animal_production(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_production_date ON animal_production(production_date);

CREATE INDEX IF NOT EXISTS idx_animal_breeding_animal ON animal_breeding(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_breeding_date ON animal_breeding(breeding_date);

-- Note: sample data like breeds & crops are inserted during E2E seeding to avoid FK issues