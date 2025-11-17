// Comprehensive Audit Logging System for Farm Management System
// Tracks sensitive operations for security, compliance, and monitoring
// Date: November 1, 2025

// ============================================================================
// AUDIT CONFIGURATION
// ============================================================================

export const AUDIT_CONFIG = {
  // Operations that require audit logging
  SENSITIVE_OPERATIONS: [
    'USER_LOGIN',
    'USER_LOGOUT', 
    'USER_SIGNUP',
    'PASSWORD_CHANGE',
    'FARM_CREATE',
    'FARM_UPDATE',
    'FARM_DELETE',
    'ANIMAL_CREATE',
    'ANIMAL_UPDATE',
    'ANIMAL_DELETE',
    'INVENTORY_UPDATE',
    'FINANCE_CREATE',
    'FINANCE_UPDATE',
    'FINANCE_DELETE',
    'TASK_ASSIGN',
    'TASK_COMPLETE',
    'ADMIN_ACCESS',
    'DATA_EXPORT',
    'BULK_OPERATIONS',
    'SYSTEM_CONFIG_CHANGE'
  ],

  // Risk levels for different operations
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium', 
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // Audit table columns
  AUDIT_TABLE_COLUMNS: [
    'id', 'user_id', 'farm_id', 'operation', 'resource_type',
    'resource_id', 'action', 'details', 'ip_address', 'user_agent',
    'session_id', 'risk_level', 'status', 'timestamp', 'duration_ms'
  ],

  // Maximum retention days
  RETENTION_DAYS: 90,

  // Batch size for cleanup
  CLEANUP_BATCH_SIZE: 1000
};

// ============================================================================
// AUDIT EVENT TYPES
// ============================================================================

export const AUDIT_EVENTS = {
  // Authentication events
  AUTH_LOGIN: 'USER_LOGIN',
  AUTH_LOGOUT: 'USER_LOGOUT',
  AUTH_SIGNUP: 'USER_SIGNUP',
  AUTH_TOKEN_REFRESH: 'TOKEN_REFRESH',
  AUTH_PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // Farm management
  FARM_CREATE: 'FARM_CREATE',
  FARM_UPDATE: 'FARM_UPDATE', 
  FARM_DELETE: 'FARM_DELETE',
  FARM_ACCESS_GRANT: 'FARM_ACCESS_GRANT',
  FARM_ACCESS_REVOKE: 'FARM_ACCESS_REVOKE',

  // Animal management
  ANIMAL_CREATE: 'ANIMAL_CREATE',
  ANIMAL_UPDATE: 'ANIMAL_UPDATE',
  ANIMAL_DELETE: 'ANIMAL_DELETE',
  ANIMAL_HEALTH_RECORD: 'ANIMAL_HEALTH_RECORD',
  ANIMAL_PRODUCTION_RECORD: 'ANIMAL_PRODUCTION_RECORD',

  // Inventory operations
  INVENTORY_UPDATE: 'INVENTORY_UPDATE',
  INVENTORY_LOW_STOCK_ALERT: 'INVENTORY_LOW_STOCK_ALERT',
  INVENTORY_TRANSACTION: 'INVENTORY_TRANSACTION',
  INVENTORY_BULK_UPDATE: 'INVENTORY_BULK_UPDATE',

  // Financial operations
  FINANCE_CREATE: 'FINANCE_CREATE',
  FINANCE_UPDATE: 'FINANCE_UPDATE',
  FINANCE_DELETE: 'FINANCE_DELETE',
  FINANCE_BULK_ENTRY: 'FINANCE_BULK_ENTRY',
  FINANCE_REPORT_GENERATED: 'FINANCE_REPORT_GENERATED',

  // Task management
  TASK_CREATE: 'TASK_CREATE',
  TASK_UPDATE: 'TASK_UPDATE',
  TASK_ASSIGN: 'TASK_ASSIGN',
  TASK_COMPLETE: 'TASK_COMPLETE',
  TASK_DELETE: 'TASK_DELETE',

  // System operations
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  SYSTEM_CONFIG_CHANGE: 'SYSTEM_CONFIG_CHANGE',
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT',
  BULK_OPERATIONS: 'BULK_OPERATIONS'
};

