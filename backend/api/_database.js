// Centralized Database Operations for Farm Management System
// Enhanced with comprehensive security, performance monitoring, and error handling
// Date: November 13, 2025 (Security Hardened Version - Revised)
// Updated: January 1, 2026 - Added findByUser

import { createAuditLogger } from "./_logger.js";
import {
  DatabaseError,
  classifyDatabaseError,
  logError,
  createDatabaseErrorResponse,
  createInternalErrorResponse,
} from "./_errors.js";

const logger = createAuditLogger({
  // This build-time env var is fine, but runtime checks are fixed inside the class
  ENVIRONMENT: process.env.NODE_ENV || "development",
});

// ============================================================================
// SECURITY CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Database error codes for consistent error handling
 */
export const DB_ERROR_CODES = {
  UNKNOWN: "UNKNOWN_ERROR",
  NOT_FOUND: "RECORD_NOT_FOUND",
  DEPENDENCY: "DEPENDENCY_VIOLATION",
  TRANSACTION: "TRANSACTION_ERROR",
  INVALID_TABLE: "INVALID_TABLE",
  INVALID_COLUMNS: "INVALID_COLUMNS",
  INVALID_JOIN: "INVALID_JOIN",
  INVALID_GROUP_BY: "INVALID_GROUP_BY",
  INVALID_HAVING: "INVALID_HAVING",
  INVALID_ORDER_BY: "INVALID_ORDER_BY",
  INVALID_PARAMETER: "INVALID_PARAMETER",
  QUERY_TIMEOUT: "QUERY_TIMEOUT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
};

/**
 * Whitelisted table names - SECURITY: Prevents SQL injection via table names
 */
