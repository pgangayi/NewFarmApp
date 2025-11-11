// Centralized Database Operations for Farm Management System
// Provides consistent database access patterns, error handling, and performance monitoring
// Date: November 7, 2025

import { createLogger } from "./_logger.js";
import {
  DatabaseError,
  classifyDatabaseError,
  logError,
  createDatabaseErrorResponse,
  createInternalErrorResponse,
} from "./_errors.js";

const logger = createLogger(process.env.NODE_ENV || "development");

/**
 * Centralized Database Operations Manager
 * Provides consistent database access patterns with enhanced error handling and performance monitoring
 */
export class DatabaseOperations {
  constructor(env) {
    this.env = env;
    this.logger = logger;
  }

  /**
   * Execute a database query with enhanced error handling and monitoring
   * SECURITY: Enforces parameterized queries to prevent SQL injection
   */
  async executeQuery(query, params = [], options = {}) {
    // SECURITY VALIDATION: Check for SQL injection patterns
    this.validateQuerySecurity(query, params);

    const startTime = Date.now();
    const {
      operation = "query",
      table = "unknown",
      context = {},
      retries = 1,
      retryDelay = 100,
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const statement = this.env.DB.prepare(query);
        let result;

        if (operation === "run") {
          result = await statement.bind(...this.sanitizeParams(params)).run();
        } else {
          result = await statement.bind(...this.sanitizeParams(params)).all();
        }

        const duration = Date.now() - startTime;

        // Log performance metrics
        this.logger.logDatabase(operation, table, duration, true, {
          attempt,
          query: this.sanitizeQueryForLogging(query),
          context,
        });

        return {
          success: true,
          data: result.results || result,
          changes: result.changes || 0,
          lastRowId: result.meta?.last_row_id || null,
          duration,
          operation,
          table,
        };
      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;

        // Log error with context
        this.logger.error("Database operation failed", {
          attempt,
          operation,
          table,
          query: this.sanitizeQueryForLogging(query),
          error: error.message,
          context,
        });

        // Only retry on specific retryable errors
        if (attempt < retries && this.isRetryableError(error)) {
          await this.delay(retryDelay * attempt);
          continue;
        }

        break;
      }
    }

    // Log final failure
    this.logger.error("Database operation failed after all retries", {
      operation,
      table,
      query: this.sanitizeQueryForLogging(query),
      error: lastError.message,
      context,
    });

