// Comprehensive Error Handling Utilities for Farm Management System
// Provides specific error types, structured logging, and consistent error responses
// Date: November 1, 2025

// ============================================================================
// ERROR TYPES AND CLASSIFICATION
// ============================================================================

export class DatabaseError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export class ValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.isOperational = true;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.isOperational = true;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.isOperational = true;
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.isOperational = true;
  }
}

export class ConflictError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ConflictError';
    this.field = field;
    this.isOperational = true;
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.isOperational = true;
  }
}

// ============================================================================
// ERROR CATEGORIES FOR DATABASE OPERATIONS
// ============================================================================

export const DATABASE_ERROR_CATEGORIES = {
  CONNECTION: 'DATABASE_CONNECTION_ERROR',
  CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',
  SYNTAX_ERROR: 'DATABASE_SYNTAX_ERROR',
  FOREIGN_KEY_VIOLATION: 'DATABASE_FOREIGN_KEY_VIOLATION',
  UNIQUE_VIOLATION: 'DATABASE_UNIQUE_VIOLATION',
  DATA_TYPE_MISMATCH: 'DATABASE_DATA_TYPE_MISMATCH',
  SCHEMA_MISMATCH: 'DATABASE_SCHEMA_MISMATCH',
  TRANSACTION_ERROR: 'DATABASE_TRANSACTION_ERROR',
  TIMEOUT_ERROR: 'DATABASE_TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'DATABASE_UNKNOWN_ERROR'
};

// ============================================================================
// DATABASE ERROR CLASSIFIER
// ============================================================================

export function classifyDatabaseError(error) {
  const message = error.message || error.toString();
  const code = error.code || '';
  
  // SQLite-specific error classification
  if (code === 'SQLITE_CONSTRAINT') {
    if (message.includes('UNIQUE constraint failed')) {
      return {
        category: DATABASE_ERROR_CATEGORIES.UNIQUE_VIOLATION,
        userMessage: 'A record with this identifier already exists',
        httpStatus: 409,
        retryable: false
      };
    }
    if (message.includes('FOREIGN KEY constraint failed')) {
      return {
        category: DATABASE_ERROR_CATEGORIES.FOREIGN_KEY_VIOLATION,
        userMessage: 'Referenced record does not exist',
        httpStatus: 400,
        retryable: false
      };
    }
    return {
      category: DATABASE_ERROR_CATEGORIES.CONSTRAINT_VIOLATION,
      userMessage: 'Data constraint violation',
      httpStatus: 400,
      retryable: false
    };
  }
  
  if (code === 'SQLITE_BUSY') {
    return {
      category: DATABASE_ERROR_CATEGORIES.TIMEOUT_ERROR,
      userMessage: 'Database is busy, please try again',
      httpStatus: 503,
      retryable: true
    };
  }
  
  if (code === 'SQLITE_LOCKED') {
    return {
      category: DATABASE_ERROR_CATEGORIES.TIMEOUT_ERROR,
      userMessage: 'Database is locked, please try again',
      httpStatus: 503,
      retryable: true
    };
  }
  
  if (message.includes('syntax error')) {
    return {
      category: DATABASE_ERROR_CATEGORIES.SYNTAX_ERROR,
      userMessage: 'Database query syntax error',
      httpStatus: 500,
      retryable: false
    };
  }
  
  if (message.includes('no such table')) {
    return {
      category: DATABASE_ERROR_CATEGORIES.SCHEMA_MISMATCH,
      userMessage: 'Database schema error',
      httpStatus: 500,
      retryable: false
    };
  }
  
  if (message.includes('no such column')) {
    return {
      category: DATABASE_ERROR_CATEGORIES.SCHEMA_MISMATCH,
      userMessage: 'Database column does not exist',
      httpStatus: 500,
      retryable: false
    };
  }
  
  if (message.includes('database is locked') || message.includes('SQLITE_BUSY')) {
    return {
      category: DATABASE_ERROR_CATEGORIES.CONNECTION,
      userMessage: 'Database connection error',
      httpStatus: 503,
      retryable: true
    };
  }
  
  // Default classification
  return {
    category: DATABASE_ERROR_CATEGORIES.UNKNOWN_ERROR,
    userMessage: 'Database operation failed',
    httpStatus: 500,
    retryable: false,
    originalError: message
  };
}

// ============================================================================
// STRUCTURED ERROR LOGGING
// ============================================================================

export function logError(error, context = {}) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    name: error.name || 'UnknownError',
    message: error.message || error.toString(),
    stack: error.stack,
    context: {
      ...context,
      userAgent: context.userAgent || 'unknown',
      userId: context.userId || null,
      farmId: context.farmId || null,
      operation: context.operation || 'unknown'
    }
  };
  
  // Add specific details for database errors
  if (error instanceof DatabaseError) {
    errorInfo.code = error.code;
    errorInfo.details = error.details;
  }
  
  // Log based on severity
  if (error.isOperational) {
    console.warn('Operational Error:', JSON.stringify(errorInfo, null, 2));
  } else {
    console.error('System Error:', JSON.stringify(errorInfo, null, 2));
  }
  
  return errorInfo;
}

// ============================================================================
// ENHANCED ERROR RESPONSE CREATORS
// ============================================================================

