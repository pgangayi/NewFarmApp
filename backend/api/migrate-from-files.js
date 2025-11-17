import { createSuccessResponse, createErrorResponse } from "./_auth.js";
import { readFile } from "fs/promises";

// Migration script that executes SQL files in order
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Only allow GET requests to this endpoint
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405);
  }

  try {
    console.log("Starting database migration from SQL files...");

    // Define migration files in order
    const migrationFiles = [
      "migrations/0001_core_schema.sql",
      "migrations/0002_inventory_finance.sql",
      "migrations/0003_crops_livestock_tasks.sql",
      "migrations/0004_security_auth.sql",
    ];

    const results = [];

    // Execute each migration file
    for (const file of migrationFiles) {
      try {
        console.log(`Executing migration: ${file}`);

        // Read the SQL file
        const sqlContent = await readFile(file, "utf8");

        // Execute the SQL
        await env.DB.exec(sqlContent);

        results.push({
          file,
          status: "success",
          message: "Migration executed successfully",
        });

        console.log(`Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`Migration ${file} failed:`, error);
        results.push({
          file,
          status: "error",
          message: error.message,
        });
        throw new Error(`Migration ${file} failed: ${error.message}`);
      }
    }

    console.log("All database migrations completed successfully");

    return createSuccessResponse({
      message: "Database migration completed successfully",
      migrations_executed: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return createErrorResponse(`Migration failed: ${error.message}`, 500);
  }
}
