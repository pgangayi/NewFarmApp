// Comprehensive logging system for security events and general debugging
// This file provides secure logging for authentication, system events, and error debugging

import { getSecurityHeaders } from "./_validation.js";

/**
 * General Logger class for debugging and error logging
 */
export class Logger {
  constructor(env) {
    this.env = env;
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
    };
    this.currentLevel = this.env.NODE_ENV === 'development' ? this.levels.DEBUG : this.levels.INFO;
  }

  /**
   * Log error with context
   */
  error(message, context = {}) {
    if (this.currentLevel >= this.levels.ERROR) {
      const logEntry = {
        level: 'ERROR',
        message,
        context,
        timestamp: new Date().toISOString(),
        stack: context.error?.stack,
      };
      console.error('[ERROR]', logEntry);
    }
  }

  /**
   * Log warning
   */
  warn(message, context = {}) {
    if (this.currentLevel >= this.levels.WARN) {
      const logEntry = {
        level: 'WARN',
        message,
        context,
        timestamp: new Date().toISOString(),
      };
      console.warn('[WARN]', logEntry);
    }
  }

  /**
   * Log info
   */
  info(message, context = {}) {
    if (this.currentLevel >= this.levels.INFO) {
      const logEntry = {
        level: 'INFO',
        message,
        context,
        timestamp: new Date().toISOString(),
      };
      console.info('[INFO]', logEntry);
    }
  }

  /**
   * Log debug (development only)
   */
  debug(message, context = {}) {
    if (this.currentLevel >= this.levels.DEBUG) {
      const logEntry = {
        level: 'DEBUG',
        message,
        context,
        timestamp: new Date().toISOString(),
      };
      console.debug('[DEBUG]', logEntry);
    }
  }

  /**
   * Log API request/response
   */
  logRequest(method, url, statusCode, duration, userId = null) {
    const logEntry = {
      method,
      url,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= 400) {
      this.error(`API Error: ${method} ${url} - ${statusCode}`, logEntry);
    } else {
      this.info(`API Request: ${method} ${url} - ${statusCode}`, logEntry);
    }
  }
}

/**
 * Create logger instance
 */
export function createLogger(env) {
  return new Logger(env);
}

export class AuditLogger {
  constructor(env) {
    this.env = env;
    this.auditLogTable = "audit_logs";
  }

  // Standard logging methods expected by DatabaseOperations
  error(message, context = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "error",
      user_id: context.userId || null,
      email: null,
      ip_address: context.ip || "unknown",
      user_agent: context.userAgent || "unknown",
      metadata: JSON.stringify({ message, ...context }),
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (this.env.ENVIRONMENT === "development") {
      console.error(`[DB ERROR] ${message}`, context);
    }

    // Store in audit log (non-blocking)
    this.storeAuditLog(logEntry);
  }

  warn(message, context = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "warning",
      user_id: context.userId || null,
      email: null,
      ip_address: context.ip || "unknown",
      user_agent: context.userAgent || "unknown",
      metadata: JSON.stringify({ message, ...context }),
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (this.env.ENVIRONMENT === "development") {
      console.warn(`[DB WARN] ${message}`, context);
    }

    // Store in audit log (non-blocking)
    this.storeAuditLog(logEntry);
  }

  info(message, context = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "info",
      user_id: context.userId || null,
      email: null,
      ip_address: context.ip || "unknown",
      user_agent: context.userAgent || "unknown",
      metadata: JSON.stringify({ message, ...context }),
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (this.env.ENVIRONMENT === "development") {
      console.info(`[DB INFO] ${message}`, context);
    }

    // Store in audit log (non-blocking)
    this.storeAuditLog(logEntry);
  }

  logDatabase(operation, table, duration, success, context = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "database_operation",
      user_id: context.userId || null,
      email: null,
      ip_address: context.ip || "unknown",
      user_agent: context.userAgent || "unknown",
      metadata: JSON.stringify({
        operation,
        table,
        duration,
        success,
        ...context,
      }),
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (this.env.ENVIRONMENT === "development") {
      const status = success ? "SUCCESS" : "FAILED";
      console.log(
        `[DB ${status}] ${operation} on ${table} (${duration}ms)`,
        context
      );
    }

    // Store in audit log (non-blocking)
    this.storeAuditLog(logEntry);
  }

  security(message, context = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: "security",
      user_id: context.userId || null,
      email: null,
      ip_address: context.ip || "unknown",
      user_agent: context.userAgent || "unknown",
      metadata: JSON.stringify({ message, ...context }),
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (this.env.ENVIRONMENT === "development") {
      console.warn(`[SECURITY] ${message}`, context);
    }

    // Store in audit log (non-blocking)
    this.storeAuditLog(logEntry);
  }

