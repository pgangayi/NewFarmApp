// Comprehensive error handling and response system
// Standardizes error handling across all endpoints

import { getSecurityHeaders, sanitizeInput } from "./_validation.js";

// Error types
export const ERROR_TYPES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST_ERROR: "BAD_REQUEST_ERROR",
  CONFLICT_ERROR: "CONFLICT_ERROR",
  SECURITY_ERROR: "SECURITY_ERROR",
};

/**
 * Database Error class for structured error handling
 */
export class DatabaseError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Classify database errors based on error codes and messages
 */
export function classifyDatabaseError(error) {
  const message = error.message?.toLowerCase() || "";
  const code = error.code || "";

  // SQLite specific errors
  if (code === "SQLITE_CONSTRAINT" || message.includes("constraint")) {
    return "CONSTRAINT_VIOLATION";
  }

  if (code === "SQLITE_BUSY" || message.includes("database is locked")) {
    return "DATABASE_BUSY";
  }

  if (code === "SQLITE_FULL" || message.includes("disk full")) {
    return "DISK_FULL";
  }

  if (code === "SQLITE_CORRUPT" || message.includes("corrupt")) {
    return "DATABASE_CORRUPT";
  }

  // Generic database errors
  if (message.includes("timeout")) {
    return "TIMEOUT";
  }

  if (message.includes("connection")) {
    return "CONNECTION_ERROR";
  }

  if (message.includes("permission") || message.includes("access denied")) {
    return "PERMISSION_DENIED";
  }

  // Default classification
  return "UNKNOWN_ERROR";
}

/**
 * Log database errors with appropriate severity
 */
export function logError(error, context = {}) {
  const classification = classifyDatabaseError(error);

  const logData = {
    error: {
      message: error.message,
      code: error.code,
      classification,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  };

  // Log based on classification severity
  switch (classification) {
    case "DATABASE_CORRUPT":
    case "DISK_FULL":
      console.error("CRITICAL DATABASE ERROR:", logData);
      break;
    case "CONSTRAINT_VIOLATION":
    case "PERMISSION_DENIED":
      console.warn("DATABASE WARNING:", logData);
      break;
    default:
      console.error("DATABASE ERROR:", logData);
  }
}

/**
 * Create database error response for API endpoints
 */
export function createDatabaseErrorResponse(error, request, env = {}) {
  const classification = classifyDatabaseError(error);

  // Don't expose internal database details to clients
  let message = "Database operation failed";
  let statusCode = 500;
  let retryable = false;
  let retryAfter = null;

  switch (classification) {
    case "CONSTRAINT_VIOLATION":
      message = "Data validation failed";
      statusCode = 400;
      break;
    case "TIMEOUT":
      message = "Operation timed out, please try again";
      statusCode = 504;
      retryable = true;
      retryAfter = 30; // 30 seconds
      break;
    case "DATABASE_BUSY":
      message = "System is busy, please try again";
      statusCode = 503;
      retryable = true;
      retryAfter = 10; // 10 seconds
      break;
    case "PERMISSION_DENIED":
      message = "Access denied";
      statusCode = 403;
      break;
  }

  const errorHandler = new ErrorHandler({
    ENVIRONMENT: env.ENVIRONMENT || "production",
  });

  return errorHandler.createErrorResponse(
    "DATABASE_ERROR",
    message,
    statusCode,
    {
      classification,
      timestamp: new Date().toISOString(),
    },
    retryable,
    retryAfter,
  );
}

/**
 * Create internal error response for unexpected database errors
 */
export function createInternalErrorResponse(error, request, env = {}) {
  const errorHandler = new ErrorHandler({
    ENVIRONMENT: env.ENVIRONMENT || "production",
  });

  return errorHandler.internalError("An internal database error occurred", {
    error: error.message,
    timestamp: new Date().toISOString(),
  });
}

// Error response builder
export class ErrorHandler {
  constructor(env) {
    this.env = env;
  }

  // Create standardized error response
  createErrorResponse(
    errorType,
    message,
    statusCode = 400,
    details = null,
    retryable = false,
    retryAfter = null,
  ) {
    const errorResponse = {
      error: {
        type: errorType,
        message: message,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        retryable: retryable,
      },
    };

    // Add retryAfter if provided
    if (retryable && retryAfter) {
      errorResponse.error.retryAfter = retryAfter;
    }

    // Add details in development mode
    if (this.env.ENVIRONMENT === "development" && details) {
      errorResponse.error.details = details;
    }

    // Sanitize error message to prevent information disclosure
    errorResponse.error.message = sanitizeInput(message);

    const headers = {
      "Content-Type": "application/json",
      ...getSecurityHeaders(),
      "X-Error-Type": errorType,
    };

    // Add Retry-After header if retryable
    if (retryable && retryAfter) {
      headers["Retry-After"] = retryAfter.toString();
    }

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers,
    });
  }

  // Create validation error
  validationError(message, field = null) {
    const details = field
      ? { field, validation: message }
      : { validation: message };
    return this.createErrorResponse(
      ERROR_TYPES.VALIDATION_ERROR,
      message,
      400,
      details,
    );
  }

  // Create authentication error
  authenticationError(message = "Authentication required") {
    return this.createErrorResponse(
      ERROR_TYPES.AUTHENTICATION_ERROR,
      message,
      401,
    );
  }

  // Create authorization error
  authorizationError(message = "Insufficient permissions") {
    return this.createErrorResponse(
      ERROR_TYPES.AUTHORIZATION_ERROR,
      message,
      403,
    );
  }

  // Create not found error
  notFoundError(resource = "Resource") {
    return this.createErrorResponse(
      ERROR_TYPES.NOT_FOUND_ERROR,
      `${resource} not found`,
      404,
    );
  }

  // Create rate limit error
  rateLimitError(retryAfter = 60) {
    return this.createErrorResponse(
      ERROR_TYPES.RATE_LIMIT_ERROR,
      "Too many requests",
      429,
      { retryAfter },
      true,
      retryAfter,
    );
  }

  // Create bad request error
  badRequestError(message) {
    return this.createErrorResponse(
      ERROR_TYPES.BAD_REQUEST_ERROR,
      message,
      400,
    );
  }

  // Create conflict error
  conflictError(message) {
    return this.createErrorResponse(ERROR_TYPES.CONFLICT_ERROR, message, 409);
  }

  // Create internal server error
  internalError(message = "Internal server error", details = null) {
    // Don't expose internal details in production
    const errorMessage =
      this.env.ENVIRONMENT === "production" ? "Internal server error" : message;

    return this.createErrorResponse(
      ERROR_TYPES.INTERNAL_ERROR,
      errorMessage,
      500,
      details,
    );
  }

  // Create security error
  securityError(message = "Security violation detected") {
    return this.createErrorResponse(ERROR_TYPES.SECURITY_ERROR, message, 403, {
      severity: "high",
    });
  }

  // Handle and log unexpected errors
  handleUnexpectedError(error, request = null) {
    // Log the error for monitoring
    if (request) {
      console.error(`Unexpected error in ${request.url}:`, error);
    } else {
      console.error("Unexpected error:", error);
    }

    return this.internalError("An unexpected error occurred");
  }
}

