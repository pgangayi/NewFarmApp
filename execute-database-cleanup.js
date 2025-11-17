#!/usr/bin/env node

// Direct Database Cleanup Script
// Executes the database cleanup without needing the full server
// Date: November 15, 2025

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Read environment variables
import * as dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });

// Simple D1 database connection for cleanup
class SimpleDBCleanup {
  constructor() {
    this.database_id = "106c9d2b-c97a-483e-9eff-e713150d8a9a"; // From wrangler.toml
  }

  async executeSQL(sql, params = []) {
    try {
      // Try to use wrangler CLI to execute SQL
      const { execSync } = require("child_process");

      // Create a temporary SQL file
      const fs = require("fs");
      const tempFile = "./temp_cleanup.sql";
      fs.writeFileSync(tempFile, sql);

      // Execute using wrangler
      const command = `cd backend && npx wrangler d1 execute farmers-boot-local --file=../${tempFile} --local --command="${sql}"`;

      try {
        const result = execSync(command, {
          encoding: "utf8",
          stdio: "pipe",
        });
        console.log("✓ SQL executed successfully");
        return { success: true, result };
      } catch (error) {
        // If wrangler fails, provide manual SQL
        console.log(
          "⚠️  Direct execution not available. Manual steps provided below."
        );
        return { success: false, manual: true, sql };
      }
    } catch (error) {
      console.error("❌ Database connection error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async cleanAllTables() {
    console.log("🧹 Starting database data cleanup...\n");

    const cleanupSQL = `
-- Database Data Cleanup - Step by step execution
-- Copy and execute each section in your D1 database

-- Step 1: Clear audit logs
DELETE FROM audit_logs;
SELECT 'audit_logs cleared' as status;

-- Step 2: Clear notifications  
DELETE FROM notifications;
SELECT 'notifications cleared' as status;

-- Step 3: Clear animal movements
DELETE FROM animal_movements;
SELECT 'animal_movements cleared' as status;

-- Step 4: Clear animal events
DELETE FROM animal_events;
SELECT 'animal_events cleared' as status;

-- Step 5: Clear animal health records
DELETE FROM animal_health_records;
SELECT 'animal_health_records cleared' as status;

-- Step 6: Clear tasks
DELETE FROM tasks;
SELECT 'tasks cleared' as status;

-- Step 7: Clear finance entries
DELETE FROM finance_entries;
SELECT 'finance_entries cleared' as status;

-- Step 8: Clear crops
DELETE FROM crops;
SELECT 'crops cleared' as status;

-- Step 9: Clear weather data
DELETE FROM weather_data;
SELECT 'weather_data cleared' as status;

-- Step 10: Clear inventory
DELETE FROM inventory;
SELECT 'inventory cleared' as status;

-- Step 11: Clear equipment
DELETE FROM equipment;
SELECT 'equipment cleared' as status;

-- Step 12: Clear farm operations
DELETE FROM farm_operations;
SELECT 'farm_operations cleared' as status;

-- Step 13: Clear farm statistics
DELETE FROM farm_statistics;
SELECT 'farm_statistics cleared' as status;

-- Step 14: Clear farm members
DELETE FROM farm_members;
SELECT 'farm_members cleared' as status;

-- Step 15: Clear fields
DELETE FROM fields;
SELECT 'fields cleared' as status;

-- Step 16: Clear locations
DELETE FROM locations;
SELECT 'locations cleared' as status;

-- Step 17: Clear animals
DELETE FROM animals;
SELECT 'animals cleared' as status;

-- Step 18: Clear farms
DELETE FROM farms;
SELECT 'farms cleared' as status;

-- Step 19: Clear users (optional)
-- DELETE FROM users;
-- SELECT 'users cleared (OPTIONAL)' as status;

-- Verification
SELECT 'Remaining data counts:' as verification;
SELECT 'farms' as table_name, COUNT(*) as count FROM farms
UNION ALL
SELECT 'users', COUNT(*) FROM users  
UNION ALL
SELECT 'animals', COUNT(*) FROM animals
UNION ALL
SELECT 'fields', COUNT(*) FROM fields
UNION ALL
SELECT 'crops', COUNT(*) FROM crops
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'finance_entries', COUNT(*) FROM finance_entries
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;
    `;

    console.log("📋 Complete cleanup SQL ready for manual execution:");
    console.log("=".repeat(60));
    console.log(cleanupSQL);
    console.log("=".repeat(60));

    console.log("\n🔗 To execute manually:");
    console.log("1. Go to Cloudflare Dashboard → D1");
    console.log("2. Select your database: farmers-boot-local");
    console.log("3. Open Query Editor");
    console.log("4. Copy and paste the SQL above");
    console.log("5. Execute to clean all data");

    return {
      success: true,
      message: "Cleanup SQL generated successfully",
      sql: cleanupSQL,
    };
  }
}

// Main execution
async function main() {
  console.log("🗄️  Database Cleanup Tool");
  console.log("========================\n");

  const dbCleanup = new SimpleDBCleanup();
  const result = await dbCleanup.cleanAllTables();

  if (result.success) {
    console.log("\n✅ Database cleanup preparation completed!");
    console.log("⚠️  Remember: This will permanently delete ALL data!");
    console.log("🔒 Make sure you have backups if needed.");
  } else {
    console.log("\n❌ Cleanup preparation failed:", result.error);
  }
}

main().catch(console.error);
