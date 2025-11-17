import { createSuccessResponse, createErrorResponse } from "./_auth.js";

// Simple Database Migration Script
// Creates tables step by step to avoid execution issues
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  // Only allow GET requests to this endpoint
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405);
  }

  try {
    console.log("Starting simple database migration...");

    const results = [];

    // Create tables one by one to avoid complex SQL issues
    console.log("Creating users table...");
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push("users table created");

    console.log("Creating farms table...");
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS farms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        area_hectares REAL,
        metadata TEXT,
        owner_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )
    `);
    results.push("farms table created");

    console.log("Creating farm_members table...");
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS farm_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    results.push("farm_members table created");

    console.log("Creating fields table...");
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        area_hectares REAL,
        area_sqm REAL,
        crop_type TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      )
    `);
    results.push("fields table created");

    console.log("Creating animals table...");
    await env.DB.exec(`
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
        weight REAL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      )
    `);
    results.push("animals table created");

    console.log("Creating tasks table...");
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date DATE,
        completed_date DATE,
        assigned_to TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    results.push("tasks table created");

    console.log("Creating inventory_items table...");
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        sku TEXT,
        qty REAL NOT NULL DEFAULT 0,
        unit TEXT,
        reorder_threshold REAL DEFAULT 0,
        supplier_info TEXT,
        cost_per_unit REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      )
    `);
    results.push("inventory_items table created");

    console.log("Creating finance_entries table...");
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS finance_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farm_id INTEGER NOT NULL,
        entry_date DATE NOT NULL DEFAULT (date('now')),
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        account TEXT,
        description TEXT,
        reference_type TEXT,
        reference_id TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    results.push("finance_entries table created");

    // Create basic indexes
    console.log("Creating indexes...");
    await env.DB.exec(
      `CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id)`
    );
    await env.DB.exec(
      `CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id)`
    );
    await env.DB.exec(
      `CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farm_members(user_id)`
    );
    await env.DB.exec(
      `CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id)`
    );
    await env.DB.exec(
      `CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id)`
    );
    await env.DB.exec(
      `CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id)`
    );
    await env.DB.exec(
      `CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id)`
    );
    await env.DB.exec(
      `CREATE INDEX IF NOT EXISTS idx_finance_entries_farm ON finance_entries(farm_id)`
    );
    results.push("indexes created");

    console.log("Simple database migration completed successfully");

    return createSuccessResponse({
      message: "Simple database migration completed successfully",
      tables_created: results.length,
      results: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return createErrorResponse(`Migration failed: ${error.message}`, 500);
  }
}
