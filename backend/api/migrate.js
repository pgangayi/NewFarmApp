// Comprehensive Database Migration Script
// Implements safe statement splitting to avoid D1 exec issues
// Includes Migrations 1-5 (Core, Inventory, Ops, Security, Session Mgmt)

function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Security: Run migrations safely by splitting statements
// Helper to bypass env.DB.exec() bugs with complex blocks
async function runSafeMigration(env, schema, name) {
  console.log(`Running migration: ${name}`);
  // Remove comments
  const cleanSchema = schema.replace(/--.*$/gm, "");
  // Split by semicolon, ensuring we don't split inside triggers/logic if we had them (we don't)
  const statements = cleanSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} statements for ${name}...`);

  let executed = 0;
  for (const statement of statements) {
    try {
      await env.DB.prepare(statement).run();
      executed++;
    } catch (e) {
      console.error(`Statement failed in ${name}:`, statement);
      throw new Error(
        `Statement failed in ${name}: "${statement.substring(0, 100)}..." Error: ${e.message}`,
      );
    }
  }
  return executed;
}

export async function onRequest(context) {
  const { request, env } = context;

  // Only allow GET requests
  if (request.method !== "GET") {
    return createResponse({ error: "Method not allowed" }, 405);
  }

  const results = [];

  try {
    if (!env || !env.DB) throw new Error("env.DB is missing");

    // Migration 1: Core Schema
    const coreSchema = `
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS farms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          location TEXT,
          area_hectares REAL,
          metadata TEXT, -- JSON string
          owner_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS farm_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
      );
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
      );
      CREATE TABLE IF NOT EXISTS operations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          idempotency_key TEXT NOT NULL UNIQUE,
          user_id TEXT,
          request_body TEXT,
          response_body TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
      CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id);
      CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id);
    `;
    await runSafeMigration(env, coreSchema, "Migration 1: Core");
    results.push("Migration 1: Success");

    // Migration 2: Inventory & Finance
    const inventorySchema = `
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
      );
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
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );
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
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id);
      CREATE INDEX IF NOT EXISTS idx_finance_entries_farm ON finance_entries(farm_id);
    `;
    await runSafeMigration(env, inventorySchema, "Migration 2: Inventory");
    results.push("Migration 2: Success");

    // Migration 3: Livestock & Tasks
    const livestockSchema = `
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
      );
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
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id);
    `;
    await runSafeMigration(env, livestockSchema, "Migration 3: Livestock");
    results.push("Migration 3: Success");

    // Migration 4 & 5: Security & Sessions (Combined)
    const securitySchema = `
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS user_sessions;
      DROP TABLE IF EXISTS security_events;
      DROP TABLE IF EXISTS login_attempts;
      DROP TABLE IF EXISTS email_verification_tokens;
      DROP TABLE IF EXISTS notifications;

      CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          farm_id INTEGER,
          action TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT,
          old_values TEXT, -- JSON
          new_values TEXT, -- JSON
          ip_address TEXT,
          user_agent TEXT,
          success INTEGER DEFAULT 1,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS security_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          user_id TEXT,
          ip_address TEXT,
          user_agent TEXT,
          details TEXT, -- JSON
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS login_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT,
          ip_address TEXT,
          attempt_count INTEGER DEFAULT 1,
          last_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          locked_until DATETIME
      );
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          farm_id INTEGER,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT,
          read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    `;
    await runSafeMigration(env, securitySchema, "Migration 4+5: Security");
    results.push("Migration 4+5: Success");

    return createResponse({
      message: "Full database migration completed successfully",
      timestamp: new Date().toISOString(),
      migrations: results,
    });
  } catch (error) {
    console.error("Critical Migration Failure:", error);
    return createResponse(
      {
        error: "Migration failed",
        details: error.message,
        stack: error.stack,
      },
      500,
    );
  }
}
