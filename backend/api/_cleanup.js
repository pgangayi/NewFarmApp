// Database Data Cleanup Script
// Safely removes all data from the database while preserving schema
// Date: November 15, 2025

import { DatabaseOperations } from "./_database.js";
import { createAuditLogger } from "./_logger.js";
import {
  DatabaseError,
  logError,
  createInternalErrorResponse,
} from "./_errors.js";

// Use instance-level audit logger created from runtime env to avoid module-level process.env reads

/**
 * Database Data Cleanup Manager
 * Handles safe deletion of all data while preserving database structure
 */
export class DatabaseCleanup {
  constructor(dbOperations) {
    this.db = dbOperations;
    this.logger = createAuditLogger(this.db?.env || {});
  }

  /**
   * Execute complete data cleanup
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanAllData(options = {}) {
    const {
      preserveUsers = false,
      preserveFarms = false,
      auditLog = true,
      userId = null,
    } = options;

    this.logger.info("Starting complete database data cleanup", {
      preserveUsers,
      preserveFarms,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Define cleanup order (reverse dependency order)
      const cleanupSteps = this.getCleanupOrder(preserveUsers, preserveFarms);

      const results = {
        success: true,
        timestamp: new Date().toISOString(),
        steps: [],
        summary: {
          totalTables: cleanupSteps.length,
          successCount: 0,
          errorCount: 0,
          totalDeleted: 0,
        },
      };

      // Execute cleanup steps in order
      for (const step of cleanupSteps) {
        try {
          const stepResult = await this.executeCleanupStep(step);
          results.steps.push(stepResult);
          results.summary.successCount++;
          results.summary.totalDeleted += stepResult.deletedCount;
        } catch (error) {
          const errorResult = {
            table: step.table,
            success: false,
            error: error.message,
            deletedCount: 0,
          };
          results.steps.push(errorResult);
          results.summary.errorCount++;
          this.logger.error(`Cleanup step failed for ${step.table}`, {
            error: error.message,
            table: step.table,
          });
        }
      }

      // Log completion
      this.logger.info("Database data cleanup completed", {
        ...results.summary,
        userId,
      });

      return results;
    } catch (error) {
      this.logger.error("Database cleanup failed completely", {
        error: error.message,
        stack: error.stack,
      });

      throw new DatabaseError("Database cleanup failed", "CLEANUP_FAILED", {
        originalError: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get cleanup order based on dependencies
   * @param {boolean} preserveUsers - Whether to preserve users
   * @param {boolean} preserveFarms - Whether to preserve farms
   * @returns {Array} Ordered cleanup steps
   */
  getCleanupOrder(preserveUsers, preserveFarms) {
    const steps = [
      // Clear dependent tables first
      { table: "audit_logs", description: "Audit logs" },
      { table: "notifications", description: "Notifications" },
      { table: "animal_movements", description: "Animal movements" },
      { table: "animal_events", description: "Animal events" },
      { table: "animal_health_records", description: "Animal health records" },
      { table: "tasks", description: "Tasks" },
      { table: "finance_entries", description: "Finance entries" },
      { table: "crops", description: "Crops" },
      { table: "weather_data", description: "Weather data" },
      { table: "inventory", description: "Inventory" },
      { table: "equipment", description: "Equipment" },
      { table: "farm_operations", description: "Farm operations" },
      { table: "farm_statistics", description: "Farm statistics" },
      { table: "farm_members", description: "Farm members" },
      { table: "fields", description: "Fields" },
      { table: "locations", description: "Locations" },
      { table: "animals", description: "Animals" },
    ];

    // Add conditional steps
    if (!preserveFarms) {
      steps.unshift({ table: "farms", description: "Farms" });
    }

    if (!preserveUsers) {
      steps.unshift({ table: "users", description: "Users" });
    }

    return steps;
  }

