import { createSuccessResponse, createErrorResponse } from './_auth.js';

// Complete Database Migration Script
// Applies all schema enhancements to fix 500 errors
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Only allow GET requests to this endpoint
  if (method !== 'GET') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    console.log('Starting database migration...');

    // Apply basic schema if not exists
    await applyBasicSchema(env);
    
    // Apply animal module enhancements
    await applyAnimalSchema(env);
    
    // Apply other module enhancements
    await applyCropsSchema(env);
    await applyWeatherSchema(env);
    await applyFinanceSchema(env);
    
    // Insert initial data
    await insertInitialData(env);

    console.log('Database migration completed successfully');
    
    return createSuccessResponse({
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return createErrorResponse(`Migration failed: ${error.message}`, 500);
  }
}

async function applyBasicSchema(env) {
  console.log('Applying basic schema...');
  
  const basicSchema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Farms table
    CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      area_hectares REAL,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    -- Farm members table
    CREATE TABLE IF NOT EXISTS farm_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;

  await env.DB.exec(basicSchema);
}

async function applyAnimalSchema(env) {
  console.log('Applying animal schema enhancements...');
  
  const animalSchema = `
    -- Enhanced animals table
    CREATE TABLE IF NOT EXISTS animals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      breed TEXT,
      birth_date DATE,
      sex TEXT,
      identification_tag TEXT,
      health_status TEXT DEFAULT 'healthy',
      current_location TEXT,
      pasture_id INTEGER,
      production_type TEXT,
      status TEXT DEFAULT 'active',
      current_weight REAL,
      target_weight REAL,
      vaccination_status TEXT DEFAULT 'up-to-date',
      last_vet_check DATE,
      acquisition_date DATE,
      acquisition_cost REAL,
      father_id INTEGER,
      mother_id INTEGER,
      genetic_profile TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    -- Breeds management table
    CREATE TABLE IF NOT EXISTS breeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species TEXT NOT NULL,
      name TEXT NOT NULL,
      origin_country TEXT,
      purpose TEXT,
      average_weight REAL,
      temperament TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Animal health records
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
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Animal production tracking
    CREATE TABLE IF NOT EXISTS animal_production (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      animal_id INTEGER NOT NULL,
      production_date DATE NOT NULL,
      production_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      price_per_unit REAL,
      total_value REAL,
      notes TEXT,
      recorded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES users(id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
    CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
    CREATE INDEX IF NOT EXISTS idx_breeds_species ON breeds(species);
    CREATE INDEX IF NOT EXISTS idx_health_records_animal ON animal_health_records(animal_id);
    CREATE INDEX IF NOT EXISTS idx_production_animal ON animal_production(animal_id);
  `;

  await env.DB.exec(animalSchema);
}

async function applyCropsSchema(env) {
  console.log('Applying crops schema...');
  
  const cropsSchema = `
    CREATE TABLE IF NOT EXISTS fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      area_hectares REAL,
      crop_type TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );
  `;

  await env.DB.exec(cropsSchema);
}

async function applyWeatherSchema(env) {
  console.log('Applying weather schema...');
  
  const weatherSchema = `
    CREATE TABLE IF NOT EXISTS weather_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL,
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timezone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );
  `;

  await env.DB.exec(weatherSchema);
}

async function applyFinanceSchema(env) {
  console.log('Applying finance schema...');
  
  const financeSchema = `
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sku TEXT,
      qty REAL NOT NULL DEFAULT 0,
      unit TEXT,
      reorder_threshold REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER NOT NULL,
      entry_date DATE NOT NULL DEFAULT (date('now')),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      description TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `;

  await env.DB.exec(financeSchema);
}

async function insertInitialData(env) {
  console.log('Inserting initial breed data...');
  
  const breedData = `
    INSERT OR IGNORE INTO breeds (species, name, origin_country, purpose, average_weight, temperament) VALUES
    ('cattle', 'Holstein', 'Netherlands', 'dairy', 680, 'docile'),
    ('cattle', 'Angus', 'Scotland', 'meat', 800, 'calm'),
    ('cattle', 'Hereford', 'England', 'meat', 720, 'docile'),
    ('cattle', 'Jersey', 'Jersey Island', 'dairy', 450, 'gentle'),
    ('cattle', 'Brahman', 'India', 'dual-purpose', 900, 'resilient'),
    ('chicken', 'Leghorn', 'Italy', 'egg', 2, 'active'),
    ('chicken', 'Rhode Island Red', 'USA', 'dual-purpose', 3, 'hardy'),
    ('chicken', 'Plymouth Rock', 'USA', 'dual-purpose', 3.5, 'friendly'),
    ('chicken', 'Orpington', 'England', 'meat', 4, 'docile'),
    ('chicken', 'Australorp', 'Australia', 'egg', 2.5, 'calm'),
    ('pig', 'Yorkshire', 'England', 'meat', 150, 'docile'),
    ('pig', 'Hampshire', 'USA', 'meat', 140, 'active'),
    ('pig', 'Duroc', 'USA', 'meat', 160, 'friendly'),
    ('sheep', 'Merino', 'Spain', 'wool', 70, 'docile'),
    ('sheep', 'Suffolk', 'England', 'meat', 80, 'alert'),
    ('goat', 'Saanen', 'Switzerland', 'dairy', 65, 'docile'),
    ('goat', 'Boer', 'South Africa', 'meat', 70, 'hardy'),
    ('goat', 'Angora', 'Turkey', 'wool', 50, 'gentle');
  `;

  await env.DB.exec(breedData);
}