export function createDatabaseErrorResponse(error, context = {}) {
  const classification = classifyDatabaseError(error);
  const errorInfo = logError(error, {
    ...context,
    category: classification.category,
    operation: 'database_operation'
  });
  
  return new Response(JSON.stringify({
    error: {
      type: 'DATABASE_ERROR',
      category: classification.category,
      message: classification.userMessage,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        originalMessage: error.message
      })
    }
  }), {
    status: classification.httpStatus,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createValidationErrorResponse(error, context = {}) {
  logError(error, {
    ...context,
    operation: 'validation'
  });
  
  return new Response(JSON.stringify({
    error: {
      type: 'VALIDATION_ERROR',
      message: error.message,
      field: error.field,
      value: error.value,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createAuthenticationErrorResponse(error, context = {}) {
  logError(error, {
    ...context,
    operation: 'authentication'
  });
  
  return new Response(JSON.stringify({
    error: {
      type: 'AUTHENTICATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createAuthorizationErrorResponse(error, context = {}) {
  logError(error, {
    ...context,
    operation: 'authorization'
  });
  
  return new Response(JSON.stringify({
    error: {
      type: 'AUTHORIZATION_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createNotFoundErrorResponse(error, context = {}) {
  logError(error, {
    ...context,
    operation: 'not_found'
  });
  
  return new Response(JSON.stringify({
    error: {
      type: 'NOT_FOUND_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createConflictErrorResponse(error, context = {}) {
  logError(error, {
    ...context,
    operation: 'conflict'
  });
  
  return new Response(JSON.stringify({
    error: {
      type: 'CONFLICT_ERROR',
      message: error.message,
      field: error.field,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 409,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createRateLimitErrorResponse(error, context = {}) {
  logError(error, {
    ...context,
    operation: 'rate_limit'
  });
  
  return new Response(JSON.stringify({
    error: {
      type: 'RATE_LIMIT_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }
  }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createInternalErrorResponse(error, context = {}) {
  logError(error, {
    ...context,
    operation: 'internal_error'
  });
  
  return new Response(JSON.stringify({
    error: {
      type: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        originalMessage: error.message
      })
    }
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ============================================================================
// COMPREHENSIVE ERROR HANDLER
// ============================================================================

export function handleError(error, context = {}) {
  // Log the error first
  logError(error, context);
  
  // Handle specific error types
  if (error instanceof DatabaseError) {
    return createDatabaseErrorResponse(error, context);
  }
  
  if (error instanceof ValidationError) {
    return createValidationErrorResponse(error, context);
  }
  
  if (error instanceof AuthenticationError) {
    return createAuthenticationErrorResponse(error, context);
  }
  
  if (error instanceof AuthorizationError) {
    return createAuthorizationErrorResponse(error, context);
  }
  
  if (error instanceof NotFoundError) {
    return createNotFoundErrorResponse(error, context);
  }
  
  if (error instanceof ConflictError) {
    return createConflictErrorResponse(error, context);
  }
  
  if (error instanceof RateLimitError) {
    return createRateLimitErrorResponse(error, context);
  }
  
  // Handle unknown errors
  return createInternalErrorResponse(error, context);
}

// ============================================================================
// ERROR UTILITIES FOR COMMON SCENARIOS
// ============================================================================

export function createDatabaseError(message, code, details = {}) {
  return new DatabaseError(message, code, details);
}

export function createValidationError(message, field = null, value = null) {
  return new ValidationError(message, field, value);
}

export function createNotFoundError(resource = 'Resource') {
  return new NotFoundError(resource);
}

export function createConflictError(message, field = null) {
  return new ConflictError(message, field);
}

// ============================================================================
// ASYNC ERROR HANDLER DECORATOR
// ============================================================================

export function asyncErrorHandler(handler) {
  return async (request, env, ctx) => {
    try {
      return await handler(request, env, ctx);
    } catch (error) {
      return handleError(error, {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        userId: ctx.userId || null,
        farmId: ctx.farmId || null,
        operation: ctx.operation || 'api_call'
      });
    }
  };
}

// ============================================================================
// AUDIT LOGGING FOR SENSITIVE OPERATIONS
// ============================================================================

export function auditLog(action, resource, userId, farmId, details = {}) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    resource,
    userId,
    farmId,
    details,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown'
  };
  
  console.log('AUDIT_LOG:', JSON.stringify(auditEntry, null, 2));
  
  // In a production environment, you might want to store this in a dedicated audit table
  // return env.DB.prepare(`
  //   INSERT INTO audit_logs (user_id, farm_id, action, resource, details, created_at)
  //   VALUES (?, ?, ?, ?, ?, ?)
  // `).bind(userId, farmId, action, resource, JSON.stringify(details), auditEntry.timestamp).run();
}

export function createAuditError(action, resource, userId, farmId, error, details = {}) {
  auditLog(action, resource, userId, farmId, {
    ...details,
    error: error.message,
    errorType: error.name,
    success: false
  });
}

// Export everything for easy importing
export default {
  // Error classes
  DatabaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  
  // Constants
  DATABASE_ERROR_CATEGORIES,
  
  // Utilities
  classifyDatabaseError,
  logError,
  
  // Response creators
  createDatabaseErrorResponse,
  createValidationErrorResponse,
  createAuthenticationErrorResponse,
  createAuthorizationErrorResponse,
  createNotFoundErrorResponse,
  createConflictErrorResponse,
  createRateLimitErrorResponse,
  createInternalErrorResponse,
  handleError,
  
  // Error creators
  createDatabaseError,
  createValidationError,
  createNotFoundError,
  createConflictError,
  
  // Utilities
  asyncErrorHandler,
  auditLog,
  createAuditError
};