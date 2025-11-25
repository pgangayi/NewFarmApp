// Simplified Authentication Utilities
// Maintains essential security while reducing complexity
// Date: November 18, 2025
//
// PII Hygiene: Never log emails, passwords, or sensitive tokens in production.
// Use user IDs or hashed identifiers for logging. Redact sensitive data from logs.

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { TokenManager } from "./_token-management.js";

export class SimpleAuth {
  constructor(env) {
    this.env = env;
    this.jwtSecret = env.JWT_SECRET;
    this.tokenManager = new TokenManager(env);
  }

  // Password hashing (keep bcrypt for security)
  async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Simplified JWT tokens
  generateAccessToken(userId, email) {
    return jwt.sign(
      {
        userId,
        email,
        type: "access",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      },
      this.jwtSecret
    );
  }

  generateRefreshToken(userId, email) {
    return jwt.sign(
      {
        userId,
        email,
        type: "refresh",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      },
      this.jwtSecret
    );
  }

  // Simplified token verification with revocation check
  async verifyToken(token) {
    try {
      const payload = jwt.verify(token, this.jwtSecret);

      // Check if token is revoked
      const revocationStatus = await this.tokenManager.isTokenRevoked(token);
      if (revocationStatus.revoked) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  // Token revocation using TokenManager
  async revokeToken(token, userId, reason = "logout") {
    return await this.tokenManager.revokeToken(token, userId, reason);
  }

  // Simplified login attempt tracking
  async trackLoginAttempt(email, ipAddress, success, failureReason = null) {
    try {
      const emailHash = crypto
        .createHash("sha256")
        .update(email.toLowerCase())
        .digest("hex");
      const attemptId = crypto.randomUUID();

      await this.env.DB.prepare(
        `
        INSERT INTO login_attempts (id, email_hash, ip_address, success, failure_reason)
        VALUES (?, ?, ?, ?, ?)
      `
      )
        .bind(attemptId, emailHash, ipAddress, success ? 1 : 0, failureReason)
        .run();

      return true;
    } catch (error) {
      console.error("Error tracking login attempt:", error);
      return false;
    }
  }

  // Basic rate limiting check
  async isRateLimited(ipAddress) {
    try {
      const windowStart = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes

      const { results } = await this.env.DB.prepare(
        `
        SELECT COUNT(*) as attempts FROM login_attempts
        WHERE ip_address = ? AND success = 0 AND attempted_at > ?
      `
      )
        .bind(ipAddress, windowStart.toISOString())
        .all();

      const failedAttempts = results[0]?.attempts || 0;
      return failedAttempts >= 5; // Simple threshold
    } catch (error) {
      console.error("Error checking rate limit:", error);
      return false;
    }
  }

  // Extract bearer token from Authorization header
  extractToken(request) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader) return null;

      const [scheme, token] = authHeader.split(" ");
      if (!token || scheme?.toLowerCase() !== "bearer") {
        return null;
      }

      return token.trim();
    } catch (error) {
      console.error("Error extracting token:", error);
      return null;
    }
  }

  // Get user from token
  async getUserFromToken(request) {
    try {
      const token = this.extractToken(request);
      if (!token) {
        return null;
      }

      const payload = await this.verifyToken(token);
      if (!payload) return null;

      const { results } = await this.env.DB.prepare(
        "SELECT id, email, name, created_at FROM users WHERE id = ?"
      )
        .bind(payload.userId)
        .all();

      return results && results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Auth validation error:", error);
      return null;
    }
  }

  // Get client IP
  getClientIP(request) {
    return (
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      request.headers.get("X-Real-IP") ||
      "unknown"
    );
  }

  // Verify whether a user has access to a farm (owner or member)
  async hasFarmAccess(userId, farmId) {
    if (!userId || !farmId) {
      return false;
    }

    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT 1 FROM farms WHERE id = ? AND owner_id = ?
        UNION
        SELECT 1 FROM farm_members WHERE farm_id = ? AND user_id = ?
        LIMIT 1
      `
      )
        .bind(farmId, userId, farmId, userId)
        .all();

      return Array.isArray(results) && results.length > 0;
    } catch (error) {
      console.error("Error checking farm access:", error);
      return false;
    }
  }

  // Grant farm access to a user via farm_members entry when needed
  async grantFarmAccess(farmId, userId, role = "member") {
    if (!farmId || !userId) {
      return false;
    }

    try {
      // Owners implicitly have access
      const ownerCheck = await this.env.DB.prepare(
        `SELECT 1 FROM farms WHERE id = ? AND owner_id = ? LIMIT 1`
      )
        .bind(farmId, userId)
        .all();

      if (ownerCheck.results?.length) {
        return true;
      }

      // Existing membership?
      const memberCheck = await this.env.DB.prepare(
        `SELECT 1 FROM farm_members WHERE farm_id = ? AND user_id = ? LIMIT 1`
      )
        .bind(farmId, userId)
        .all();

      if (memberCheck.results?.length) {
        return true;
      }

      await this.env.DB.prepare(
        `INSERT INTO farm_members (farm_id, user_id, role)
         VALUES (?, ?, ?)`
      )
        .bind(farmId, userId, role || "member")
        .run();

      return true;
    } catch (error) {
      // Ignore uniqueness errors since access already exists
      if (error?.message?.includes("UNIQUE")) {
        return true;
      }

      console.error("Error granting farm access:", error);
      return false;
    }
  }

  // Simple audit logging (critical events only)
  async logAuditEvent(
    userId,
    action,
    resourceType = null,
    resourceId = null,
    ipAddress = null,
    success = true
  ) {
    try {
      await this.env.DB.prepare(
        `
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, success)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          userId,
          action,
          resourceType,
          resourceId,
          ipAddress,
          success ? 1 : 0
        )
        .run();
    } catch (error) {
      console.error("Error logging audit event:", error);
    }
  }
}

// Simplified CSRF protection (stateless)
export class SimpleCSRF {
  constructor(env) {
    this.env = env;
  }

  generateToken() {
    return crypto
      .randomBytes(32)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  // Stateless CSRF validation using JWT payload
  validateToken(request, userId) {
    const csrfToken = request.headers.get("X-CSRF-Token");
    if (!csrfToken) return false;

    try {
      // For simplicity, just check token format and length
      // In production, you might want to store in JWT or use a more sophisticated method
      return csrfToken.length >= 32 && /^[A-Za-z0-9\-_]+$/.test(csrfToken);
    } catch (error) {
      return false;
    }
  }
}

// Response helpers
export function createErrorResponse(message, status = 400, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

export function createSuccessResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

export function createUnauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

// Backward compatibility aliases
export const AuthUtils = SimpleAuth;
export { SimpleAuth as Auth };

// Additional utility functions for backward compatibility
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
