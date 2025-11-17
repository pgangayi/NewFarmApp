// Enhanced CSRF Protection System
// Double-submit cookie pattern with additional security measures
// Date: November 12, 2025

import crypto from "crypto";

export class CSRFProtection {
  constructor(env) {
    this.env = env;
  }

  // Generate a cryptographically secure CSRF token
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Buffer.from(array)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  // Set CSRF cookie with security attributes
  setCSRFCookie(response, token, maxAge = 1800) {
    // 30 minutes default
    const cookieOptions = [
      `csrf_token=${token}`,
      `Max-Age=${maxAge}`,
      "Path=/",
      "HttpOnly=false", // Must be readable by JavaScript for double-submit
      "Secure=true", // Only over HTTPS
      "SameSite=Strict", // Prevents cross-site requests
    ].join("; ");

    response.headers.append("Set-Cookie", cookieOptions);
  }

  // Validate CSRF token using double-submit pattern
  async validateCSRFToken(request) {
    try {
      // Extract token from header
      const headerToken = request.headers.get("X-CSRF-Token");
      if (!headerToken) {
        return {
          valid: false,
          error: "CSRF token missing from header",
        };
      }

      // Extract token from cookie
      const cookieHeader = request.headers.get("Cookie");
      if (!cookieHeader) {
        return {
          valid: false,
          error: "Cookie header missing",
        };
      }

      const cookieToken = this.extractCookieValue(cookieHeader, "csrf_token");
      if (!cookieToken) {
        return {
          valid: false,
          error: "CSRF token missing from cookie",
        };
      }

      // Validate token format
      if (
        !this.isValidTokenFormat(headerToken) ||
        !this.isValidTokenFormat(cookieToken)
      ) {
        return {
          valid: false,
          error: "Invalid token format",
        };
      }

      // Compare tokens using constant-time comparison
      if (!this.secureCompare(headerToken, cookieToken)) {
        return {
          valid: false,
          error: "CSRF token mismatch",
        };
      }

      // Check if token exists in database (optional additional validation)
      const tokenExists = await this.tokenExistsInDatabase(headerToken);
      if (!tokenExists) {
        return {
          valid: false,
          error: "CSRF token not found in database",
        };
      }

      return {
        valid: true,
        token: headerToken,
      };
    } catch (error) {
      console.error("CSRF validation error:", error);
      return {
        valid: false,
        error: "CSRF validation failed",
      };
    }
  }

