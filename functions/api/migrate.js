export async function onRequest(context) {
  const { env } = context;

  try {
    console.log('🔄 Running comprehensive schema migration...');
    const report = {
      startTime: new Date().toISOString(),
      migrations: [],
      errors: [],
      warnings: []
    };

    // ===== PHASE 1: ENSURE CORE TABLES =====
    console.log('\n📦 PHASE 1: Core Tables');

    // 1. Users table
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      report.migrations.push({ table: 'users', status: '✓ Ready' });
      console.log('✓ Users table');
    } catch (err) {
      report.errors.push({ table: 'users', error: err.message });
      console.error('✗ Users table:', err.message);
    }

    // 2. Farms table with owner_id fix (CRITICAL)
    try {
      const { results: farmSchema } = await env.DB.prepare(
        'PRAGMA table_info(farms)'
      ).all();

      const hasOwnerIdColumn = farmSchema && farmSchema.some(col => col.name === 'owner_id');
      
      if (!hasOwnerIdColumn) {
        console.log('  → Adding missing owner_id column to farms...');
        await env.DB.prepare(`ALTER TABLE farms ADD COLUMN owner_id TEXT`).run();
        report.migrations.push({ table: 'farms', column: 'owner_id', status: '✓ Added (CRITICAL FIX)' });
        console.log('  ✓ owner_id column added');
      } else {
        report.migrations.push({ table: 'farms', column: 'owner_id', status: '✓ Already exists' });
        console.log('✓ Farms table with owner_id');
      }
    } catch (err) {
      report.errors.push({ table: 'farms', error: err.message });
      console.error('✗ Farms fix:', err.message);
    }

    // ===== PHASE 2: MULTI-TENANT SUPPORT =====
    console.log('\n👥 PHASE 2: Multi-Tenant Support');

    // Farm members table
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS farm_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(farm_id, user_id),
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();
      
      // Create indexes
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id)'
      ).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farm_members(user_id)'
      ).run();
      
      report.migrations.push({ table: 'farm_members', status: '✓ Ready' });
      console.log('✓ Farm members table');
    } catch (err) {
      report.errors.push({ table: 'farm_members', error: err.message });
      console.error('✗ Farm members:', err.message);
    }

    // ===== PHASE 3: FIELD & ASSET TABLES =====
    console.log('\n🌾 PHASE 3: Fields & Assets');

    // Fields table
    try {
      await env.DB.prepare(`
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
        )
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id)'
      ).run();
      report.migrations.push({ table: 'fields', status: '✓ Ready' });
      console.log('✓ Fields table');
    } catch (err) {
      report.errors.push({ table: 'fields', error: err.message });
      console.error('✗ Fields:', err.message);
    }

    // Animals table
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS animals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          species TEXT NOT NULL,
          breed TEXT,
          birth_date DATE,
          sex TEXT,
          identification_tag TEXT,
          health_status TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
        )
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id)'
      ).run();
      report.migrations.push({ table: 'animals', status: '✓ Ready' });
      console.log('✓ Animals table');
    } catch (err) {
      report.errors.push({ table: 'animals', error: err.message });
      console.error('✗ Animals:', err.message);
    }

    // ===== PHASE 4: TASK & OPERATION TABLES =====
    console.log('\n✅ PHASE 4: Tasks & Operations');

    // Tasks table
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          priority TEXT NOT NULL DEFAULT 'medium',
          due_date DATE,
          assigned_to TEXT,
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_to) REFERENCES users(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id)'
      ).run();
      report.migrations.push({ table: 'tasks', status: '✓ Ready' });
      console.log('✓ Tasks table');
    } catch (err) {
      report.errors.push({ table: 'tasks', error: err.message });
      console.error('✗ Tasks:', err.message);
    }

    // Operations table
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS operations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          idempotency_key TEXT NOT NULL UNIQUE,
          user_id TEXT,
          request_body TEXT,
          response_body TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_operations_idempotency ON operations(idempotency_key)'
      ).run();
      report.migrations.push({ table: 'operations', status: '✓ Ready' });
      console.log('✓ Operations table');
    } catch (err) {
      report.errors.push({ table: 'operations', error: err.message });
      console.error('✗ Operations:', err.message);
    }

    // ===== PHASE 5: INVENTORY TABLES =====
    console.log('\n📦 PHASE 5: Inventory');

    // Inventory items
    try {
      await env.DB.prepare(`
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
        )
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id)'
      ).run();
      report.migrations.push({ table: 'inventory_items', status: '✓ Ready' });
      console.log('✓ Inventory items table');
    } catch (err) {
      report.errors.push({ table: 'inventory_items', error: err.message });
      console.error('✗ Inventory items:', err.message);
    }

    // Inventory transactions
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_item_id INTEGER NOT NULL,
          farm_id INTEGER NOT NULL,
          qty_delta REAL NOT NULL,
          unit TEXT,
          reason_type TEXT NOT NULL,
          reference_type TEXT,
          reference_id TEXT,
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_inventory_transactions_farm ON inventory_transactions(farm_id)'
      ).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_item_id)'
      ).run();
      report.migrations.push({ table: 'inventory_transactions', status: '✓ Ready' });
      console.log('✓ Inventory transactions table');
    } catch (err) {
      report.errors.push({ table: 'inventory_transactions', error: err.message });
      console.error('✗ Inventory transactions:', err.message);
    }

    // ===== PHASE 6: FINANCIAL TABLES =====
    console.log('\n💰 PHASE 6: Finance');

    // Finance entries
    try {
      await env.DB.prepare(`
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
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_finance_entries_farm ON finance_entries(farm_id)'
      ).run();
      report.migrations.push({ table: 'finance_entries', status: '✓ Ready' });
      console.log('✓ Finance entries table');
    } catch (err) {
      report.errors.push({ table: 'finance_entries', error: err.message });
      console.error('✗ Finance entries:', err.message);
    }

    // ===== PHASE 7: OTHER TABLES =====
    console.log('\n🌐 PHASE 7: Other Tables');

    // Treatments table
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS treatments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          target_type TEXT NOT NULL,
          target_id TEXT NOT NULL,
          notes TEXT,
          applied_at DATETIME NOT NULL,
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_treatments_farm ON treatments(farm_id)'
      ).run();
      report.migrations.push({ table: 'treatments', status: '✓ Ready' });
      console.log('✓ Treatments table');
    } catch (err) {
      report.errors.push({ table: 'treatments', error: err.message });
      console.error('✗ Treatments:', err.message);
    }

    // Weather locations
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS weather_locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          location_name TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          timezone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
        )
      `).run();
      await env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_weather_locations_farm ON weather_locations(farm_id)'
      ).run();
      report.migrations.push({ table: 'weather_locations', status: '✓ Ready' });
      console.log('✓ Weather locations table');
    } catch (err) {
      report.errors.push({ table: 'weather_locations', error: err.message });
      console.error('✗ Weather locations:', err.message);
    }

    // ===== VERIFICATION =====
    console.log('\n🔍 Verification');

    // List all tables
    const { results: tables } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();

    report.completedTime = new Date().toISOString();
    report.tablesCreated = tables.map(t => t.name);
    report.totalTables = tables.length;
    report.summary = {
      migrationsRun: report.migrations.length,
      errorsEncountered: report.errors.length,
      warningsEncountered: report.warnings.length
    };

    console.log(`\n✅ Migration complete! ${tables.length} tables ready.`);

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return new Response(JSON.stringify({
      error: '❌ Migration failed',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
