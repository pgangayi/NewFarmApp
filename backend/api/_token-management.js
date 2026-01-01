// Enhanced Token Management System
// Supports token revocation, validation, and security monitoring
// Date: November 12, 2025

import crypto from "crypto";

export class TokenManager {
  constructor(env) {
    this.env = env;
  }

  // Hash token for secure storage and comparison
  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  // Check if token is revoked
  async isTokenRevoked(token, tokenType = "access") {
    try {
      const tokenHash = this.hashToken(token);

      const { results } = await this.env.DB.prepare(
        `
        SELECT revoked_at, reason, expires_at 
        FROM revoked_tokens 
        WHERE token_hash = ? AND token_type = ?
      `
      )
        .bind(tokenHash, tokenType)
        .all();

      if (results && results.length > 0) {
        const revocation = results[0];

        // Check if token has already expired (no need to track expired revoked tokens)
        if (new Date(revocation.expires_at) < new Date()) {
          // Clean up expired revocation record
          await this.cleanupExpiredRevocations();
          return false;
        }

        return {
          revoked: true,
          reason: revocation.reason,
          revokedAt: revocation.revoked_at,
        };
      }

      return { revoked: false };
    } catch (error) {
      console.error("Error checking token revocation:", error);
      return { revoked: false, error: "Unable to verify token status" };
    }
  }