  // Store CSRF token in database for validation
  async storeCSRFToken(userId, token, requestContext = {}) {
    try {
      const tokenId = `csrf_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      await this.env.DB.prepare(
        `
        INSERT INTO csrf_tokens (
          id, user_id, token, expires_at, created_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(tokenId, userId, token, expiresAt.toISOString())
        .run();

      // Log CSRF token creation for security monitoring
      await this.logSecurityEvent(
        "csrf_token_created",
        userId,
        requestContext,
        {
          tokenId,
          expiresAt: expiresAt.toISOString(),
        }
      );

      return {
        success: true,
        tokenId,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      console.error("Error storing CSRF token:", error);
      return {
        success: false,
        error: "Failed to store CSRF token",
      };
    }
  }

  // Check if CSRF token exists in database
  async tokenExistsInDatabase(token) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT id FROM csrf_tokens 
        WHERE token = ? AND expires_at > datetime('now')
      `
      )
        .bind(token)
        .all();

      return results && results.length > 0;
    } catch (error) {
      console.error("Error checking CSRF token in database:", error);
      return false;
    }
  }

  // Clean up expired CSRF tokens
  async cleanupExpiredTokens() {
    try {
      const { changes } = await this.env.DB.prepare(
        `
        DELETE FROM csrf_tokens 
        WHERE expires_at <= datetime('now')
      `
      ).run();

      console.log(`Cleaned up ${changes} expired CSRF tokens`);
      return changes;
    } catch (error) {
      console.error("Error cleaning up CSRF tokens:", error);
      return 0;
    }
  }

  // Create CSRF protection middleware
  createCSRFProtection() {
    return async (request) => {
      // Skip CSRF check for GET, HEAD, and OPTIONS requests
      const method = request.method.toUpperCase();
      const safeMethods = ["GET", "HEAD", "OPTIONS"];

      if (safeMethods.includes(method)) {
        return {
          valid: true,
          skipValidation: true,
        };
      }

      // Validate CSRF token
      const validation = await this.validateCSRFToken(request);

      if (!validation.valid) {
        // Log potential CSRF attack
        await this.logSecurityEvent(
          "csrf_validation_failed",
          null,
          this.getRequestContext(request),
          {
            error: validation.error,
            method,
            url: request.url,
            userAgent: request.headers.get("user-agent"),
          }
        );

        // Create error response
        const response = new Response(
          JSON.stringify({
            error: "CSRF validation failed",
            message: "Invalid or missing CSRF token",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Error": validation.error,
            },
          }
        );

        return {
          valid: false,
          response,
          error: validation.error,
        };
      }

      return {
        valid: true,
        token: validation.token,
      };
    };
  }

  // Get request context for logging
  getRequestContext(request) {
    return {
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      method: request.method,
      url: request.url,
    };
  }

  // Get client IP address
  getClientIP(request) {
    return (
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      request.headers.get("X-Real-IP") ||
      "unknown"
    );
  }

  // Generate CSRF token and set cookie for frontend
  async generateAndSetToken(userId, response, requestContext = {}) {
    try {
      const token = this.generateCSRFToken();

      // Store token in database
      const storageResult = await this.storeCSRFToken(
        userId,
        token,
        requestContext
      );
      if (!storageResult.success) {
        return {
          success: false,
          error: storageResult.error,
        };
      }

      // Set CSRF cookie
      this.setCSRFCookie(response, token);

      // Also include token in response body for immediate use
      response.headers.set("X-CSRF-Token", token);

      return {
        success: true,
        token,
        tokenId: storageResult.tokenId,
        expiresAt: storageResult.expiresAt,
      };
    } catch (error) {
      console.error("Error generating CSRF token:", error);
      return {
        success: false,
        error: "Failed to generate CSRF token",
      };
    }
  }

  // Revoke CSRF token (force regeneration)
  async revokeCSRFToken(token, userId, requestContext = {}) {
    try {
      // Delete token from database
      const { changes } = await this.env.DB.prepare(
        `
        DELETE FROM csrf_tokens 
        WHERE token = ? AND user_id = ?
      `
      )
        .bind(token, userId)
        .run();

      if (changes > 0) {
        // Log token revocation
        await this.logSecurityEvent(
          "csrf_token_revoked",
          userId,
          requestContext,
          {
            token,
            revokedAt: new Date().toISOString(),
          }
        );

        return {
          success: true,
          revoked: true,
        };
      }

      return {
        success: false,
        revoked: false,
        error: "Token not found or already revoked",
      };
    } catch (error) {
      console.error("Error revoking CSRF token:", error);
      return {
        success: false,
        error: "Failed to revoke CSRF token",
      };
    }
  }

  // Batch revoke all CSRF tokens for a user (logout security)
  async revokeAllUserTokens(userId, requestContext = {}) {
    try {
      const { changes } = await this.env.DB.prepare(
        `
        DELETE FROM csrf_tokens WHERE user_id = ?
      `
      )
        .bind(userId)
        .run();

      // Log batch revocation
      await this.logSecurityEvent(
        "csrf_tokens_batch_revoked",
        userId,
        requestContext,
        {
          tokenCount: changes,
          revokedAt: new Date().toISOString(),
        }
      );

      return {
        success: true,
        revokedCount: changes,
      };
    } catch (error) {
      console.error("Error revoking user CSRF tokens:", error);
      return {
        success: false,
        error: "Failed to revoke CSRF tokens",
      };
    }
  }

  // Log security events for monitoring
  async logSecurityEvent(eventType, userId, requestContext, eventData = {}) {
    try {
      const eventId = `csrf_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      // Determine severity
      let severity = "low";
      if (eventType.includes("failed") || eventType.includes("attack")) {
        severity = "high";
      } else if (eventType.includes("revoked")) {
        severity = "medium";
      }

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
          JSON.stringify(eventData)
        )
        .run();

      // Log to console for immediate monitoring
      console.log(`CSRF SECURITY [${severity.toUpperCase()}]: ${eventType}`, {
        userId,
        ipAddress: requestContext.ipAddress,
        eventData,
      });
    } catch (error) {
      console.error("Error logging CSRF security event:", error);
    }
  }

  // Utility: Extract cookie value
  extractCookieValue(cookieHeader, name) {
    const cookies = cookieHeader.split(";");
    for (const cookie of cookies) {
      const [cookieName, ...valueParts] = cookie.trim().split("=");
      if (cookieName === name) {
        return valueParts.join("=");
      }
    }
    return null;
  }

  // Utility: Validate token format
  isValidTokenFormat(token) {
    return (
      typeof token === "string" &&
      token.length >= 32 &&
      /^[A-Za-z0-9\-_]+$/.test(token)
    );
  }

  // Utility: Constant-time string comparison
  secureCompare(a, b) {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Get CSRF statistics for monitoring
  async getCSRFStats(timeRange = "24h") {
    try {
      const timeCondition = this.getTimeCondition(timeRange);

      const [tokenCreations, tokenValidations, securityEvents] =
        await Promise.all([
          // Recent token creations
          this.env.DB.prepare(
            `
          SELECT COUNT(*) as count 
          FROM csrf_tokens 
          WHERE created_at > ${timeCondition}
        `
          ).all(),

          // Token validations from audit logs
          this.env.DB.prepare(
            `
          SELECT COUNT(*) as count 
          FROM audit_logs 
          WHERE event_type = 'csrf_validation' 
            AND timestamp > ${timeCondition}
        `
          ).all(),

          // CSRF-related security events
          this.env.DB.prepare(
            `
          SELECT event_type, COUNT(*) as count 
          FROM security_events 
          WHERE event_type LIKE 'csrf_%' 
            AND detected_at > ${timeCondition}
          GROUP BY event_type
        `
          ).all(),
        ]);

      return {
        timeRange,
        tokenCreations: tokenCreations[0]?.count || 0,
        tokenValidations: tokenValidations[0]?.count || 0,
        securityEvents: securityEvents.reduce((acc, event) => {
          acc[event.event_type] = event.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("Error getting CSRF stats:", error);
      return {
        error: "Failed to retrieve CSRF statistics",
        timeRange,
        tokenCreations: 0,
        tokenValidations: 0,
        securityEvents: {},
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
}

// Export utility functions
export const CSRFUtils = {
  // Generate secure random string for various purposes
  generateSecureRandom(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString("hex");
  },

  // Validate request method for CSRF protection
  requiresCSRFProtection(method) {
    const unsafeMethods = ["POST", "PUT", "PATCH", "DELETE"];
    return unsafeMethods.includes(method.toUpperCase());
  },

  // Extract CSRF token from various sources
  extractTokenFromRequest(request) {
    // Try header first
    const headerToken = request.headers.get("X-CSRF-Token");
    if (headerToken) return headerToken;

    // Try cookie
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const csrfProtection = new CSRFProtection({});
      return csrfProtection.extractCookieValue(cookieHeader, "csrf_token");
    }

    return null;
  },
};
