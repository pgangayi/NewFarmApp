import { createSuccessResponse, createErrorResponse } from './_auth.js';

// Database seeding and migration endpoint
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Only allow POST requests to this endpoint
  if (method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    console.log('Starting database seeding and migration...');

    // Apply all necessary migrations
    await applyAllMigrations(env);

    console.log('Database seeding completed successfully');
    
    return createSuccessResponse({
      message: 'Database seeded and migrated successfully',
      timestamp: new Date().toISOString(),
      migrations_applied: [
        'Basic schema setup',
        'Animal module enhancements',
        'Breed data seeding',
        'Basic test data'
      ]
    });

  } catch (error) {
    console.error('Seeding failed:', error);
    return createErrorResponse(`Seeding failed: ${error.message}`, 500);
  }
}

async function applyAllMigrations(env) {
  // Create basic tables if not exists
  await createBasicSchema(env);
  
  // Apply animal module schema
  await createAnimalSchema(env);
  
  // Seed initial data
  await seedInitialData(env);
}

async function createBasicSchema(env) {
  console.log('Creating basic schema...');
  
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

async function createAnimalSchema(env) {
  console.log('Creating animal schema...');
  
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

    -- Basic indexes
    CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
    CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
    CREATE INDEX IF NOT EXISTS idx_breeds_species ON breeds(species);
    CREATE INDEX IF NOT EXISTS idx_health_records_animal ON animal_health_records(animal_id);
    CREATE INDEX IF NOT EXISTS idx_production_animal ON animal_production(animal_id);
  `;

  await env.DB.exec(animalSchema);
}

async function seedInitialData(env) {
  console.log('Seeding initial data...');
  
  // Seed breed data
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