const ALLOWED_TABLES = [
  "users",
  "farms",
  "farm_members",
  "farm_statistics",
  "farm_operations",
  "animals",
  "animal_health_records",
  "animal_production",
  "animal_breeding",
  "animal_feeding_records",
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

/**
 * Configuration constants
 */
const CONFIG = {
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 1000,
  DEFAULT_RETRIES: 3,
  INITIAL_RETRY_DELAY: 100,
  MAX_RETRY_DELAY: 2000,
  DEFAULT_QUERY_TIMEOUT: 30000, // 30 seconds
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_QUERIES: 100,
  LOG_QUERIES_IN_PRODUCTION: false,
};

/**
 * Valid SQL operators for filtering
 */
const VALID_OPERATORS = [
  "=",
  "!=",
  ">",
  "<",
  ">=",
  "<=",
  "LIKE",
  "IN",
  "NOT IN",
];

/**
 * Centralized Database Operations Manager
 * Provides consistent database access patterns with enhanced error handling and security
 */
export class DatabaseOperations {
  constructor(env, options = {}) {
    this.env = env;
    this.logger = logger;
    this.config = { ...CONFIG, ...options };

    // **FIX**: Use runtime env, not process.env
    this.isProduction =
      (this.env.ENVIRONMENT || "development") === "production";

    // Rate limiting state (in-memory, consider Redis for production)
    this.rateLimitStore = new Map();

    // Query performance metrics
    this.metrics = {
      totalQueries: 0,
      failedQueries: 0,
      avgQueryTime: 0,
      slowQueries: [],
    };

    // Application-level dependency mapping for D1 (SQLite)
    this.hardcodedDependencies = {
      farms: [
        { table: "farm_members", column: "farm_id" },
        { table: "farm_statistics", column: "farm_id" },
        { table: "farm_operations", column: "farm_id" },
        { table: "animals", column: "farm_id" },
        { table: "locations", column: "farm_id" },
        { table: "fields", column: "farm_id" },
        { table: "finance_entries", column: "farm_id" },
        { table: "tasks", column: "farm_id" },
        { table: "inventory", column: "farm_id" },
        { table: "equipment", column: "farm_id" },
      ],
      animals: [
        { table: "animal_health_records", column: "animal_id" },
        { table: "animal_production", column: "animal_id" },
        { table: "animal_breeding", column: "animal_id" },
        { table: "animal_feeding_records", column: "animal_id" },
        { table: "animal_events", column: "animal_id" },
        { table: "animal_movements", column: "animal_id" },
      ],
      locations: [
        { table: "animals", column: "current_location_id" },
        { table: "animal_movements", column: "source_location_id" },
        { table: "animal_movements", column: "destination_location_id" },
      ],
      fields: [{ table: "crops", column: "field_id" }],
      users: [
        { table: "farms", column: "owner_id" },
        { table: "farm_members", column: "user_id" },
        { table: "tasks", column: "assigned_to" },
        { table: "animal_movements", column: "recorded_by" },
        { table: "audit_logs", column: "user_id" },
      ],
    };
  }

  // ============================================================================
  // CORE QUERY EXECUTION
  // ============================================================================

  /**
   * Execute a database query with enhanced error handling, monitoring, and security
   * @param {string} query - SQL query with placeholders
   * @param {Array} params - Parameters to bind
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = [], options = {}) {
    const startTime = Date.now();
    const {
      operation = "query", // 'query' (all), 'run', 'first', 'raw'
      table = "unknown",
      context = {},
      retries = this.config.DEFAULT_RETRIES,
      timeout = this.config.DEFAULT_QUERY_TIMEOUT,
      userId = null,
      skipRateLimit = false,
    } = options;

    // Rate limiting check
    if (!skipRateLimit && userId) {
      await this.checkRateLimit(userId);
    }

    // SECURITY: Validate query structure
    this.validateQueryStructure(query);

    // Sanitize parameters
    const sanitizedParams = this.sanitizeParams(params);

    let lastError;
    let attempt = 0;

    while (attempt < retries) {
      attempt++;

      try {
        const statement = this.env.DB.prepare(query);

        // Execute with timeout
        const result = await this.executeWithTimeout(
          statement.bind(...sanitizedParams),
          operation, // 'run', 'all', 'first', 'raw'
          timeout
        );

        const duration = Date.now() - startTime;

        // Update metrics
        this.updateMetrics(operation, table, duration, true);

        // Log performance
        if (this.shouldLogQuery(duration)) {
          this.logger.logDatabase(operation, table, duration, true, {
            attempt,
            query: this.sanitizeQueryForLogging(query),
            context,
          });
        }

        // Track slow queries
        if (duration > 1000) {
          this.trackSlowQuery(query, duration, table, operation);
        }

        // **UPGRADE**: Standardize return shape for all operation types
        return {
          success: true,
          data:
            operation === "run"
              ? []
              : operation === "first"
              ? result || null
              : operation === "raw"
              ? result
              : result.results || [],
          changes: (result && result.changes) || 0,
          lastRowId: (result && result.meta?.last_row_id) || null,
          duration,
          operation,
          table,
        };
      } catch (error) {
        lastError = error;
        const duration = Date.now() - startTime;

        // Update metrics
        this.updateMetrics(operation, table, duration, false);

        // Log error with context
        this.logger.error("Database operation failed", {
          attempt,
          operation,
          table,
          query: this.sanitizeQueryForLogging(query),
          error: this.sanitizeError(error),
          context,
        });

        // Only retry on specific retryable errors
        if (attempt < retries && this.isRetryableError(error)) {
          const delay = Math.min(
            this.config.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1),
            this.config.MAX_RETRY_DELAY
          );
          await this.delay(delay);
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
      error: this.sanitizeError(lastError),
      attempts: attempt,
      context,
    });

    throw new DatabaseError(
      "Database operation failed",
      lastError.code || DB_ERROR_CODES.UNKNOWN,
      {
        operation,
        table,
        query: this.sanitizeQueryForLogging(query),
        originalError: lastError.message,
        attempts: attempt,
      }
    );
  }

  /**
   * Execute statement with timeout protection
   * @private
   * @param {D1PreparedStatement} statement - The bound D1 statement
   * @param {string} method - 'run', 'all', 'first', or 'raw'
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<any>}
   */
  async executeWithTimeout(statement, method, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new DatabaseError(
              "Query timeout exceeded",
              DB_ERROR_CODES.QUERY_TIMEOUT,
              { timeout: timeoutMs }
            )
          ),
        timeoutMs
      )
    );

    let resultPromise;
    switch (method) {
      case "run":
        resultPromise = statement.run();
        break;
      case "first":
        resultPromise = statement.first();
        break;
      case "raw":
        resultPromise = statement.raw();
        break;
      case "all":
      case "query": // Keep 'query' for backward compatibility
      default:
        resultPromise = statement.all();
    }

    const result = await Promise.race([resultPromise, timeoutPromise]);
    return result;
  }

  /**
   * Execute multiple database operations in an atomic D1 transaction (batch)
   * @param {Array} operations - Array of {query, params, operation, table}
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} Transaction result
   */
  async executeTransaction(operations, options = {}) {
    const startTime = Date.now();
    const transactionId = this.generateTransactionId();
    const { context = {}, userId = null } = options;

    // Validate that we have operations
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new DatabaseError(
        "Transaction requires at least one operation",
        DB_ERROR_CODES.TRANSACTION,
        { transactionId }
      );
    }

    // Limit transaction size
    if (operations.length > 100) {
      throw new DatabaseError(
        "Transaction too large (max 100 operations)",
        DB_ERROR_CODES.TRANSACTION,
        { transactionId, operationCount: operations.length }
      );
    }

    this.logger.info("Starting atomic database transaction (D1 batch)", {
      transactionId,
      operations: operations.length,
      userId,
    });

    try {
      // Prepare all statements with security checks
      const statements = operations.map((op, index) => {
        this.validateQueryStructure(op.query);
        const sanitizedParams = this.sanitizeParams(op.params || []);
        return this.env.DB.prepare(op.query).bind(...sanitizedParams);
      });

      // Execute the batch atomically
      const results = await this.env.DB.batch(statements);

      const duration = Date.now() - startTime;
      this.updateMetrics("transaction", "multi-table", duration, true);

      this.logger.logDatabase("transaction", "multi-table", duration, true, {
        transactionId,
        operations: operations.length,
        context,
      });

      // Format results
      const formattedResults = results.map((result, index) => ({
        success: true,
        data: result.results || [],
        changes: result.changes || 0,
        lastRowId: result.meta?.last_row_id || null,
        operation: operations[index]?.operation || null,
        table: operations[index]?.table || null,
      }));

      return {
        success: true,
        results: formattedResults,
        duration,
        transactionId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics("transaction", "multi-table", duration, false);

      this.logger.error("Atomic database transaction failed", {
        transactionId,
        operations: operations.length,
        error: this.sanitizeError(error),
        context,
      });

      throw new DatabaseError(
        "Atomic transaction failed - all operations rolled back",
        error.code || DB_ERROR_CODES.TRANSACTION,
        {
          transactionId,
          operations: operations.length,
          originalError: error.message,
        }
      );
    }
  }

  // ============================================================================
  // CRUD OPERATIONS WITH SECURITY VALIDATION
  // ============================================================================

  /**
   * Find a record by ID
   * @param {string} table - Table name (must be whitelisted)
   * @param {string|number} id - Record ID
   * @param {string} columns - Columns to select (optional)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async findById(table, id, columns = "*", options = {}) {
    this.validateTable(table);

    const query = `SELECT ${columns} FROM ${table} WHERE id = ? LIMIT 1`;
    const result = await this.executeQuery(query, [id], {
      operation: "first",
      table,
      context: { findById: true, recordId: id, ...options.context },
      ...options,
    });

    return result.data;
  }

  /**
   * Find multiple records with filtering and pagination
   * @param {string} table - Table name (must be whitelisted)
   * @param {Object} filters - Filter conditions
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async findMany(table, filters = {}, options = {}) {
    this.validateTable(table);

    const {
      columns = "*",
      orderBy = "created_at",
      orderDirection = "DESC",
      limit = this.config.DEFAULT_LIMIT,
      offset = 0,
      userId = null,
      skipRateLimit = false,
    } = options;

    let query = `SELECT ${columns} FROM ${table} WHERE 1=1`;
    const params = [];

    // Build WHERE conditions from filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined) {
        if (
          typeof value === "object" &&
          value.operator &&
          value.value !== undefined
        ) {
          // Advanced filter with operator
          const operator = VALID_OPERATORS.includes(
            value.operator.toUpperCase()
          )
            ? value.operator.toUpperCase()
            : "=";
          query += ` AND ${key} ${operator} ?`;
          params.push(value.value);
        } else {
          // Simple equality filter
          query += ` AND ${key} = ?`;
          params.push(value);
        }
      }
    }

    // Add ordering
    query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(Math.min(limit, this.config.MAX_LIMIT), offset);

    const result = await this.executeQuery(query, params, {
      operation: "query",
      table,
      userId,
      skipRateLimit,
      context: { findMany: true, filters, options },
    });

    return result.data;
  }

  /**
   * Count records with optional filtering
   * @param {string} table - Table name (must be whitelisted)
   * @param {Object} filters - Filter conditions
   * @param {Object} options - Query options
   * @returns {Promise<number>} Count result
   */
  async count(table, filters = {}, options = {}) {
    this.validateTable(table);

    const { userId = null, skipRateLimit = false } = options;

    let query = `SELECT COUNT(*) as count FROM ${table} WHERE 1=1`;
    const params = [];

    // Build WHERE conditions from filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined) {
        if (
          typeof value === "object" &&
          value.operator &&
          value.value !== undefined
        ) {
          const operator = VALID_OPERATORS.includes(
            value.operator.toUpperCase()
          )
            ? value.operator.toUpperCase()
            : "=";
          query += ` AND ${key} ${operator} ?`;
          params.push(value.value);
        } else {
          query += ` AND ${key} = ?`;
          params.push(value);
        }
      }
    }

    const result = await this.executeQuery(query, params, {
      operation: "first",
      table,
      userId,
      skipRateLimit,
      context: { count: true, filters },
    });

    return result.data?.count || 0;
  }

  /**
   * Create a new record
   * @param {string} table - Table name (must be whitelisted)
   * @param {Object} data - Record data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Created record result
   */
  async create(table, data, options = {}) {
    this.validateTable(table);

    const { userId = null, skipRateLimit = false, auditLog = true } = options;

    // Validate data
    const validatedData = this.validateRecordData(data);

    // Build INSERT query
    const columns = Object.keys(validatedData);
    const placeholders = columns.map(() => "?").join(", ");
    const values = Object.values(validatedData);

    const query = `INSERT INTO ${table} (${columns.join(
      ", "
    )}) VALUES (${placeholders})`;

    const result = await this.executeQuery(query, values, {
      operation: "run",
      table,
      userId,
      skipRateLimit,
      context: { create: true, data: validatedData, auditLog },
    });

    // Get the created record if we have an ID
    if (result.lastRowId) {
      return await this.findById(table, result.lastRowId, "*", {
        userId,
        skipRateLimit,
      });
    }

    return { id: result.lastRowId, ...validatedData };
  }

  /**
   * Update a record by ID
   * @param {string} table - Table name (must be whitelisted)
   * @param {string|number} id - Record ID
   * @param {Object} data - Update data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Updated record result
   */
  async updateById(table, id, data, options = {}) {
    this.validateTable(table);

    const { userId = null, skipRateLimit = false, auditLog = true } = options;

    // Validate data
    const validatedData = this.validateRecordData(data);

    if (Object.keys(validatedData).length === 0) {
      throw new DatabaseError(
        "No valid fields to update",
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    }

    // Build UPDATE query
    const setClause = Object.keys(validatedData)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(validatedData), id];

    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;

    const result = await this.executeQuery(query, values, {
      operation: "run",
      table,
      userId,
      skipRateLimit,
      context: {
        updateById: true,
        recordId: id,
        data: validatedData,
        auditLog,
      },
    });

    // Get the updated record
    return await this.findById(table, id, "*", { userId, skipRateLimit });
  }

  /**
   * Delete a record by ID
   * @param {string} table - Table name (must be whitelisted)
   * @param {string|number} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Deletion result
   */
  async deleteById(table, id, options = {}) {
    this.validateTable(table);

    const { userId = null, skipRateLimit = false, auditLog = true } = options;

    // Check dependencies before deletion
    await this.checkDependencies(table, id);

    const query = `DELETE FROM ${table} WHERE id = ?`;

    const result = await this.executeQuery(query, [id], {
      operation: "run",
      table,
      userId,
      skipRateLimit,
      context: { deleteById: true, recordId: id, auditLog },
    });

    return { success: true, changes: result.changes };
  }

  /**
   * Check dependencies for a record before deletion
   * @param {string} table - Table name
   * @param {string|number} id - Record ID
   * @returns {Promise<void>}
   */
  async checkDependencies(table, id) {
    const dependencies = this.hardcodedDependencies[table] || [];

    for (const dep of dependencies) {
      const count = await this.count(dep.table, { [dep.column]: id });
      if (count > 0) {
        throw new DatabaseError(
          `Cannot delete ${table} record: ${count} dependent ${dep.table} records exist`,
          DB_ERROR_CODES.DEPENDENCY,
          { table, id, dependency: dep, count }
        );
      }
    }
  }

  // ============================================================================
  // SECURITY AND VALIDATION METHODS
  // ============================================================================

  /**
   * Validate table name against whitelist
   * @private
   * @param {string} table - Table name to validate
   */
  validateTable(table) {
    if (!ALLOWED_TABLES.includes(table)) {
      throw new DatabaseError(
        `Table '${table}' is not allowed`,
        DB_ERROR_CODES.INVALID_TABLE,
        { table, allowedTables: ALLOWED_TABLES }
      );
    }
  }

  /**
   * Validate query structure for security
   * @private
   * @param {string} query - SQL query to validate
   */
  validateQueryStructure(query) {
    if (!query || typeof query !== "string") {
      throw new DatabaseError(
        "Invalid query",
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    }

    // Basic SQL injection checks
    const dangerousPatterns = [
      /(\bUNION\b|\bDROP\b|\bALTER\b|\bCREATE\b|\bTRUNCATE\b)/i,
      /(-{2}|\/\*|\*\/)/, // Comments
      /;\s*(SELECT|INSERT|UPDATE|DELETE)/i, // Multiple statements
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        this.logger.security("Suspicious query pattern detected", {
          query: this.sanitizeQueryForLogging(query),
          pattern: pattern.toString(),
        });
        throw new DatabaseError(
          "Query contains suspicious patterns",
          DB_ERROR_CODES.SUSPICIOUS_ACTIVITY,
          { query: this.sanitizeQueryForLogging(query) }
        );
      }
    }
  }

  /**
   * Sanitize parameters for safe binding
   * @private
   * @param {Array} params - Parameters to sanitize
   * @returns {Array} Sanitized parameters
   */
  sanitizeParams(params) {
    if (!Array.isArray(params)) {
      throw new DatabaseError(
        "Parameters must be an array",
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    }

    return params.map((param) => {
      // Basic type validation and conversion
      if (param === null || param === undefined) {
        return null;
      }

      if (typeof param === "string") {
        // Limit string length
        if (param.length > 10000) {
          throw new DatabaseError(
            "Parameter too long",
            DB_ERROR_CODES.INVALID_PARAMETER
          );
        }
        return param;
      }

      if (typeof param === "number") {
        if (!isFinite(param)) {
          throw new DatabaseError(
            "Invalid number parameter",
            DB_ERROR_CODES.INVALID_PARAMETER
          );
        }
        return param;
      }

      if (typeof param === "boolean") {
        return param ? 1 : 0;
      }

      // Convert objects to JSON strings
      if (typeof param === "object") {
        try {
          const jsonStr = JSON.stringify(param);
          if (jsonStr.length > 50000) {
            throw new DatabaseError(
              "Parameter object too large",
              DB_ERROR_CODES.INVALID_PARAMETER
            );
          }
          return jsonStr;
        } catch (error) {
          throw new DatabaseError(
            "Invalid parameter object",
            DB_ERROR_CODES.INVALID_PARAMETER
          );
        }
      }

      throw new DatabaseError(
        `Unsupported parameter type: ${typeof param}`,
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    });
  }

  /**
   * Validate record data for create/update operations
   * @private
   * @param {Object} data - Data to validate
   * @returns {Object} Validated data
   */
  validateRecordData(data) {
    if (!data || typeof data !== "object") {
      throw new DatabaseError(
        "Invalid data object",
        DB_ERROR_CODES.INVALID_PARAMETER
      );
    }

    const validated = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip system fields
      if (["id", "created_at", "updated_at"].includes(key)) {
        continue;
      }

      // Basic validation
      if (value === undefined) {
        continue; // Skip undefined values
      }

      // Type checking and conversion
      if (typeof value === "string" && value.length > 10000) {
        throw new DatabaseError(
          `Field '${key}' value too long`,
          DB_ERROR_CODES.INVALID_PARAMETER
        );
      }

      validated[key] = value;
    }

    return validated;
  }

  // ============================================================================
  // RATE LIMITING METHODS
  // ============================================================================

  /**
   * Check rate limit for user
   * @private
   * @param {string} userId - User ID
   */
  async checkRateLimit(userId) {
    if (!userId) return;

    const now = Date.now();
    const windowStart = now - this.config.RATE_LIMIT_WINDOW;

    // Get current request count for user
    const userRequests = this.rateLimitStore.get(userId) || [];

    // Filter out old requests
    const recentRequests = userRequests.filter((time) => time > windowStart);

    if (recentRequests.length >= this.config.RATE_LIMIT_MAX_QUERIES) {
      throw new DatabaseError(
        "Rate limit exceeded",
        DB_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        {
          userId,
          requestCount: recentRequests.length,
          limit: this.config.RATE_LIMIT_MAX_QUERIES,
          windowMs: this.config.RATE_LIMIT_WINDOW,
        }
      );
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimitStore.set(userId, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to clean up
      this.cleanupRateLimitStore();
    }
  }

  /**
   * Clean up old rate limit entries
   * @private
   */
  cleanupRateLimitStore() {
    const now = Date.now();
    const windowStart = now - this.config.RATE_LIMIT_WINDOW;

    for (const [userId, requests] of this.rateLimitStore.entries()) {
      const recentRequests = requests.filter((time) => time > windowStart);
      if (recentRequests.length === 0) {
        this.rateLimitStore.delete(userId);
      } else {
        this.rateLimitStore.set(userId, recentRequests);
      }
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING METHODS
  // ============================================================================

  /**
   * Update performance metrics
   * @private
   * @param {string} operation - Operation type
   * @param {string} table - Table name
   * @param {number} duration - Query duration in ms
   * @param {boolean} success - Whether operation succeeded
   */
  updateMetrics(operation, table, duration, success) {
    this.metrics.totalQueries++;

    if (!success) {
      this.metrics.failedQueries++;
    }

    // Update average query time
    const totalTime =
      this.metrics.avgQueryTime * (this.metrics.totalQueries - 1) + duration;
    this.metrics.avgQueryTime = totalTime / this.metrics.totalQueries;
  }

  /**
   * Check if query should be logged
   * @private
   * @param {number} duration - Query duration in ms
   * @returns {boolean}
   */
  shouldLogQuery(duration) {
    // Always log in development, only slow queries in production
    return !this.isProduction || duration > 1000;
  }

  /**
   * Track slow query
   * @private
   * @param {string} query - SQL query
   * @param {number} duration - Query duration in ms
   * @param {string} table - Table name
   * @param {string} operation - Operation type
   */
  trackSlowQuery(query, duration, table, operation) {
    this.metrics.slowQueries.push({
      query: this.sanitizeQueryForLogging(query),
      duration,
      table,
      operation,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 slow queries
    if (this.metrics.slowQueries.length > 100) {
      this.metrics.slowQueries.shift();
    }

    this.logger.warn("Slow query detected", {
      duration,
      table,
      operation,
      query: this.sanitizeQueryForLogging(query),
    });
  }

  // ============================================================================
  // ERROR HANDLING METHODS
  // ============================================================================

  /**
   * Check if error is retryable
   * @private
   * @param {Error} error - Error to check
   * @returns {boolean}
   */
  isRetryableError(error) {
    // Retry on timeout or temporary connection issues
    const retryableCodes = ["SQLITE_BUSY", "SQLITE_LOCKED", "ETIMEDOUT"];
    return (
      retryableCodes.includes(error.code) || error.message?.includes("timeout")
    );
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   * @private
   * @param {string} query - Query to sanitize
   * @returns {string}
   */
  sanitizeQueryForLogging(query) {
    if (!query) return "";

    // Remove password-related content
    let sanitized = query.replace(
      /\b(password|token|secret|key)\s*=\s*['"][^'"]*['"]/gi,
      "$1=***"
    );

    // Truncate if too long
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + "...";
    }

    return sanitized;
  }

  /**
   * Sanitize error for logging
   * @private
   * @param {Error} error - Error to sanitize
   * @returns {Object}
   */
  sanitizeError(error) {
    if (!error) return {};

    return {
      code: error.code,
      message: error.message?.substring(0, 200), // Limit message length
      // Don't include stack trace in production logs
      stack: this.isProduction
        ? undefined
        : error.stack?.split("\n").slice(0, 3),
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate unique transaction ID
   * @private
   * @returns {string}
   */
  generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay execution for retry logic
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics = {
      totalQueries: 0,
      failedQueries: 0,
      avgQueryTime: 0,
      slowQueries: [],
    };
  }
}

// ============================================================================
// BASE REPOSITORY CLASS
// ============================================================================

/**
 * Base Repository class providing common CRUD operations
 */
export class BaseRepository {
  constructor(dbOperations, tableName) {
    this.db = dbOperations;
    this.tableName = tableName;
  }

  /**
   * Find by ID
   */
  async findById(id, options = {}) {
    return await this.db.findById(this.tableName, id, options.columns, options);
  }

  /**
   * Find multiple records
   */
  async findMany(filters = {}, options = {}) {
    return await this.db.findMany(this.tableName, filters, options);
  }

  /**
   * Count records
   */
  async count(filters = {}, options = {}) {
    return await this.db.count(this.tableName, filters, options);
  }

  /**
   * Create new record
   */
  async create(data, options = {}) {
    return await this.db.create(this.tableName, data, options);
  }

  /**
   * Update by ID
   */
  async updateById(id, data, options = {}) {
    return await this.db.updateById(this.tableName, id, data, options);
  }

  /**
   * Delete by ID
   */
  async deleteById(id, options = {}) {
    return await this.db.deleteById(this.tableName, id, options);
  }
}

// ============================================================================
// FARM REPOSITORY
// ============================================================================

/**
 * Farm Repository - Handles all farm-related database operations
 */
export class FarmRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "farms");
  }

  /**
   * Get farms owned by a user
   */
  async findByOwner(ownerId, options = {}) {
    const { results } = await this.db.executeQuery(
      `
      SELECT
        f.*,
        COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
        COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
      FROM farms f
      WHERE f.owner_id = ?
      ORDER BY f.created_at DESC
      ${options.limit ? `LIMIT ${options.limit}` : ""}
    `,
      [ownerId],
      {
        operation: "query",
        table: "farms",
        context: { findByOwner: true, ownerId, ...options.context },
      }
    );

    return results;
  }

  /**
   * Get farms accessible by a user (owner or member)
   */
  async findByUser(userId, options = {}) {
    const { results } = await this.db.executeQuery(
      `
      SELECT
        f.*,
        COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
        COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks,
        fm.role as user_role
      FROM farms f
      JOIN farm_members fm ON f.id = fm.farm_id
      WHERE fm.user_id = ?
      ORDER BY f.created_at DESC
      ${options.limit ? `LIMIT ${options.limit}` : ""}
    `,
      [userId],
      {
        operation: "query",
        table: "farms",
        context: { findByUser: true, userId, ...options.context },
      }
    );

    return results;
  }

  /**
   * Get farm with statistics
   */
  async findWithStats(farmId, options = {}) {
    const { userId } = options;
    const { results } = await this.db.executeQuery(
      `
      SELECT
        f.*,
        COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
        COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
      FROM farms f
      JOIN farm_members fm ON f.id = fm.farm_id
      WHERE f.id = ? AND fm.user_id = ?
    `,
      [farmId, userId],
      {
        operation: "first",
        table: "farms",
        context: { findWithStats: true, farmId, userId },
      }
    );

    return results;
  }

  /**
   * Create farm with initial setup
   */
  async create(data, options = {}) {
    const { userId } = options;

    const newFarm = await super.create(
      {
        ...data,
        owner_id: userId,
      },
      options
    );

    // Grant owner access
    await this.db.executeQuery(
      "INSERT INTO farm_members (farm_id, user_id, role) VALUES (?, ?, ?)",
      [newFarm.id, userId, "owner"],
      {
        operation: "run",
        table: "farm_members",
        context: { grantOwnerAccess: true },
      }
    );

    // Create initial statistics record
    await this.db.executeQuery(
      "INSERT INTO farm_statistics (farm_id, report_date) VALUES (?, ?)",
      [newFarm.id, new Date().toISOString().split("T")[0]],
      {
        operation: "run",
        table: "farm_statistics",
        context: { createInitialStats: true },
      }
    );

    return newFarm;
  }
}

// ============================================================================
// USER REPOSITORY
// ============================================================================

/**
 * User Repository - Handles all user-related database operations
 */
export class UserRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "users");
  }

  /**
   * Find user by email
   */
  async findByEmail(email, options = {}) {
    const result = await this.db.executeQuery(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email],
      {
        operation: "first",
        table: "users",
        context: { findByEmail: true, email, ...options.context },
      }
    );

    return result.data;
  }

  /**
   * Find user with farm count
   */
  async findWithFarmCount(userId, options = {}) {
    const result = await this.db.executeQuery(
      `
      SELECT
        u.*,
        COUNT(f.id) as farm_count
      FROM users u
      LEFT JOIN farms f ON f.owner_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `,
      [userId],
      {
        operation: "first",
        table: "users",
        context: { findWithFarmCount: true, userId, ...options.context },
      }
    );

    return result.data;
  }

  /**
   * Create user with validation
   */
  async createUser(data, options = {}) {
    // Check if email already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new DatabaseError(
        "User with this email already exists",
        DB_ERROR_CODES.DEPENDENCY,
        { email: data.email }
      );
    }

    return await this.create(data, options);
  }

  /**
   * Get user authentication data
   */
  async findAuthData(userId, options = {}) {
    const result = await this.db.executeQuery(
      `
      SELECT
        id,
        email,
        password_hash,
        name,
        is_active,
        created_at,
        updated_at,
        last_login
      FROM users
      WHERE id = ? AND is_active = 1
    `,
      [userId],
      {
        operation: "first",
        table: "users",
        context: { findAuthData: true, userId, ...options.context },
      }
    );

    return result.data;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId, options = {}) {
    return await this.updateById(
      userId,
      { last_login: new Date().toISOString() },
      options
    );
  }
}