  // Revoke a token with full audit trail
  async revokeToken(
    token,
    userId,
    reason,
    tokenType = "access",
    initiatedBy = null,
    requestContext = {}
  ) {
    try {
      const tokenHash = this.hashToken(token);

      // Extract token expiration time if it's a JWT
      let expiresAt = new Date();
      try {
        const base64Payload = token.split(".")[1];
        if (base64Payload) {
          const payload = JSON.parse(
            Buffer.from(base64Payload, "base64").toString()
          );
          if (payload.exp) {
            expiresAt = new Date(payload.exp * 1000);
          }
        }
      } catch (jwtError) {
        console.warn("Could not extract expiration from token:", jwtError);
        // Default to 1 hour from now if we can't parse the token
        expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      }

      // Check if already revoked
      const existing = await this.env.DB.prepare(
        `
        SELECT id FROM revoked_tokens WHERE token_hash = ? AND token_type = ?
      `
      )
        .bind(tokenHash, tokenType)
        .all();

      if (existing.results && existing.results.length > 0) {
        return {
          success: false,
          message: "Token is already revoked",
        };
      }

      // Add to revocation list
      const revocationId = `rev_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO revoked_tokens (
          id, token_hash, user_id, token_type, reason, revoked_by, 
          ip_address, user_agent, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          revocationId,
          tokenHash,
          userId,
          tokenType,
          reason,
          initiatedBy,
          requestContext.ipAddress || "unknown",
          requestContext.userAgent || "unknown",
          expiresAt.toISOString()
        )
        .run();

      // Log security event
      await this.logSecurityEvent("token_revocation", userId, requestContext, {
        tokenType,
        reason,
        initiatedBy,
        expiresAt: expiresAt.toISOString(),
      });

      console.log(
        `Token revoked: ${tokenType} token for user ${userId}, reason: ${reason}`
      );

      return {
        success: true,
        revocationId,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      console.error("Error revoking token:", error);
      return {
        success: false,
        error: "Failed to revoke token",
      };
    }
  }

  // Batch revoke tokens (e.g., for password change)
  async revokeUserTokens(
    userId,
    reason,
    tokenTypes = ["access", "refresh"],
    initiatedBy = null,
    requestContext = {}
  ) {
    const results = {
      success: true,
      revoked: [],
      failed: [],
    };

    for (const tokenType of tokenTypes) {
      try {
        // This would typically involve storing refresh tokens or having a way to enumerate them
        // For now, we'll log the intent and rely on the blacklist check
        await this.logSecurityEvent(
          "bulk_token_revocation",
          userId,
          requestContext,
          {
            reason,
            tokenType,
            initiatedBy,
            batchOperation: true,
          }
        );

        results.revoked.push(tokenType);
      } catch (error) {
        console.error(`Failed to revoke ${tokenType} tokens:`, error);
        results.failed.push(tokenType);
      }
    }

    if (results.failed.length > 0) {
      results.success = false;
    }

    return results;
  }

  // Clean up expired revocation records
  async cleanupExpiredRevocations() {
    try {
      const { changes } = await this.env.DB.prepare(
        `
        DELETE FROM revoked_tokens 
        WHERE expires_at < datetime('now')
      `
      ).run();

      console.log(`Cleaned up ${changes} expired token revocations`);
      return changes;
    } catch (error) {
      console.error("Error cleaning up expired revocations:", error);
      return 0;
    }
  }

  // Login attempt tracking with security analysis
  async trackLoginAttempt(
    email,
    ipAddress,
    userAgent,
    success,
    failureReason = null
  ) {
    try {
      const attemptId = `attempt_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      // Store attempt (anonymized email for security)
      const anonymizedEmail = email
        ? this.hashToken(email.toLowerCase())
        : null;

      await this.env.DB.prepare(
        `
        INSERT INTO login_attempts (
          id, email, ip_address, user_agent, attempt_type, success, failure_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          attemptId,
          anonymizedEmail,
          ipAddress,
          userAgent,
          "login",
          success,
          failureReason
        )
        .run();

      // Check for suspicious patterns
      await this.analyzeLoginAttempts(ipAddress, userAgent);

      return { success: true, attemptId };
    } catch (error) {
      console.error("Error tracking login attempt:", error);
      return { success: false, error: "Failed to track login attempt" };
    }
  }

  // Analyze login attempts for security threats
  async analyzeLoginAttempts(ipAddress, userAgent) {
    try {
      const windowStart = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

      // Check for multiple failures from same IP
      const { results: recentFailures } = await this.env.DB.prepare(
        `
        SELECT COUNT(*) as failure_count
        FROM login_attempts 
        WHERE ip_address = ? 
          AND success = FALSE 
          AND attempted_at > ?
      `
      )
        .bind(ipAddress, windowStart.toISOString())
        .all();

      const failureCount = recentFailures[0]?.failure_count || 0;

      if (failureCount >= 5) {
        // Create security event
        await this.logSecurityEvent(
          "multiple_login_failures",
          null,
          { ipAddress, userAgent },
          {
            failureCount,
            timeWindow: "15 minutes",
            severity: failureCount >= 10 ? "high" : "medium",
          }
        );

        // Temporarily block IP
        const blockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await this.env.DB.prepare(
          `
          UPDATE login_attempts 
          SET blocked_until = ? 
          WHERE ip_address = ? 
            AND blocked_until IS NULL
            AND attempted_at > ?
        `
        )
          .bind(blockUntil.toISOString(), ipAddress, windowStart.toISOString())
          .run();
      }

      // Check for suspicious user agent patterns
      if (this.isSuspiciousUserAgent(userAgent)) {
        await this.logSecurityEvent(
          "suspicious_user_agent",
          null,
          { ipAddress, userAgent },
          {
            reason: "Unusual user agent pattern detected",
          }
        );
      }
    } catch (error) {
      console.error("Error analyzing login attempts:", error);
    }
  }

  // Check if IP is temporarily blocked
  async isIPBlocked(ipAddress) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT MAX(blocked_until) as max_blocked_until
        FROM login_attempts 
        WHERE ip_address = ? 
          AND blocked_until IS NOT NULL
          AND blocked_until > datetime('now')
      `
      )
        .bind(ipAddress)
        .all();

      const blockedUntil = results[0]?.max_blocked_until;
      if (blockedUntil && new Date(blockedUntil) > new Date()) {
        return {
          blocked: true,
          blockedUntil: blockedUntil,
        };
      }

      return { blocked: false };
    } catch (error) {
      console.error("Error checking IP block status:", error);
      return { blocked: false, error: "Unable to verify block status" };
    }
  }

  // Log security events for monitoring
  async logSecurityEvent(eventType, userId, requestContext, eventData = {}) {
    try {
      const eventId = `event_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      // Determine severity
      let severity = "low";
      if (eventType.includes("breach") || eventType.includes("escalation")) {
        severity = "critical";
      } else if (
        eventType.includes("multiple") ||
        eventType.includes("suspicious")
      ) {
        severity = "high";
      } else if (eventType.includes("failure")) {
        severity = "medium";
      }

      await this.env.DB.prepare(
        `
        INSERT INTO security_events (
          id, user_id, event_type, ip_address,
          user_agent, success, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          eventId,
          userId,
          eventType,
          requestContext.ipAddress || "unknown",
          requestContext.userAgent || "unknown",
          severity === "low" ? 1 : 0, // success: 1 for low severity, 0 for others
          JSON.stringify({ severity, ...eventData })
        )
        .run();

      // Log to console for immediate monitoring
      console.log(`SECURITY EVENT [${severity.toUpperCase()}]: ${eventType}`, {
        userId,
        ipAddress: requestContext.ipAddress,
        eventData,
      });

      return { success: true, eventId };
    } catch (error) {
      console.error("Error logging security event:", error);
      return { success: false, error: "Failed to log security event" };
    }
  }

