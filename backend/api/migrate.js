import { createSuccessResponse, createErrorResponse } from "./_auth.js";

// Clean Database Migration Script
// Executes embedded SQL migrations in proper order
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Only allow GET requests to this endpoint
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405);
  }

  try {
    console.log("Starting clean database migration...");

    const results = [];

    // Migration 1: Core Schema
    console.log("Executing Migration 1: Core Schema");
    const coreSchema = `
      -- Core Database Schema Migration
      -- Date: November 15, 2025
      -- Rebuilding from scratch with proper structure

      -- Users table (replaces Supabase auth.users)
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, -- Using TEXT for UUID compatibility
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Farms table (core entity)
      CREATE TABLE IF NOT EXISTS farms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL, -- Will be used as farm_name in queries
          location TEXT,
          area_hectares REAL,
          metadata TEXT, -- JSON string instead of JSONB
          owner_id TEXT NOT NULL, -- References users.id
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id)
      );

      -- Farm members table (for user permissions)
      CREATE TABLE IF NOT EXISTS farm_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL, -- 'owner', 'manager', 'worker', 'accounting', 'admin'
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Fields table (for field management)
      CREATE TABLE IF NOT EXISTS fields (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          area_hectares REAL, -- Keeping as hectares for consistency
          area_sqm REAL, -- Adding sqm field for queries expecting it
          crop_type TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Operations table for idempotency
      CREATE TABLE IF NOT EXISTS operations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          idempotency_key TEXT NOT NULL UNIQUE,
          user_id TEXT,
          request_body TEXT, -- JSON string instead of JSONB
          response_body TEXT, -- JSON string instead of JSONB
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Create basic indexes
      CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
      CREATE INDEX IF NOT EXISTS idx_farm_members_farm ON farm_members(farm_id);
      CREATE INDEX IF NOT EXISTS idx_farm_members_user ON farm_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_fields_farm ON fields(farm_id);
      CREATE INDEX IF NOT EXISTS idx_operations_idempotency ON operations(idempotency_key);
    `;

    await env.DB.exec(coreSchema);
    results.push({ migration: "Core Schema", status: "success" });

    // Migration 2: Inventory and Finance
    console.log("Executing Migration 2: Inventory and Finance");
    const inventoryFinanceSchema = `
      -- Inventory and Finance Tables Migration
      -- Date: November 15, 2025
      -- Adding inventory, finance, and related functionality

      -- Inventory items table
      CREATE TABLE IF NOT EXISTS inventory_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          sku TEXT,
          qty REAL NOT NULL DEFAULT 0,
          unit TEXT,
          reorder_threshold REAL DEFAULT 0,
          supplier_info TEXT, -- JSON string for supplier details
          cost_per_unit REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Inventory transactions table (single source of truth)
      CREATE TABLE IF NOT EXISTS inventory_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_item_id INTEGER NOT NULL,
          farm_id INTEGER NOT NULL,
          qty_delta REAL NOT NULL, -- Positive for additions, negative for usage
          unit TEXT,
          reason_type TEXT NOT NULL, -- 'treatment', 'purchase', 'usage', 'adjustment'
          reference_type TEXT,
          reference_id TEXT, -- Could reference treatments.id or other entities
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Finance entries table
      CREATE TABLE IF NOT EXISTS finance_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          entry_date DATE NOT NULL DEFAULT (date('now')),
          type TEXT NOT NULL, -- 'income', 'expense', 'investment'
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
      );

      -- Inventory alert system
      CREATE TABLE IF NOT EXISTS inventory_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inventory_item_id INTEGER NOT NULL,
          alert_type TEXT NOT NULL, -- 'low_stock', 'expired', 'overstock'
          alert_date DATE NOT NULL,
          current_quantity REAL NOT NULL,
          threshold_quantity REAL NOT NULL,
          severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
          resolved INTEGER DEFAULT 0,
          resolved_date DATE,
          resolved_by TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
      );

      -- Inventory suppliers
      CREATE TABLE IF NOT EXISTS inventory_suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          contact_person TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          payment_terms TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Treatments table (for treatment application)
      CREATE TABLE IF NOT EXISTS treatments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          target_type TEXT NOT NULL, -- 'crop', 'field', 'animal'
          target_id TEXT NOT NULL, -- Reference to specific entity
          treatment_type TEXT,
          product_used TEXT,
          notes TEXT,
          applied_at DATETIME NOT NULL,
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_inventory_items_farm ON inventory_items(farm_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_farm ON inventory_transactions(farm_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
      CREATE INDEX IF NOT EXISTS idx_finance_entries_farm ON finance_entries(farm_id);
      CREATE INDEX IF NOT EXISTS idx_treatments_farm ON treatments(farm_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_alerts_item ON inventory_alerts(inventory_item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_suppliers_name ON inventory_suppliers(name);
    `;

    await env.DB.exec(inventoryFinanceSchema);
    results.push({ migration: "Inventory and Finance", status: "success" });

    // Migration 3: Crops, Livestock, and Tasks
    console.log("Executing Migration 3: Crops, Livestock, and Tasks");
    const cropsLivestockTasksSchema = `
      -- Crops, Livestock, and Tasks Migration
      -- Date: November 15, 2025
      -- Adding agricultural and operational functionality

      -- Animals table (for livestock management)
      CREATE TABLE IF NOT EXISTS animals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          species TEXT NOT NULL, -- 'cow', 'chicken', 'pig', etc.
          breed TEXT,
          birth_date DATE,
          sex TEXT, -- 'male', 'female'
          identification_tag TEXT,
          health_status TEXT DEFAULT 'healthy',
          weight REAL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Tasks table (for task management)
      CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
          priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
          due_date DATE,
          completed_date DATE,
          assigned_to TEXT,
          created_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_to) REFERENCES users(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
      );

      -- Weather location table (for weather data)
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

      -- Farm statistics (for analytics)
      CREATE TABLE IF NOT EXISTS farm_statistics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          report_date DATE NOT NULL,
          total_animals INTEGER DEFAULT 0,
          total_acres_under_cultivation REAL DEFAULT 0,
          annual_revenue REAL DEFAULT 0,
          total_operational_cost REAL DEFAULT 0,
          profit_margin REAL DEFAULT 0,
          employee_count INTEGER DEFAULT 0,
          productivity_score REAL DEFAULT 0,
          sustainability_score REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Farm operations (for operational tracking)
      CREATE TABLE IF NOT EXISTS farm_operations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          operation_type TEXT NOT NULL, -- 'planting', 'harvesting', 'irrigation', 'fertilizing'
          target_type TEXT, -- 'field', 'crop', 'area'
          target_id TEXT,
          operation_date DATE NOT NULL,
          description TEXT,
          cost REAL DEFAULT 0,
          duration_hours REAL,
          equipment_used TEXT,
          performed_by TEXT,
          status TEXT DEFAULT 'completed',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (performed_by) REFERENCES users(id)
      );

      -- Crop planning system
      CREATE TABLE IF NOT EXISTS crop_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          field_id INTEGER NOT NULL,
          plan_name TEXT NOT NULL,
          crop_type TEXT NOT NULL,
          planting_date DATE NOT NULL,
          expected_harvest_date DATE,
          expected_yield_per_sqm REAL NOT NULL,
          expected_price_per_unit REAL NOT NULL,
          projected_revenue REAL NOT NULL,
          projected_cost REAL NOT NULL,
          projected_profit REAL NOT NULL,
          status TEXT DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
      );

      -- Crop activities
      CREATE TABLE IF NOT EXISTS crop_activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          crop_plan_id INTEGER NOT NULL,
          activity_type TEXT NOT NULL, -- 'planting', 'fertilizing', 'watering', 'pest_control', 'harvesting'
          activity_date DATE NOT NULL,
          description TEXT,
          cost_per_unit REAL DEFAULT 0,
          units_used_per_sqm REAL DEFAULT 0,
          total_cost REAL DEFAULT 0,
          performed_by TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (crop_plan_id) REFERENCES crop_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (performed_by) REFERENCES users(id)
      );

      -- Crop observations
      CREATE TABLE IF NOT EXISTS crop_observations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          crop_plan_id INTEGER NOT NULL,
          observation_date DATE NOT NULL,
          health_status TEXT, -- 'excellent', 'good', 'fair', 'poor', 'critical'
          growth_stage TEXT,
          height_cm REAL,
          pest_presence INTEGER DEFAULT 0, -- boolean
          disease_signs TEXT,
          soil_moisture_level TEXT,
          weather_conditions TEXT,
          notes TEXT,
          observer_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (crop_plan_id) REFERENCES crop_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (observer_id) REFERENCES users(id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks(farm_id);
      CREATE INDEX IF NOT EXISTS idx_weather_locations_farm ON weather_locations(farm_id);
      CREATE INDEX IF NOT EXISTS idx_farm_statistics_farm ON farm_statistics(farm_id);
      CREATE INDEX IF NOT EXISTS idx_farm_operations_farm ON farm_operations(farm_id);
      CREATE INDEX IF NOT EXISTS idx_crop_plans_farm ON crop_plans(farm_id);
      CREATE INDEX IF NOT EXISTS idx_crop_plans_field ON crop_plans(field_id);
      CREATE INDEX IF NOT EXISTS idx_crop_activities_plan ON crop_activities(crop_plan_id);
      CREATE INDEX IF NOT EXISTS idx_crop_observations_plan ON crop_observations(crop_plan_id);
    `;

    await env.DB.exec(cropsLivestockTasksSchema);
    results.push({
      migration: "Crops, Livestock, and Tasks",
      status: "success",
    });

    // Migration 4: Security and Authentication
    console.log("Executing Migration 4: Security and Authentication");
    const securityAuthSchema = `
      -- Security and Authentication Migration
      -- Date: November 15, 2025
      -- Adding security, auth, and audit functionality

      -- Audit logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          farm_id INTEGER,
          action TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT,
          old_values TEXT, -- JSON string
          new_values TEXT, -- JSON string
          ip_address TEXT,
          user_agent TEXT,
          success INTEGER DEFAULT 1, -- boolean
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Password reset tokens
      CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          used INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- MFA tables removed - simplified authentication system

      -- Token management for sessions
      CREATE TABLE IF NOT EXISTS user_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          token_type TEXT NOT NULL, -- 'access', 'refresh', 'reset'
          expires_at DATETIME NOT NULL,
          revoked INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          farm_id INTEGER,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
          category TEXT, -- 'system', 'inventory', 'finance', 'crops', 'livestock'
          read INTEGER DEFAULT 0,
          action_url TEXT,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      );

      -- Bulk operations tracking
      CREATE TABLE IF NOT EXISTS bulk_operations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          farm_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          operation_type TEXT NOT NULL, -- 'inventory_update', 'finance_bulk_entry', etc.
          status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
          total_items INTEGER NOT NULL,
          processed_items INTEGER DEFAULT 0,
          failed_items INTEGER DEFAULT 0,
          results TEXT, -- JSON string with operation results
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- System settings
      CREATE TABLE IF NOT EXISTS system_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          setting_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
          description TEXT,
          updated_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      -- Create indexes for performance and security
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_farm ON audit_logs(farm_id);
      CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
      CREATE INDEX IF NOT EXISTS idx_user_tokens_user ON user_tokens(user_id);
      -- MFA index removed - simplified authentication system
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_bulk_operations_farm ON bulk_operations(farm_id);
      CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
    `;

    await env.DB.exec(securityAuthSchema);
    results.push({
      migration: "Security and Authentication",
      status: "success",
    });

    console.log("All database migrations completed successfully");

    return createSuccessResponse({
      message: "Clean database migration completed successfully",
      migrations_executed: results,
      tables_created: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return createErrorResponse(`Migration failed: ${error.message}`, 500);
  }
}