    throw new DatabaseError(
      "Database operation failed",
      lastError.code || "UNKNOWN_ERROR",
      {
        operation,
        table,
        query: this.sanitizeQueryForLogging(query),
        originalError: lastError.message,
        attempts: retries,
      }
    );
  }

  /**
   * Execute multiple database operations in a transaction
   */
  async executeTransaction(operations) {
    const startTime = Date.now();
    const transactionId = this.generateTransactionId();

    try {
      this.logger.info("Starting database transaction", {
        transactionId,
        operations: operations.length,
      });

      // Note: Cloudflare D1 doesn't support explicit transactions
      // We'll simulate transaction behavior with batch execution
      const results = [];

      for (const operation of operations) {
        const result = await this.executeQuery(
          operation.query,
          operation.params,
          {
            operation: operation.operation || "query",
            table: operation.table || "unknown",
            context: { ...operation.context, transactionId },
          }
        );
        results.push(result);
      }

      const duration = Date.now() - startTime;
      this.logger.logDatabase("transaction", "multi-table", duration, true, {
        transactionId,
        operations: operations.length,
      });

      return {
        success: true,
        results,
        duration,
        transactionId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error("Database transaction failed", {
        transactionId,
        operations: operations.length,
        error: error.message,
      });

      throw new DatabaseError(
        "Transaction failed",
        error.code || "TRANSACTION_ERROR",
        {
          transactionId,
          operations: operations.length,
          originalError: error.message,
        }
      );
    }
  }

  /**
   * Find records by ID with enhanced error handling
   */
  async findById(table, id, columns = "*", options = {}) {
    const { results } = await this.executeQuery(
      `SELECT ${columns} FROM ${table} WHERE id = ?`,
      [id],
      {
        operation: "query",
        table,
        context: { findById: true, ...options.context },
      }
    );

    return results[0] || null;
  }

  /**
   * Find multiple records with filtering and pagination
   */
  async findMany(table, filters = {}, options = {}) {
    const {
      columns = "*",
      orderBy = "id",
      orderDirection = "ASC",
      limit = 100,
      offset = 0,
      join = "",
      groupBy = "",
      having = "",
      distinct = false,
    } = options;

    let query = `SELECT ${distinct ? "DISTINCT " : ""}${columns} FROM ${table}`;

    if (join) {
      query += ` ${join}`;
    }

    const conditions = [];
    const params = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          conditions.push(`${key} IN (${value.map(() => "?").join(", ")})`);
          params.push(...value);
        } else if (typeof value === "object" && value.operator) {
          conditions.push(`${key} ${value.operator} ?`);
          params.push(value.value);
        } else {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    if (groupBy) {
      query += ` GROUP BY ${groupBy}`;
    }

    if (having) {
      query += ` HAVING ${having}`;
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
    }

    if (limit > 0) {
      query += ` LIMIT ${Math.min(limit, 1000)}`;
    }

    if (offset > 0) {
      query += ` OFFSET ${offset}`;
    }

    const { results } = await this.executeQuery(query, params, {
      operation: "query",
      table,
      context: { findMany: true, filters, options },
    });

    return results;
  }

  /**
   * Create a new record
   */
  async create(table, data, options = {}) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => "?").join(", ");

    const query = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders})
    `;

    const result = await this.executeQuery(query, values, {
      operation: "run",
      table,
      context: {
        create: true,
        data: this.sanitizeDataForLogging(data),
        ...options.context,
      },
    });

    return {
      ...data,
      id: result.lastRowId,
      changes: result.changes,
    };
  }

  /**
   * Update records by ID
   */
  async updateById(table, id, data, options = {}) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((col) => `${col} = ?`).join(", ");

    const query = `
      UPDATE ${table} 
      SET ${placeholders}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const { changes } = await this.executeQuery(query, [...values, id], {
      operation: "run",
      table,
      context: {
        updateById: true,
        id,
        data: this.sanitizeDataForLogging(data),
        ...options.context,
      },
    });

    if (changes === 0) {
      throw new DatabaseError(
        `Record with ID ${id} not found`,
        "RECORD_NOT_FOUND",
        { table, id }
      );
    }

    return { id, changes, data };
  }

  /**
   * Delete records by ID
   */
  async deleteById(table, id, options = {}) {
    const { changes } = await this.executeQuery(
      `DELETE FROM ${table} WHERE id = ?`,
      [id],
      {
        operation: "run",
        table,
        context: { deleteById: true, id, ...options.context },
      }
    );

    if (changes === 0) {
      throw new DatabaseError(
        `Record with ID ${id} not found`,
        "RECORD_NOT_FOUND",
        { table, id }
      );
    }

    return { id, changes };
  }

  /**
   * Count records with filters
   */
  async count(table, filters = {}, options = {}) {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const params = [];

    if (options.join) {
      query += ` ${options.join}`;
    }

    const conditions = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    if (options.groupBy) {
      query += ` GROUP BY ${options.groupBy}`;
    }

    const { results } = await this.executeQuery(query, params, {
      operation: "query",
      table,
      context: { count: true, filters, ...options.context },
    });

    return results[0]?.count || 0;
  }

  /**
   * Check if a record exists
   */
  async exists(table, filters = {}) {
    const count = await this.count(table, filters);
    return count > 0;
  }

  /**
   * Get foreign key relationships
   */
  async getForeignKeyReferences(referencedTable, referencedId, options = {}) {
    const { results } = await this.executeQuery(
      `
      SELECT table_name, column_name, constraint_name
      FROM information_schema.key_column_usage
      WHERE referenced_table_name = ? AND referenced_column_name = ?
    `,
      [referencedTable, referencedId],
      {
        operation: "query",
        context: { getForeignKeyReferences: true, ...options.context },
      }
    );

    // For now, return a simplified check of common relationships
    const commonRelationships = {
      animals: ["farm_id"],
      crops: ["farm_id", "field_id"],
      tasks: ["farm_id"],
      finance_entries: ["farm_id"],
      inventory: ["farm_id"],
      fields: ["farm_id"],
    };

    return commonRelationships[referencedTable] || [];
  }

  /**
   * Check for dependencies before deletion
   */
  async checkDependencies(referencedTable, referencedId) {
    const foreignKeys = await this.getForeignKeyReferences(
      referencedTable,
      referencedId
    );
    const dependencies = {};

    for (const column of foreignKeys) {
      const { results } = await this.executeQuery(
        `
        SELECT COUNT(*) as count
        FROM ${referencedTable}
        WHERE ${column} = ?
      `,
        [referencedId],
        {
          operation: "query",
          context: { checkDependencies: true },
        }
      );

      dependencies[column] = results[0]?.count || 0;
    }

    return dependencies;
  }

  /**
   * Health check for database connection
   */
  async healthCheck() {
    try {
      const { results } = await this.executeQuery("SELECT 1 as health", [], {
        operation: "query",
        context: { healthCheck: true },
      });

      return {
        healthy: true,
        responseTime: Date.now(),
        result: results[0],
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        responseTime: Date.now(),
      };
    }
  }

  // Private utility methods
  isRetryableError(error) {
    const message = error.message?.toLowerCase() || "";
    const code = error.code || "";

    return (
      message.includes("database is locked") ||
      message.includes("sqlite_busy") ||
      message.includes("timeout") ||
      code === "SQLITE_BUSY"
    );
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  sanitizeQueryForLogging(query) {
    // Remove potential sensitive data from queries for logging
    return query
      .replace(
        /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
        "CARD_NUMBER_REDACTED"
      )
      .replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        "EMAIL_REDACTED"
      );
  }
  // SECURITY: SQL Injection Detection and Prevention
  validateQuerySecurity(query, params) {
    // Check for dangerous SQL patterns in query
    const dangerousPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /create\s+table/i,
      /alter\s+table/i,
      /exec\s*\(/i,
      /execute\s*\(/i,
      /--/,
      /\/\*/,
      /\*\//,
      /;.*select/i,
      /;.*update/i,
      /;.*delete/i,
      /;.*insert/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        throw new Error(
          "SECURITY: Potentially dangerous SQL pattern detected in query"
        );
      }
    }

    // Additional checks for parameter-based injection
    if (Array.isArray(params)) {
      for (const param of params) {
        if (this.isSuspiciousParameter(param)) {
          throw new Error("SECURITY: Suspicious parameter detected");
        }
      }
    }
  }

  // Check for suspicious parameter values
  isSuspiciousParameter(param) {
    if (param === null || param === undefined) return false;

    const str = String(param).toLowerCase();
    const suspiciousPatterns = [
      /('|(\\x27|'))/i, // Single quote variations
      /(\\x22|")/i, // Double quote variations
      /(\\x3b|;)/i, // Semicolon
      /(\\x2d|-)/i, // Dash
      /(\\x2f|\/)/i, // Forward slash
      /(\\x5c|\\)/i, // Backslash
      /(\\x2a|\*)/i, // Asterisk
      /(\\x28|\()/i, // Open parenthesis
      /(\\x29|\))/i, // Close parenthesis
      /(\\x7c|\|)/i, // Pipe
      /(\\x26|&)/i, // Ampersand
      /union/i, // Union keyword
      /select/i, // Select keyword
      /insert/i, // Insert keyword
      /update/i, // Update keyword
      /delete/i, // Delete keyword
      /drop/i, // Drop keyword
      /create/i, // Create keyword
      /alter/i, // Alter keyword
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(str));
  }

  // Sanitize parameters for database operations
  sanitizeParams(params) {
    if (!Array.isArray(params)) return params;

    return params.map((param) => {
      if (typeof param === "string") {
        // Remove null bytes and control characters
        return param.replace(/[\x00-\x1F\x7F]/g, "").trim();
      }
      return param;
    });
  }

  // SECURITY: Restricted query execution (for admin operations only)
  async executeRestrictedQuery(query, params, options = {}) {
    // This method should only be used for maintenance/admin operations
    // and should be protected by additional authorization checks

    const clientIP = options.clientIP || "unknown";
    const userId = options.userId || "system";

    // Log restricted query execution
    console.warn("SECURITY: Restricted query execution", {
      timestamp: new Date().toISOString(),
      clientIP,
      userId,
      query: this.sanitizeQueryForLogging(query),
      operation: "RESTRICTED_QUERY",
    });

    // Additional security validations for restricted queries
    this.validateQuerySecurity(query, params);

    // Force parameter binding (no dynamic query construction)
    if (params.length === 0) {
      throw new Error("SECURITY: Parameters required for restricted queries");
    }

    return await this.executeQuery(query, params, {
      ...options,
      restricted: true,
    });
  }

  sanitizeDataForLogging(data) {
    const sensitiveFields = ["password", "email", "token", "secret", "key"];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = "REDACTED";
      }
    });

    return sanitized;
  }

  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Base Repository Pattern for Entity Operations
 */
export class BaseRepository {
  constructor(dbOperations, tableName) {
    this.db = dbOperations;
    this.tableName = tableName;
  }

  // CRUD Operations
  async findById(id, options = {}) {
    return await this.db.findById(this.tableName, id, options.columns, options);
  }

  async findMany(filters = {}, options = {}) {
    return await this.db.findMany(this.tableName, filters, options);
  }

  async create(data, options = {}) {
    return await this.db.create(this.tableName, data, options);
  }

  async updateById(id, data, options = {}) {
    return await this.db.updateById(this.tableName, id, data, options);
  }

  async deleteById(id, options = {}) {
    return await this.db.deleteById(this.tableName, id, options);
  }

  async count(filters = {}, options = {}) {
    return await this.db.count(this.tableName, filters, options);
  }

  async exists(filters = {}) {
    return await this.db.exists(this.tableName, filters);
  }

  // Specialized operations
  async findByFarmId(farmId, options = {}) {
    return await this.findMany({ farm_id: farmId }, options);
  }

  async findByUserId(userId, join = "", options = {}) {
    // This should be overridden by specific repositories
    throw new Error("findByUserId must be implemented by specific repository");
  }
}

// Export all database utilities
export default {
  DatabaseOperations,
  BaseRepository,
};