  /**
   * Execute a single cleanup step
   * @param {Object} step - Cleanup step configuration
   * @returns {Promise<Object>} Step result
   */
  async executeCleanupStep(step) {
    const { table } = step;

    this.logger.info(`Cleaning table: ${table}`, { table });

    try {
      // Get count before deletion
      const countResult = await this.db.executeQuery(
        `SELECT COUNT(*) as count FROM ${table}`,
        [],
        {
          operation: "first",
          table,
          context: { countBeforeCleanup: true },
          skipRateLimit: true,
        },
      );

      const beforeCount = countResult.data?.count || 0;

      // Perform deletion
      const deleteResult = await this.db.executeQuery(
        `DELETE FROM ${table}`,
        [],
        {
          operation: "run",
          table,
          context: { cleanup: true, step: step.description },
          skipRateLimit: true,
        },
      );

      const afterCount = await this.db.executeQuery(
        `SELECT COUNT(*) as count FROM ${table}`,
        [],
        {
          operation: "first",
          table,
          context: { countAfterCleanup: true },
          skipRateLimit: true,
        },
      );

      const finalCount = afterCount.data?.count || 0;
      const deletedCount = beforeCount - finalCount;

      const result = {
        table,
        description: step.description,
        success: true,
        beforeCount,
        afterCount: finalCount,
        deletedCount,
        changes: deleteResult.changes || 0,
      };

      this.logger.info(`Successfully cleaned table: ${table}`, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to clean table: ${table}`, {
        error: error.message,
        table,
      });
      throw error;
    }
  }

  /**
   * Clean specific table data
   * @param {string} tableName - Table to clean
   * @param {Object} options - Cleanup options
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanTable(tableName, options = {}) {
    const { userId = null, auditLog = true } = options;

    this.logger.info(`Cleaning specific table: ${tableName}`, {
      tableName,
      userId,
    });

    try {
      const step = {
        table: tableName,
        description: `Manual cleanup of ${tableName}`,
      };

      const result = await this.executeCleanupStep(step);

      if (auditLog) {
        this.logger.info(`Manual table cleanup completed`, {
          tableName,
          ...result,
          userId,
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`Manual table cleanup failed`, {
        tableName,
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get database statistics before cleanup
   * @returns {Promise<Object>} Database statistics
   */
  async getDatabaseStats() {
    this.logger.info("Getting database statistics");

    const tables = [
      "users",
      "farms",
      "farm_members",
      "farm_statistics",
      "farm_operations",
      "animals",
      "animal_health_records",
      "animal_events",
      "animal_movements",
      "locations",
      "fields",
      "crops",
      "tasks",
      "finance_entries",
      "inventory",
      "equipment",
      "weather_data",
      "notifications",
      "audit_logs",
    ];

    const stats = {
      timestamp: new Date().toISOString(),
      tables: {},
      totalRecords: 0,
    };

    for (const table of tables) {
      try {
        const result = await this.db.executeQuery(
          `SELECT COUNT(*) as count FROM ${table}`,
          [],
          {
            operation: "first",
            table,
            context: { getStats: true },
            skipRateLimit: true,
          },
        );

        const count = result.data?.count || 0;
        stats.tables[table] = count;
        stats.totalRecords += count;
      } catch (error) {
        stats.tables[table] = { error: error.message };
        this.logger.warn(`Failed to get count for table: ${table}`, {
          table,
          error: error.message,
        });
      }
    }

    return stats;
  }

  /**
   * Reset database to clean state (schema only)
   * WARNING: This will drop and recreate all tables
   * @param {Object} options - Reset options
   * @returns {Promise<Object>} Reset result
   */
  async resetDatabase(options = {}) {
    const { userId = null, auditLog = true } = options;

    this.logger.warn("Starting database reset (schema preservation)", {
      userId,
      timestamp: new Date().toISOString(),
    });

    if (
      !confirm(
        "Are you sure you want to reset the database? This will delete ALL data!",
      )
    ) {
      throw new DatabaseError(
        "Database reset cancelled by user",
        "RESET_CANCELLED",
      );
    }

    try {
      // Get statistics before reset
      const beforeStats = await this.getDatabaseStats();

      // Execute complete cleanup
      const cleanupResult = await this.cleanAllData({
        preserveUsers: false,
        preserveFarms: false,
        auditLog,
        userId,
      });

      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        beforeStats,
        cleanupResult,
        message: "Database reset completed successfully",
      };

      this.logger.warn("Database reset completed", {
        ...result,
        userId,
      });

      return result;
    } catch (error) {
      this.logger.error("Database reset failed", {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}

/**
 * Create cleanup instance for request handling
 * @param {Object} env - Environment object
 * @returns {DatabaseCleanup} Cleanup instance
 */
export function createCleanupInstance(env) {
  const dbOperations = new DatabaseOperations(env);
  return new DatabaseCleanup(dbOperations);
}

/**
 * API handler for database cleanup
 * @param {Object} context - Request context
 * @returns {Promise<Response>} API response
 */
export async function onRequestCleanup(context) {
  const { request, env, ctx } = context;

  try {
    // Only allow in development or with admin token
    if (
      env.NODE_ENV === "production" &&
      !request.headers.get("X-Admin-Token")
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanup = createCleanupInstance(env);
    const url = new URL(request.url);
    const method = request.method;

    if (method === "GET") {
      // Get database statistics
      const stats = await cleanup.getDatabaseStats();
      return new Response(
        JSON.stringify({
          success: true,
          data: stats,
          message: "Database statistics retrieved",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (method === "POST") {
      const body = await request.json().catch(() => ({}));
      const {
        action = "clean",
        table = null,
        preserveUsers = false,
        preserveFarms = false,
        reset = false,
      } = body;

      let result;

      if (reset) {
        result = await cleanup.resetDatabase({
          userId: "system",
          auditLog: true,
        });
      } else if (table) {
        result = await cleanup.cleanTable(table, {
          userId: "system",
          auditLog: true,
        });
      } else {
        result = await cleanup.cleanAllData({
          preserveUsers,
          preserveFarms,
          userId: "system",
          auditLog: true,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: result,
          message: `Database ${action} completed successfully`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError("Database cleanup API error", error, context);
    return createInternalErrorResponse(error);
  }
}
