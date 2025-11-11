// Comprehensive audit logging for security events
// This file provides secure logging for authentication and system events

import { getSecurityHeaders } from "./_validation.js";

export class AuditLogger {
  constructor(env) {
    this.env = env;
    this.auditLogTable = "audit_logs";
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
