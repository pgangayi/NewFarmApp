// Enhanced Audit Logging System
// Comprehensive security and activity logging with real-time monitoring
// Date: November 12, 2025

import crypto from "crypto";

export class AuditLogger {
  constructor(env) {
    this.env = env;
    this.isEnabled = true;
  }

  // Log authentication events
  async logAuthEvent(
    eventType,
    userId,
    email,
    success,
    requestContext = {},
    additionalData = {}
  ) {
    try {
      if (!this.isEnabled) return;

      const eventId = `auth_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO audit_logs (
          id, event_type, user_id, email, ip_address, user_agent, 
          metadata, success, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          eventId,
          eventType,
          userId,
          email,
          requestContext.ipAddress || "unknown",
          requestContext.userAgent || "unknown",
          JSON.stringify({
            ...additionalData,
            sessionId: additionalData.sessionId,
            userAgentDetails: this.parseUserAgent(requestContext.userAgent),
            requestMethod: requestContext.method,
            requestPath: requestContext.path,
            timestamp: new Date().toISOString(),
          }),
          success ? 1 : 0
        )
        .run();

      // Real-time security analysis
      await this.analyzeAuthEvent(
        eventType,
        userId,
        success,
        requestContext,
        additionalData
      );

      // Log to console for immediate monitoring
      if (!success || eventType.includes("suspicious")) {
        console.warn(`SECURITY AUDIT: ${eventType}`, {
          userId,
          email,
          success,
          ipAddress: requestContext.ipAddress,
          eventId,
        });
      }

      return { success: true, eventId };
    } catch (error) {
      console.error("Audit logging error (auth):", error);
      return { success: false, error: "Failed to log auth event" };
    }
  }

  // Log access control events
  async logAccessEvent(
    userId,
    resource,
    action,
    result,
    farmId = null,
    requestContext = {},
    additionalData = {}
  ) {
    try {
      if (!this.isEnabled) return;

      const eventId = `access_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO audit_logs (
          id, event_type, user_id, ip_address, user_agent, 
          metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          eventId,
          `access_${action}`,
          userId,
          requestContext.ipAddress || "unknown",
          requestContext.userAgent || "unknown",
          JSON.stringify({
            resource,
            action,
            result,
            farmId,
            ...additionalData,
            accessPattern: this.analyzeAccessPattern(userId, resource, action),
            riskScore: this.calculateRiskScore(
              userId,
              resource,
              action,
              requestContext
            ),
          })
        )
        .run();

      // Check for suspicious access patterns
      await this.analyzeAccessEvent(
        userId,
        resource,
        action,
        result,
        requestContext
      );

      return { success: true, eventId };
    } catch (error) {
      console.error("Audit logging error (access):", error);
      return { success: false, error: "Failed to log access event" };
    }
  }

  // Log security events
  async logSecurityEvent(
    eventType,
    severity,
    userId,
    requestContext = {},
    eventData = {}
  ) {
    try {
      if (!this.isEnabled) return;

      const eventId = `security_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO security_events (
          id, event_type, severity, user_id, ip_address, user_agent, event_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          eventId,
          eventType,
          severity,
          userId,
          requestContext.ipAddress || "unknown",
          requestContext.userAgent || "unknown",
          JSON.stringify({
            ...eventData,
            threatLevel: this.calculateThreatLevel(
              eventType,
              severity,
              eventData
            ),
            mitigationActions: this.suggestMitigationActions(
              eventType,
              severity
            ),
          })
        )
        .run();

      // Real-time alerting for critical events
      if (severity === "critical" || severity === "high") {
        await this.triggerSecurityAlert(eventType, severity, userId, eventData);
      }

      // Console logging for immediate attention
      console.error(
        `SECURITY EVENT [${severity.toUpperCase()}]: ${eventType}`,
        {
          userId,
          eventData,
          eventId,
        }
      );

      return { success: true, eventId };
    } catch (error) {
      console.error("Audit logging error (security):", error);
      return { success: false, error: "Failed to log security event" };
    }
  }

  // Log data modification events
  async logDataEvent(
    userId,
    tableName,
    operation,
    recordId,
    changes,
    requestContext = {}
  ) {
    try {
      if (!this.isEnabled) return;

      const eventId = `data_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO audit_logs (
          id, event_type, user_id, ip_address, user_agent, 
          metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          eventId,
          `data_${operation}`,
          userId,
          requestContext.ipAddress || "unknown",
          requestContext.userAgent || "unknown",
          JSON.stringify({
            tableName,
            operation,
            recordId,
            changes: this.sanitizeChanges(changes),
            dataSensitivity: this.assessDataSensitivity(tableName),
            auditTrail: this.generateAuditTrail(changes),
          })
        )
        .run();

      return { success: true, eventId };
    } catch (error) {
      console.error("Audit logging error (data):", error);
      return { success: false, error: "Failed to log data event" };
    }
  }