// ============================================================================
// AUDIT LOG ENTRY CREATOR
// ============================================================================

export class AuditLogger {
  constructor(env) {
    this.env = env;
    this.isEnabled = env.ENABLE_AUDIT_LOGGING !== 'false';
  }

  // Create audit log entry
  async logEvent(eventData) {
    if (!this.isEnabled) {
      return { success: false, reason: 'audit_logging_disabled' };
    }

    const {
      operation,
      resourceType,
      resourceId,
      action,
      userId,
      farmId,
      details = {},
      riskLevel = AUDIT_CONFIG.RISK_LEVELS.LOW,
      status = 'success',
      duration = null,
      request
    } = eventData;

    // Get client information
    const clientInfo = this.extractClientInfo(request);
    
    // Create audit entry
    const auditEntry = {
      id: this.generateAuditId(),
      userId,
      farmId,
      operation,
      resourceType,
      resourceId,
      action,
      details: JSON.stringify(details),
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      sessionId: clientInfo.sessionId,
      riskLevel,
      status,
      durationMs: duration,
      timestamp: new Date().toISOString()
    };

    try {
      // Store in audit_logs table (if exists)
      if (this.env.DB) {
        const result = await this.env.DB.prepare(`
          INSERT INTO audit_logs (
            id, user_id, farm_id, operation, resource_type, resource_id,
            action, details, ip_address, user_agent, session_id,
            risk_level, status, duration_ms, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          auditEntry.id,
          auditEntry.userId,
          auditEntry.farmId,
          auditEntry.operation,
          auditEntry.resourceType,
          auditEntry.resourceId,
          auditEntry.action,
          auditEntry.details,
          auditEntry.ipAddress,
          auditEntry.userAgent,
          auditEntry.sessionId,
          auditEntry.riskLevel,
          auditEntry.status,
          auditEntry.durationMs,
          auditEntry.timestamp
        ).run();

        if (result.success) {
          console.log('AUDIT_LOG:', JSON.stringify(auditEntry, null, 2));
          return { success: true, auditId: auditEntry.id };
        }
      }

      // Fallback to console logging if DB not available
      console.warn('AUDIT_LOG_FALLBACK:', JSON.stringify(auditEntry, null, 2));
      return { success: true, auditId: auditEntry.id, fallback: true };

    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Still log to console as fallback
      console.error('AUDIT_LOG_ERROR:', JSON.stringify(auditEntry, null, 2));
      return { success: false, error: error.message };
    }
  }

  // Extract client information from request
  extractClientInfo(request) {
    const ip = request?.headers?.get('x-forwarded-for') || 
               request?.headers?.get('x-real-ip') || 
               request?.headers?.get('cf-connecting-ip') || 
               'unknown';

    const userAgent = request?.headers?.get('user-agent') || 'unknown';
    
    // Extract session ID from headers or cookies
    const sessionId = request?.headers?.get('x-session-id') || 
                     this.extractSessionFromCookies(request) || 
                     'unknown';

    return { ip, userAgent, sessionId };
  }

  // Extract session from cookies
  extractSessionFromCookies(request) {
    const cookieHeader = request?.headers?.get('cookie');
    if (!cookieHeader) return null;
    
    const match = cookieHeader.match(/sessionId=([^;]+)/);
    return match ? match[1] : null;
  }

  // Generate unique audit ID
  generateAuditId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log operation with context
  async logOperation(operation, context = {}) {
    const {
      userId,
      farmId, 
      resourceType,
      resourceId,
      action,
      details = {},
      request,
      startTime = null,
      status = 'success'
    } = context;

    const duration = startTime ? Date.now() - startTime : null;
    const riskLevel = this.assessRiskLevel(operation, context);

    return await this.logEvent({
      operation,
      resourceType,
      resourceId,
      action,
      userId,
      farmId,
      details,
      riskLevel,
      status,
      duration,
      request
    });
  }

  // Assess risk level for operation
  assessRiskLevel(operation, context) {
    const highRiskOperations = [
      AUDIT_EVENTS.ADMIN_ACCESS,
      AUDIT_EVENTS.SYSTEM_CONFIG_CHANGE,
      AUDIT_EVENTS.DATA_EXPORT,
      AUDIT_EVENTS.BULK_OPERATIONS,
      AUDIT_EVENTS.FARM_DELETE,
      AUDIT_EVENTS.FINANCE_DELETE
    ];

    const mediumRiskOperations = [
      AUDIT_EVENTS.FARM_CREATE,
      AUDIT_EVENTS.FARM_UPDATE,
      AUDIT_EVENTS.ANIMAL_CREATE,
      AUDIT_EVENTS.ANIMAL_DELETE,
      AUDIT_EVENTS.INVENTORY_BULK_UPDATE,
      AUDIT_EVENTS.FINANCE_CREATE
    ];

    if (highRiskOperations.includes(operation)) {
      return AUDIT_CONFIG.RISK_LEVELS.HIGH;
    }

    if (mediumRiskOperations.includes(operation)) {
      return AUDIT_CONFIG.RISK_LEVELS.MEDIUM;
    }

    // Check for suspicious patterns
    if (this.isSuspiciousActivity(context)) {
      return AUDIT_CONFIG.RISK_LEVELS.CRITICAL;
    }

    return AUDIT_CONFIG.RISK_LEVELS.LOW;
  }

  // Detect suspicious activity
  isSuspiciousActivity(context) {
    const { ipAddress, userAgent, sessionId } = context;
    
    // Check for missing or unusual identifiers
    if (!ipAddress || ipAddress === 'unknown') return true;
    if (!userAgent || userAgent === 'unknown') return true;
    if (!sessionId || sessionId === 'unknown') return true;

    // Check for suspicious user agents
    const suspiciousAgents = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'
    ];
    
    const lowerAgent = userAgent.toLowerCase();
    if (suspiciousAgents.some(agent => lowerAgent.includes(agent))) {
      return true;
    }

    return false;
  }

  // Log security event
  async logSecurityEvent(eventType, context = {}) {
    const riskLevel = AUDIT_CONFIG.RISK_LEVELS.HIGH;
    
    return await this.logEvent({
      operation: eventType,
      resourceType: 'security',
      resourceId: context.resourceId || 'system',
      action: eventType,
      userId: context.userId,
      farmId: context.farmId,
      details: {
        ...context.details,
        securityEvent: true,
        requiresReview: true
      },
      riskLevel,
      request: context.request,
      status: context.status || 'success'
    });
  }

  // Clean up old audit logs
  async cleanupOldLogs(retentionDays = AUDIT_CONFIG.RETENTION_DAYS) {
    if (!this.env.DB) {
      return { success: false, reason: 'database_not_available' };
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.env.DB.prepare(`
        DELETE FROM audit_logs 
        WHERE created_at < ? 
        LIMIT ${AUDIT_CONFIG.CLEANUP_BATCH_SIZE}
      `).bind(cutoffDate.toISOString()).run();

      return {
        success: true,
        deletedCount: result.changes || 0,
        cutoffDate: cutoffDate.toISOString()
      };

    } catch (error) {
      console.error('Failed to cleanup audit logs:', error);
      return { success: false, error: error.message };
    }
  }

  // Get audit logs for analysis
  async getAuditLogs(filters = {}) {
    if (!this.env.DB) {
      return { success: false, reason: 'database_not_available' };
    }

    const {
      userId,
      farmId,
      operation,
      riskLevel,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (farmId) {
      query += ' AND farm_id = ?';
      params.push(farmId);
    }

    if (operation) {
      query += ' AND operation = ?';
      params.push(operation);
    }

    if (riskLevel) {
      query += ' AND risk_level = ?';
      params.push(riskLevel);
    }

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    try {
      const result = await this.env.DB.prepare(query).bind(...params).all();
      return { success: true, data: result.results || [] };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return { success: false, error: error.message };
    }
  }
}

// ============================================================================
// AUDIT MIDDLEWARE
// ============================================================================

export function createAuditMiddleware() {
  return {
    // Wrap async operations with audit logging
    wrapAsyncOperation(operation, logger, contextExtractor) {
      return async (request, env, ctx) => {
        const startTime = Date.now();
        const context = contextExtractor ? contextExtractor(request, env, ctx) : {};
        
        try {
          const result = await operation(request, env, ctx);
          
          // Log successful operation
          await logger.logOperation(context.operation, {
            ...context,
            request,
            startTime,
            status: 'success'
          });
          
          return result;
        } catch (error) {
          // Log failed operation
          await logger.logOperation(context.operation, {
            ...context,
            request,
            startTime,
            status: 'error',
            details: {
              error: error.message,
              stack: error.stack
            }
          });
          
          throw error;
        }
      };
    },

    // Middleware for authentication events
    authEvents: {
      async login(request, env, ctx, userId) {
        const logger = new AuditLogger(env);
        await logger.logSecurityEvent(AUDIT_EVENTS.AUTH_LOGIN, {
          userId,
          request,
          details: {
            loginTime: new Date().toISOString(),
            method: 'email_password'
          }
        });
      },

      async logout(request, env, ctx, userId) {
        const logger = new AuditLogger(env);
        await logger.logSecurityEvent(AUDIT_EVENTS.AUTH_LOGOUT, {
          userId,
          request,
          details: {
            logoutTime: new Date().toISOString()
          }
        });
      },

      async signup(request, env, ctx, userId) {
        const logger = new AuditLogger(env);
        await logger.logEvent({
          operation: AUDIT_EVENTS.AUTH_SIGNUP,
          resourceType: 'user',
          resourceId: userId,
          action: 'create',
          userId,
          request,
          details: {
            signupTime: new Date().toISOString(),
            method: 'email_password'
          },
          riskLevel: AUDIT_CONFIG.RISK_LEVELS.MEDIUM
        });
      }
    },

    // Middleware for CRUD operations
    crudOperations: {
      async create(resourceType, resourceId, userId, farmId, request, env, details = {}) {
        const logger = new AuditLogger(env);
        await logger.logOperation(`CREATE_${resourceType.toUpperCase()}`, {
          resourceType,
          resourceId,
          action: 'create',
          userId,
          farmId,
          request,
          details
        });
      },

      async update(resourceType, resourceId, userId, farmId, request, env, changes = {}) {
        const logger = new AuditLogger(env);
        await logger.logOperation(`UPDATE_${resourceType.toUpperCase()}`, {
          resourceType,
          resourceId,
          action: 'update',
          userId,
          farmId,
          request,
          details: { changes }
        });
      },

      async delete(resourceType, resourceId, userId, farmId, request, env) {
        const logger = new AuditLogger(env);
        await logger.logOperation(`DELETE_${resourceType.toUpperCase()}`, {
          resourceType,
          resourceId,
          action: 'delete',
          userId,
          farmId,
          request,
          riskLevel: AUDIT_CONFIG.RISK_LEVELS.MEDIUM
        });
      }
    }
  };
}

// ============================================================================
// EXPORT AUDIT SCHEMA
// ============================================================================

export const AUDIT_SCHEMA = {
  tableName: 'audit_logs',
  columns: [
    { name: 'id', type: 'TEXT PRIMARY KEY' },
    { name: 'user_id', type: 'TEXT' },
    { name: 'farm_id', type: 'INTEGER' },
    { name: 'operation', type: 'TEXT NOT NULL' },
    { name: 'resource_type', type: 'TEXT' },
    { name: 'resource_id', type: 'TEXT' },
    { name: 'action', type: 'TEXT' },
    { name: 'details', type: 'TEXT' },
    { name: 'ip_address', type: 'TEXT' },
    { name: 'user_agent', type: 'TEXT' },
    { name: 'session_id', type: 'TEXT' },
    { name: 'risk_level', type: 'TEXT DEFAULT "low"' },
    { name: 'status', type: 'TEXT DEFAULT "success"' },
    { name: 'duration_ms', type: 'INTEGER' },
    { name: 'created_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ],
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_farm ON audit_logs(farm_id)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_risk ON audit_logs(risk_level)'
  ]
};

// Export everything
export default {
  AuditLogger,
  createAuditMiddleware,
  AUDIT_CONFIG,
  AUDIT_EVENTS,
  AUDIT_SCHEMA
};