// Success response builder
export class ResponseHandler {
  constructor(env) {
    this.env = env;
  }

  // Create standardized success response
  createSuccessResponse(data, statusCode = 200, message = null) {
    const response = {
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };

    if (message) {
      response.message = message;
    }

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        ...getSecurityHeaders(),
      },
    });
  }

  // Create created response
  createdResponse(data, message = "Resource created successfully") {
    return this.createSuccessResponse(data, 201, message);
  }

  // Create no content response
  noContentResponse() {
    return new Response(null, {
      status: 204,
      headers: {
        ...getSecurityHeaders(),
      },
    });
  }
}

// Request validation middleware
export function validateRequest(rules) {
  return async (request, env) => {
    const errorHandler = new ErrorHandler(env);

    try {
      const body = await request.json();

      // Check required fields
      for (const [field, rule] of Object.entries(rules)) {
        const value = body[field];

        // Required field check
        if (
          rule.required &&
          (value === undefined || value === null || value === "")
        ) {
          return errorHandler.validationError(`${field} is required`, field);
        }

        // Type validation
        if (value && rule.type) {
          switch (rule.type) {
            case "email":
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                return errorHandler.validationError(
                  "Invalid email format",
                  field,
                );
              }
              break;

            case "string":
              if (typeof value !== "string") {
                return errorHandler.validationError(
                  `${field} must be a string`,
                  field,
                );
              }
              if (rule.minLength && value.length < rule.minLength) {
                return errorHandler.validationError(
                  `${field} must be at least ${rule.minLength} characters`,
                  field,
                );
              }
              if (rule.maxLength && value.length > rule.maxLength) {
                return errorHandler.validationError(
                  `${field} must be at most ${rule.maxLength} characters`,
                  field,
                );
              }
              break;

            case "number":
              if (isNaN(Number(value))) {
                return errorHandler.validationError(
                  `${field} must be a number`,
                  field,
                );
              }
              break;
          }
        }

        // Custom validation
        if (value && rule.validator) {
          const isValid = await rule.validator(value);
          if (!isValid) {
            return errorHandler.validationError(
              rule.message || `${field} is invalid`,
              field,
            );
          }
        }
      }

      return { valid: true, data: body };
    } catch (error) {
      return errorHandler.badRequestError("Invalid request body");
    }
  };
}

// Create error handler instance
export function createErrorHandler(env) {
  return new ErrorHandler(env);
}

// Create response handler instance
export function createResponseHandler(env) {
  return new ResponseHandler(env);
}

// Global error handler for uncaught errors
export function createGlobalErrorHandler() {
  return {
    handle: (error, request) => {
      console.error("Global error handler:", error);

      const errorHandler = new ErrorHandler({
        ENVIRONMENT: process.env.ENVIRONMENT || "production",
      });

      // Don't expose internal errors to clients
      return errorHandler.internalError("An unexpected error occurred");
    },
  };
}
