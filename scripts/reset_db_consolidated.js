const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const DB_NAME = "farmers_boot"; // Must match wrangler.toml
const MIGRATION_FILE = "migrations/0000_consolidated_schema.sql";
const IS_REMOTE = true; // Defaults to remote for D1-only setup

console.log(
  `\n⚠️  WARNING: This will RESET the '${DB_NAME}' database (Remote: ${IS_REMOTE})  ⚠️`
);
console.log(
  `All data will be lost. The schema from '${MIGRATION_FILE}' will be applied.\n`
);

try {
  const remoteFlag = IS_REMOTE ? "--remote" : "";

  // 1. Drop existing tables
  console.log("1. Dropping existing tables...");
  const dropCommands = [
    "DROP TABLE IF EXISTS inventory_items;",
    "DROP TABLE IF EXISTS finance_entries;",
    "DROP TABLE IF EXISTS tasks;",
    "DROP TABLE IF EXISTS crop_activities;",
    "DROP TABLE IF EXISTS crop_observations;",
    "DROP TABLE IF EXISTS crop_plans;",
    "DROP TABLE IF EXISTS crops;",
    "DROP TABLE IF EXISTS animals;",
    "DROP TABLE IF EXISTS fields;",
    "DROP TABLE IF EXISTS farm_members;",
    "DROP TABLE IF EXISTS farms;",
    "DROP TABLE IF EXISTS users;",
    "DROP TABLE IF EXISTS d1_migrations;",
  ];

  for (const cmd of dropCommands) {
    try {
      console.log(`Executing: ${cmd}`);
      // Using --command with proper quoting
      execSync(
        `npx wrangler d1 execute ${DB_NAME} ${remoteFlag} -y --command "${cmd}"`,
        { stdio: "inherit" }
      );
    } catch (e) {
      console.warn(
        `Warning: Failed to execute drop command '${cmd}'. Skipping...`
      );
    }
  }

  // 2. Apply Consolidated Schema
  console.log("\n2. Applying Consolidated Schema...");
  execSync(
    `npx wrangler d1 execute ${DB_NAME} ${remoteFlag} -y --file=${MIGRATION_FILE}`,
    { stdio: "inherit" }
  );

  console.log("\n✅ Database reset complete.");
} catch (error) {
  console.error("\n❌ Error resetting database:", error.message);
  process.exit(1);
}