  // Log system events
  async logSystemEvent(eventType, severity, details, requestContext = {}) {
    try {
      if (!this.isEnabled) return;

      const eventId = `system_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO audit_logs (
          id, event_type, user_id, ip_address, user_agent, 
          metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          eventId,
          `system_${eventType}`,
          null, // System events don't have user_id
          requestContext.ipAddress || "system",
          requestContext.userAgent || "system",
          JSON.stringify({
            severity,
            details,
            systemHealth: this.assessSystemHealth(eventType, details),
            autoRemediation: this.suggestSystemRemediation(eventType, details),
          })
        )
        .run();

      return { success: true, eventId };
    } catch (error) {
      console.error("Audit logging error (system):", error);
      return { success: false, error: "Failed to log system event" };
    }
  }

  // Get audit statistics
  async getAuditStats(timeRange = "24h") {
    try {
      const timeCondition = this.getTimeCondition(timeRange);

      const [authStats, accessStats, securityStats, dataStats, systemStats] =
        await Promise.all([
          // Authentication events
          this.env.DB.prepare(
            `
          SELECT 
            event_type,
            COUNT(*) as count,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
            SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures
          FROM audit_logs 
          WHERE event_type LIKE 'auth_%' 
            AND timestamp > ${timeCondition}
          GROUP BY event_type
        `
          ).all(),

          // Access control events
          this.env.DB.prepare(
            `
          SELECT 
            event_type,
            COUNT(*) as count,
            COUNT(DISTINCT user_id) as unique_users
          FROM audit_logs 
          WHERE event_type LIKE 'access_%' 
            AND timestamp > ${timeCondition}
          GROUP BY event_type
        `
          ).all(),

          // Security events by severity
          this.env.DB.prepare(
            `
          SELECT 
            severity,
            COUNT(*) as count,
            COUNT(DISTINCT user_id) as affected_users
          FROM security_events 
          WHERE detected_at > ${timeCondition}
          GROUP BY severity
        `
          ).all(),

          // Data modification events
          this.env.DB.prepare(
            `
          SELECT 
            event_type,
            COUNT(*) as count
          FROM audit_logs 
          WHERE event_type LIKE 'data_%' 
            AND timestamp > ${timeCondition}
          GROUP BY event_type
        `
          ).all(),

          // System events
          this.env.DB.prepare(
            `
          SELECT 
            event_type,
            COUNT(*) as count
          FROM audit_logs 
          WHERE event_type LIKE 'system_%' 
            AND timestamp > ${timeCondition}
          GROUP BY event_type
        `
          ).all(),
        ]);

      return {
        timeRange,
        timestamp: new Date().toISOString(),
        authentication: {
          totalEvents:
            authStats.results?.reduce((sum, stat) => sum + stat.count, 0) || 0,
          successRate: this.calculateSuccessRate(authStats.results),
          eventBreakdown: authStats.results || [],
        },
        accessControl: {
          totalEvents:
            accessStats.results?.reduce((sum, stat) => sum + stat.count, 0) ||
            0,
          uniqueUsers:
            accessStats.results?.reduce(
              (sum, stat) => sum + stat.unique_users,
              0
            ) || 0,
          eventBreakdown: accessStats.results || [],
        },
        security: {
          totalEvents:
            securityStats.results?.reduce((sum, stat) => sum + stat.count, 0) ||
            0,
          severityBreakdown: this.groupBySeverity(securityStats.results),
          criticalCount:
            securityStats.results?.find((s) => s.severity === "critical")
              ?.count || 0,
        },
        dataEvents: {
          totalEvents:
            dataStats.results?.reduce((sum, stat) => sum + stat.count, 0) || 0,
          eventBreakdown: dataStats.results || [],
        },
        system: {
          totalEvents:
            systemStats.results?.reduce((sum, stat) => sum + stat.count, 0) ||
            0,
          eventBreakdown: systemStats.results || [],
        },
      };
    } catch (error) {
      console.error("Error getting audit stats:", error);
      return {
        error: "Failed to retrieve audit statistics",
        timeRange,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Get suspicious activity report
  async getSuspiciousActivityReport(timeRange = "24h") {
    try {
      const timeCondition = this.getTimeCondition(timeRange);

      const [
        multipleFailures,
        unusualAccess,
        suspiciousIPs,
        privilegeEscalation,
      ] = await Promise.all([
        // Multiple login failures
        this.env.DB.prepare(
          `
          SELECT email, ip_address, COUNT(*) as failure_count
          FROM audit_logs 
          WHERE event_type = 'auth_login' 
            AND success = 0 
            AND timestamp > ${timeCondition}
          GROUP BY email, ip_address
          HAVING failure_count >= 3
          ORDER BY failure_count DESC
          LIMIT 50
        `
        ).all(),

        // Unusual access patterns
        this.env.DB.prepare(
          `
          SELECT user_id, ip_address, COUNT(DISTINCT resource) as unique_resources
          FROM audit_logs 
          WHERE event_type LIKE 'access_%' 
            AND timestamp > ${timeCondition}
          GROUP BY user_id, ip_address
          HAVING unique_resources >= 10
          ORDER BY unique_resources DESC
          LIMIT 50
        `
        ).all(),

        // Suspicious IP addresses
        this.env.DB.prepare(
          `
          SELECT ip_address, 
                 COUNT(*) as total_attempts,
                 SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures,
                 COUNT(DISTINCT user_id) as target_users
          FROM audit_logs 
          WHERE event_type = 'auth_login'
            AND timestamp > ${timeCondition}
          GROUP BY ip_address
          HAVING failures > total_attempts * 0.8 AND total_attempts >= 5
          ORDER BY total_attempts DESC
          LIMIT 50
        `
        ).all(),

        // Potential privilege escalation
        this.env.DB.prepare(
          `
          SELECT user_id, event_type, COUNT(*) as attempt_count
          FROM audit_logs 
          WHERE event_type IN ('access_manage', 'access_delete')
            AND metadata LIKE '%farm%' -- Looking for farm-related escalations
            AND timestamp > ${timeCondition}
          GROUP BY user_id, event_type
          HAVING attempt_count >= 5
          ORDER BY attempt_count DESC
        `
        ).all(),
      ]);

      return {
        timeRange,
        timestamp: new Date().toISOString(),
        multipleFailures: multipleFailures.results || [],
        unusualAccess: unusualAccess.results || [],
        suspiciousIPs: suspiciousIPs.results || [],
        privilegeEscalation: privilegeEscalation.results || [],
        recommendations: this.generateSuspiciousActivityRecommendations(
          multipleFailures.results,
          suspiciousIPs.results
        ),
      };
    } catch (error) {
      console.error("Error getting suspicious activity report:", error);
      return {
        error: "Failed to retrieve suspicious activity report",
        timeRange,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Analyze authentication events in real-time
  async analyzeAuthEvent(
    eventType,
    userId,
    success,
    requestContext,
    additionalData
  ) {
    try {
      // Check for rapid successive attempts
      if (!success) {
        await this.checkRapidAttempts(userId, requestContext.ipAddress);
      }

      // Check for geographic anomalies
      if (success) {
        await this.checkGeographicAnomalies(userId, requestContext);
      }

      // Check for time-based anomalies
      await this.checkTimeBasedAnomalies(userId, requestContext);
    } catch (error) {
      console.error("Error analyzing auth event:", error);
    }
  }

  // Check for rapid successive login attempts
  async checkRapidAttempts(userId, ipAddress) {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { results } = await this.env.DB.prepare(
        `
        SELECT COUNT(*) as attempt_count
        FROM audit_logs 
        WHERE event_type = 'auth_login' 
          AND success = 0 
          AND ip_address = ?
          AND timestamp > ?
      `
      )
        .bind(ipAddress, fiveMinutesAgo)
        .all();

      const attemptCount = results[0]?.attempt_count || 0;

      if (attemptCount >= 10) {
        await this.logSecurityEvent(
          "rapid_login_attempts",
          "high",
          userId,
          { ipAddress },
          { attemptCount, timeWindow: "5 minutes" }
        );
      }
    } catch (error) {
      console.error("Error checking rapid attempts:", error);
    }
  }

  // Check for geographic login anomalies
  async checkGeographicAnomalies(userId, requestContext) {
    // This would require geo-IP database integration
    // For now, we'll implement a basic version
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT ip_address, timestamp
        FROM audit_logs 
        WHERE event_type = 'auth_login' 
          AND user_id = ?
          AND success = 1
          AND timestamp > datetime('now', '-24 hours')
        ORDER BY timestamp DESC
        LIMIT 10
      `
      )
        .bind(userId)
        .all();

      if (results && results.length > 1) {
        // Simple geo-anomaly detection (would need real geo-IP data)
        const uniqueIPs = new Set(results.map((r) => r.ip_address));
        if (uniqueIPs.size >= 3) {
          await this.logSecurityEvent(
            "multiple_geographic_logins",
            "medium",
            userId,
            requestContext,
            { uniqueIPs: Array.from(uniqueIPs) }
          );
        }
      }
    } catch (error) {
      console.error("Error checking geographic anomalies:", error);
    }
  }

  // Check for time-based anomalies (logins at unusual hours)
  async checkTimeBasedAnomalies(userId, requestContext) {
    try {
      const currentHour = new Date().getHours();

      // Logins between 2 AM and 5 AM might be suspicious
      if (currentHour >= 2 && currentHour <= 5) {
        await this.logSecurityEvent(
          "unusual_time_login",
          "low",
          userId,
          requestContext,
          { loginHour: currentHour }
        );
      }
    } catch (error) {
      console.error("Error checking time-based anomalies:", error);
    }
  }

  // Helper methods
  parseUserAgent(userAgent) {
    if (!userAgent) return { raw: "unknown" };

    // Basic parsing - would be enhanced with proper UA parsing library
    return {
      raw: userAgent,
      isBot: /bot|crawler|spider/i.test(userAgent),
      isMobile: /mobile|android|iphone/i.test(userAgent),
      hasKnownPatterns: this.hasSuspiciousUA(userAgent),
    };
  }

  hasSuspiciousUA(userAgent) {
    const suspicious = ["curl", "wget", "python", "scrapy"];
    return suspicious.some((pattern) =>
      userAgent.toLowerCase().includes(pattern)
    );
  }

  analyzeAccessPattern(userId, resource, action) {
    // Analyze historical access patterns
    return {
      patternType: "normal", // Would be determined by ML/analytics
      riskLevel: "low",
      confidence: 0.95,
    };
  }

  calculateRiskScore(userId, resource, action, requestContext) {
    let score = 0;

    // Base score by action
    if (action === "delete") score += 30;
    else if (action === "manage") score += 20;
    else if (action === "write") score += 10;

    // Adjust for resource sensitivity
    if (resource === "users") score += 20;
    else if (resource === "farms") score += 15;

    return Math.min(100, score);
  }

  assessDataSensitivity(tableName) {
    const sensitiveTables = [
      "users",
      "finance_entries",
      "user_sessions",
      "audit_logs",
    ];
    return sensitiveTables.includes(tableName) ? "high" : "medium";
  }

  generateAuditTrail(changes) {
    // Generate before/after audit trail
    return {
      before: changes.before || {},
      after: changes.after || {},
      changedFields: Object.keys(changes.after || {}).filter(
        (key) => changes.before && changes.before[key] !== changes.after[key]
      ),
    };
  }

  calculateThreatLevel(eventType, severity, eventData) {
    const baseLevels = {
      critical: 90,
      high: 70,
      medium: 50,
      low: 30,
    };

    let level = baseLevels[severity] || 30;

    // Adjust based on event type
    if (eventType.includes("breach")) level += 10;
    if (eventType.includes("escalation")) level += 15;

    return Math.min(100, level);
  }

  suggestMitigationActions(eventType, severity) {
    const actions = [];

    if (severity === "critical") {
      actions.push(
        "Immediate account review",
        "Force password reset",
        "Enable MFA"
      );
    } else if (severity === "high") {
      actions.push(
        "Monitor closely",
        "Review permissions",
        "Consider temporary restrictions"
      );
    } else if (severity === "medium") {
      actions.push(
        "Log for analysis",
        "Review patterns",
        "Update security rules"
      );
    }

    return actions;
  }

  assessSystemHealth(eventType, details) {
    // Assess overall system health based on events
    return {
      status: "healthy",
      issues: [],
      recommendations: [],
    };
  }

  suggestSystemRemediation(eventType, details) {
    return [
      "Check system resources",
      "Review error logs",
      "Verify external dependencies",
    ];
  }

  calculateSuccessRate(authStats) {
    if (!authStats || authStats.length === 0) return 0;

    const total = authStats.reduce((sum, stat) => sum + stat.count, 0);
    const successes = authStats.reduce(
      (sum, stat) => sum + (stat.successes || 0),
      0
    );

    return total > 0 ? Math.round((successes / total) * 100) : 0;
  }

  groupBySeverity(securityStats) {
    if (!securityStats) return {};

    return securityStats.reduce((acc, stat) => {
      acc[stat.severity] = stat.count;
      return acc;
    }, {});
  }

  generateSuspiciousActivityRecommendations(multipleFailures, suspiciousIPs) {
    const recommendations = [];

    if (multipleFailures && multipleFailures.length > 0) {
      recommendations.push(
        "Review accounts with multiple failed login attempts"
      );
      recommendations.push("Consider implementing CAPTCHA for suspicious IPs");
    }

    if (suspiciousIPs && suspiciousIPs.length > 0) {
      recommendations.push("Block or monitor suspicious IP addresses");
      recommendations.push("Implement geo-blocking for high-risk regions");
    }

    recommendations.push("Enable real-time security monitoring");
    recommendations.push("Regular security awareness training for users");

    return recommendations;
  }

  triggerSecurityAlert(eventType, severity, userId, eventData) {
    // This would integrate with external alerting systems
    console.error(`SECURITY ALERT [${severity.toUpperCase()}]: ${eventType}`, {
      userId,
      eventData,
      timestamp: new Date().toISOString(),
    });
  }

  sanitizeChanges(changes) {
    // Remove sensitive data from audit logs
    const sanitized = { ...changes };

    // Remove or hash sensitive fields
    if (sanitized.password) sanitized.password = "[REDACTED]";
    if (sanitized.token) sanitized.token = "[REDACTED]";

    return sanitized;
  }

  getTimeCondition(timeRange) {
    const now = new Date();
    let interval;

    switch (timeRange) {
      case "1h":
        interval = 1;
        break;
      case "24h":
        interval = 24;
        break;
      case "7d":
        interval = 24 * 7;
        break;
      case "30d":
        interval = 24 * 30;
        break;
      default:
        interval = 24;
    }

    const startTime = new Date(now.getTime() - interval * 60 * 60 * 1000);
    return `datetime('${startTime.toISOString()}')`;
  }
}

// Export utility functions
export const AuditUtils = {
  // Sanitize data for logging
  sanitizeForLogging(data) {
    const sensitiveFields = ["password", "token", "secret", "key", "auth"];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    }

    return sanitized;
  },

  // Generate correlation ID for tracking events
  generateCorrelationId() {
    return `audit_${Date.now()}_${crypto.randomUUID().replace(/-/g, "")}`;
  },
};