  // Store audit log entry (non-blocking)
  async storeAuditLog(logEntry) {
    // Only attempt to store if DB is available
    if (!this.env || !this.env.DB) {
      // In development, log to console instead
      if (this.env && this.env.ENVIRONMENT === "development") {
        console.log(`[AUDIT LOG] ${logEntry.event_type}: ${logEntry.metadata}`);
      }
      return;
    }

    try {
      await this.env.DB.prepare(
        `
        INSERT INTO ${this.auditLogTable}
        (id, event_type, user_id, email, ip_address, user_agent, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          logEntry.id,
          logEntry.event_type,
          logEntry.user_id,
          logEntry.email,
          logEntry.ip_address,
          logEntry.user_agent,
          logEntry.metadata,
          logEntry.timestamp
        )
        .run();
    } catch (error) {
      // Log to console in development, but don't fail the request
      if (this.env.ENVIRONMENT === "development") {
        console.error("Audit log failed:", error);
      }
    }
  }

  // Log authentication events
  async logAuthEvent(eventType, userId, email, ip, userAgent, metadata = {}) {
    const logEntry = {
      id: this.generateLogId(),
      event_type: eventType,
      user_id: userId || null,
      email: email || null,
      ip_address: ip,
      user_agent: userAgent,
      metadata: JSON.stringify(metadata),
      timestamp: new Date().toISOString(),
    };

    try {
      await this.env.DB.prepare(
        `
        INSERT INTO ${this.auditLogTable}
        (id, event_type, user_id, email, ip_address, user_agent, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          logEntry.id,
          logEntry.event_type,
          logEntry.user_id,
          logEntry.email,
          logEntry.ip_address,
          logEntry.user_agent,
          logEntry.metadata,
          logEntry.timestamp
        )
        .run();
    } catch (error) {
      // Log to console in development, but don't fail the request
      if (this.env.ENVIRONMENT === "development") {
        console.error("Audit log failed:", error);
      }
    }
  }

  // Log security events
  async logSecurityEvent(eventType, details, ip, userAgent) {
    await this.logAuthEvent("security", null, null, ip, userAgent, {
      event_type: eventType,
      ...details,
    });
  }

  // Log data access events
  async logDataAccess(resource, action, userId, resourceId, ip) {
    await this.logAuthEvent("data_access", userId, null, ip, null, {
      resource,
      action,
      resource_id: resourceId,
    });
  }

  // Generate unique log ID
  generateLogId() {
    return `audit_${Date.now()}_${crypto.randomUUID()}`;
  }

  // Get recent audit logs for a user
  async getUserAuditLogs(userId, limit = 100) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT * FROM ${this.auditLogTable}
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `
      )
        .bind(userId, limit)
        .all();

      return results || [];
    } catch (error) {
      return [];
    }
  }

  // Get security events for monitoring
  async getSecurityEvents(hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { results } = await this.env.DB.prepare(
        `
        SELECT * FROM ${this.auditLogTable}
        WHERE event_type = 'security'
        AND timestamp > ?
        ORDER BY timestamp DESC
      `
      )
        .bind(since)
        .all();

      return results || [];
    } catch (error) {
      return [];
    }
  }
}

// Create audit logger instance
export function createAuditLogger(env) {
  return new AuditLogger(env);
}

// Get client IP address
export function getClientIP(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    request.headers.get("X-Real-IP") ||
    "unknown"
  );
}

// Get user agent
export function getUserAgent(request) {
  return request.headers.get("User-Agent") || "unknown";
}

// Security event types
export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILURE: "login_failure",
  LOGOUT: "logout",
  SIGNUP_SUCCESS: "signup_success",
  SIGNUP_FAILURE: "signup_failure",
  PASSWORD_RESET_REQUEST: "password_reset_request",
  PASSWORD_RESET_SUCCESS: "password_reset_success",
  PASSWORD_RESET_FAILURE: "password_reset_failure",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  UNAUTHORIZED_ACCESS: "unauthorized_access",
  DATA_EXPORT: "data_export",
  ADMIN_ACTION: "admin_action",
};

// Create secure response with audit logging
export async function createSecureResponse(
  data,
  status = 200,
  auditInfo = null
) {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getSecurityHeaders(),
    },
  });

  // Add audit logging if provided
  if (auditInfo) {
    const auditLogger = createAuditLogger(auditInfo.env);
    await auditLogger.logAuthEvent(
      auditInfo.eventType,
      auditInfo.userId,
      auditInfo.email,
      auditInfo.ip,
      auditInfo.userAgent,
      auditInfo.metadata
    );
  }

  return response;
}
