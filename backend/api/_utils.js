// API Utilities for Farmers Boot
// Common utilities and patterns for API endpoints

import { createLogger } from "./_logger.js";
import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { AuditLogger } from "./_audit.js";

// Runtime logger factory - avoids module-level `process.env` reads
export function createRuntimeLogger(env) {
  return createLogger(env?.NODE_ENV || "development");
}

// Default runtime logger for module-level access
export const logger = createRuntimeLogger(process.env);

export class APIUtils {
  constructor(env) {
    this.env = env;
    this.auth = new AuthUtils(env);
    this.audit = new AuditLogger(env);
    this.logger = createRuntimeLogger(env);
  }

  // Standard API request handler with common patterns
  async handleRequest(request, handlers) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const method = request.method;

    try {
      // Initialize user from token
      const user = await this.auth.getUserFromToken(request);

      // Route to appropriate handler
      if (handlers[method]) {
        const result = await handlers[method]({
          request,
          user,
          url,
          env: this.env,
        });

        // Log successful operation
        if (this.logger.logRequest) {
          this.logger.logRequest(
            method,
            url.pathname,
            200,
            Date.now() - startTime,
            user?.id,
          );
        }
        await this.audit.logOperation("API_REQUEST", {
          userId: user?.id,
          resourceType: "api",
          resourceId: url.pathname,
          action: method.toLowerCase(),
          request,
          duration: Date.now() - startTime,
          status: "success",
        });

        return result;
      } else {
        return createErrorResponse("Method not allowed", 405);
      }
    } catch (error) {
      // Log error
      this.logger.error("API Request failed", {
        method,
        url: url.pathname,
        error: error.message,
      });

      await this.audit.logOperation("API_REQUEST", {
        resourceType: "api",
        resourceId: url.pathname,
        action: method.toLowerCase(),
        request,
        duration: Date.now() - startTime,
        status: "error",
        details: { error: error.message },
      });

      return createErrorResponse("Internal server error", 500);
    }
  }

  // Standard authentication middleware
  async requireAuth(request, required = true) {
    const user = await this.auth.getUserFromToken(request);

    if (!user && required) {
      this.logger.warn("Unauthorized access attempt", {
        url: new URL(request.url).pathname,
        hasAuth: !!user,
      });
      return { unauthorized: true };
    }

    return { user };
  }

  // Standard farm access control
  async requireFarmAccess(userId, farmId) {
    const hasAccess = await this.auth.hasFarmAccess(userId, farmId);

    if (!hasAccess) {
      this.logger.warn("Farm access denied", {
        userId: userId?.substring(0, 8) + "...",
        farmId,
      });
      return { accessDenied: true };
    }

    return { accessGranted: true };
  }

  // Standard input validation
  validateRequiredFields(body, requiredFields) {
    const missingFields = [];
    const errors = {};

    requiredFields.forEach((field) => {
      if (
        body[field] === undefined ||
        body[field] === null ||
        body[field] === ""
      ) {
        missingFields.push(field);
        errors[field] = `${field} is required`;
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
      errors,
    };
  }

  // Standard sanitization
  sanitizeInput(input, allowedFields = []) {
    if (!input || typeof input !== "object") return {};

    const sanitized = {};
    const fieldsToProcess =
      allowedFields.length > 0 ? allowedFields : Object.keys(input);

    fieldsToProcess.forEach((field) => {
      const value = input[field];
      if (value !== undefined) {
        // Basic sanitization - remove dangerous characters
        if (typeof value === "string") {
          let v = value.trim();
          // Strip script tags and their contents
          v = v.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
          // Remove any javascript: sequences entirely
          v = v.replace(/javascript:[\s\S]*/gi, "");
          // Remove quote characters if quotes not allowed (default)
          v = v.replace(/["']/g, "");
          sanitized[field] = v;
        } else {
          sanitized[field] = value;
        }
      }
    });

    return sanitized;
  }

  // Standard response formatting
  formatResponse(data, status = 200, message = null) {
    const response = { data };

    if (message) {
      response.message = message;
    }

    return createSuccessResponse(response, status);
  }

  // Standard error response
  formatError(error, status = 400, field = null) {
    const message = field ? `${field}: ${error}` : error;
    return createErrorResponse(message, status);
  }

  // Database query with error handling
  async executeQuery(query, params = [], operation = "query") {
    const startTime = Date.now();

    try {
      const result = await this.env.DB.prepare(query).bind(...params);

      // Determine if it's a run operation (INSERT, UPDATE, DELETE) or query
      let results;
      if (operation === "run") {
        const runResult = await result.run();
        results = {
          changes: runResult.changes,
          last_row_id: runResult.meta.last_row_id,
        };
      } else {
        const queryResult = await result.all();
        results = queryResult.results;
      }

      const duration = Date.now() - startTime;
      this.logger.logDatabase(operation, "unknown", duration, true);

      return { success: true, data: results, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabase(operation, "unknown", duration, false);
      this.logger.error("Database query failed", {
        query,
        error: error.message,
      });

      return { success: false, error: error.message, duration };
    }
  }

  // Get pagination parameters
  getPaginationParams(url) {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    return {
      page: Math.max(1, page),
      limit: Math.min(100, Math.max(1, limit)), // Cap at 100
      offset: Math.max(0, offset),
    };
  }

  // Build WHERE clause with parameters
  buildWhereClause(filters = {}, allowedFilters = []) {
    const conditions = [];
    const params = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (
        allowedFilters.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    });

    return {
      whereClause:
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
      params,
    };
  }

  // Log audit event
  async logAuditEvent(operation, context = {}) {
    try {
      await this.audit.logOperation(operation, {
        ...context,
        request: context?.request,
        duration: context?.duration,
      });
    } catch (error) {
      this.logger.warn("Audit logging failed", {
        operation,
        error: error.message,
      });
    }
  }
}

// Common response generators
export const Responses = {
  success: (data, message = "Success") =>
    createSuccessResponse({ data, message }),
  created: (data, message = "Created successfully") =>
    createSuccessResponse({ data, message }, 201),
  badRequest: (message, field = null) =>
    createErrorResponse(field ? `${field}: ${message}` : message, 400),
  unauthorized: (message = "Unauthorized") => createUnauthorizedResponse(),
  forbidden: (message = "Forbidden") => createErrorResponse(message, 403),
  notFound: (message = "Not found") => createErrorResponse(message, 404),
  error: (message = "Internal server error") =>
    createErrorResponse(message, 500),
};

// Validation schemas for common operations
export const Validation = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

  password: (password) => password.length >= 8,

  farm: {
    required: ["name", "location"],
    sanitize: ["name", "location"],
  },

  animal: {
    required: ["name", "species"],
    sanitize: ["name", "species", "breed"],
  },

  task: {
    required: ["title", "status"],
    sanitize: ["title", "description"],
  },
};

// Export utilities
export default {
  APIUtils,
  Responses,
  Validation,
  logger,
};