  // Get security statistics for monitoring dashboard
  async getSecurityStats(timeRange = "24h") {
    try {
      const timeCondition = this.getTimeCondition(timeRange);

      // Get various security metrics
      const [recentRevocations, activeBlocks, securityEvents, loginStats] =
        await Promise.all([
          // Recent token revocations
          this.env.DB.prepare(
            `
          SELECT COUNT(*) as count 
          FROM revoked_tokens 
          WHERE revoked_at > ${timeCondition}
        `
          ).all(),

          // Active IP blocks
          this.env.DB.prepare(
            `
          SELECT COUNT(DISTINCT ip_address) as count 
          FROM login_attempts 
          WHERE blocked_until > datetime('now')
        `
          ).all(),

          // Security events by severity
          this.env.DB.prepare(
            `
          SELECT severity, COUNT(*) as count 
          FROM security_events 
          WHERE detected_at > ${timeCondition}
          GROUP BY severity
        `
          ).all(),

          // Login statistics
          this.env.DB.prepare(
            `
          SELECT 
            SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_logins,
            SUM(CASE WHEN success THEN 0 ELSE 1 END) as failed_logins,
            COUNT(DISTINCT ip_address) as unique_ips
          FROM login_attempts 
          WHERE attempted_at > ${timeCondition}
        `
          ).all(),
        ]);

      return {
        timeRange,
        tokenRevocations: recentRevocations[0]?.count || 0,
        activeIPBlocks: activeBlocks[0]?.count || 0,
        securityEvents: securityEvents.reduce((acc, event) => {
          acc[event.severity] = event.count;
          return acc;
        }, {}),
        loginStats: loginStats[0] || {
          successful_logins: 0,
          failed_logins: 0,
          unique_ips: 0,
        },
      };
    } catch (error) {
      console.error("Error getting security stats:", error);
      return {
        error: "Failed to retrieve security statistics",
        timeRange,
        tokenRevocations: 0,
        activeIPBlocks: 0,
        securityEvents: {},
        loginStats: { successful_logins: 0, failed_logins: 0, unique_ips: 0 },
      };
    }
  }

  // Helper: Generate time condition for database queries
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

  // Helper: Detect suspicious user agents
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;

    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /python/i,
      /scrapy/i,
    ];

    return (
      suspiciousPatterns.some((pattern) => pattern.test(userAgent)) ||
      userAgent.length < 10 ||
      userAgent.includes("undefined") ||
      userAgent.includes("null")
    );
  }

  // Cleanup old security data
  async performSecurityCleanup() {
    const results = {
      expiredRevocations: 0,
      oldLoginAttempts: 0,
      resolvedSecurityEvents: 0,
      totalCleaned: 0,
    };

    try {
      // Clean up expired token revocations
      const expiredResult = await this.cleanupExpiredRevocations();
      results.expiredRevocations = expiredResult;

      // Clean up old login attempts (30+ days)
      const { changes: loginChanges } = await this.env.DB.prepare(
        `
        DELETE FROM login_attempts 
        WHERE attempted_at < datetime('now', '-30 days')
      `
      ).run();
      results.oldLoginAttempts = loginChanges;

      // Clean up resolved security events (90+ days)
      const { changes: eventChanges } = await this.env.DB.prepare(
        `
        DELETE FROM security_events 
        WHERE resolved_at IS NOT NULL 
          AND resolved_at < datetime('now', '-90 days')
      `
      ).run();
      results.resolvedSecurityEvents = eventChanges;

      results.totalCleaned =
        results.expiredRevocations +
        results.oldLoginAttempts +
        results.resolvedSecurityEvents;

      console.log("Security cleanup completed:", results);
      return results;
    } catch (error) {
      console.error("Error during security cleanup:", error);
      return results;
    }
  }
}

// Export utility functions
export const TokenUtils = {
  // Generate secure token for various purposes
  generateSecureToken(length = 64) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Buffer.from(array)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  },

  // Validate token format
  isValidTokenFormat(token) {
    return (
      typeof token === "string" &&
      token.length >= 32 &&
      /^[A-Za-z0-9\-_]+$/.test(token)
    );
  },
};
