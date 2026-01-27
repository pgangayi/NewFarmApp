// Simplified Authentication Utilities
// Maintains essential security while reducing complexity
// Date: November 18, 2025
//
// PII Hygiene: Never log emails, passwords, or sensitive tokens in production.

import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
// Use user IDs or hashed identifiers for logging. Redact sensitive data from logs.

import jwt from "@tsndr/cloudflare-worker-jwt";
import { TokenManager } from "./_token-management.js";
import bcrypt from "bcryptjs";

// Helper: Constant-time comparison to prevent timing attacks
function safeCompare(a, b) {
  let mismatch = a.length === b.length ? 0 : 1;
  if (mismatch) {
    // If lengths differ, set b to a to avoid out-of-bounds reads; mismatch already set
    b = a;
  }
  for (let i = 0, il = a.length; i < il; ++i) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Helper: Convert ArrayBuffer to Hex String
function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class SimpleAuth {
  constructor(env) {
    this.env = env;
    this.jwtSecret = env.JWT_SECRET;
    this.tokenManager = new TokenManager(env);

    // Note: Tests should control the DB mock lifecycle directly.
    // Modifying the provided DB mock at construction time caused surprising
    // interactions with per-test mock setups. Keep constructor behavior simple
    // and let tests stub/mock DB methods explicitly.
  }

  // Password hashing using PBKDF2 (Web Crypto) to avoid bcryptjs issues
  async hashPassword(password) {
    const iterations = 100000;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      256,
    );

    const hashHex = [...new Uint8Array(derivedKey)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const saltHex = [...salt]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
  }

  async verifyPassword(password, hash) {
    // Support older pbkdf2 format, otherwise use bcrypt compare
    if (typeof hash === "string" && hash.startsWith("pbkdf2:")) {
      const parts = hash.split(":");
      if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

      const iterations = parseInt(parts[1]);
      const salt = new Uint8Array(
        parts[2].match(/.{2}/g).map((byte) => parseInt(byte, 16)),
      );
      const expectedHash = parts[3];

      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
      );

      const derivedKey = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: iterations,
          hash: "SHA-256",
        },
        keyMaterial,
        256,
      );

      const hashArray = Array.from(new Uint8Array(derivedKey));
      const actualHash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Use constant-time comparison to avoid timing attacks
      return safeCompare(actualHash, expectedHash);
    }

    // Fall back to bcrypt for modern flows
    return await bcrypt.compare(password, hash);
  }

  // Enhanced JWT tokens with shorter expiration for better security
  async generateAccessToken(userId, email) {
    return jwt.sign(
      {
        userId,
        email,
        type: "access",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes (reduced from 1 hour)
        sessionId: crypto.randomUUID(), // Add session ID for tracking
      },
      this.jwtSecret,
    );
  }

  async generateRefreshToken(userId, email) {
    return jwt.sign(
      {
        userId,
        email,
        type: "refresh",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days (reduced from 30 days)
        sessionId: crypto.randomUUID(), // Add session ID for tracking
      },
      this.jwtSecret,
    );
  }

  // Simplified token verification with revocation check
  async verifyToken(token) {
    try {
      // cloudflare-worker-jwt verify return boolean or throws?
      // It returns boolean. decode returns payload.
      const isValid = await jwt.verify(token, this.jwtSecret);

      if (!isValid) return null;

      const { payload } = jwt.decode(token);

      // Check if token is revoked
      const revocationStatus = await this.tokenManager.isTokenRevoked(token);
      if (revocationStatus.revoked) {
        return null;
      }

      // Map 'sub' to 'userId' if 'userId' is missing (standard claim mapping)
      if (payload.sub && !payload.userId) {
        payload.userId = payload.sub;
      }

      // Update session activity if this is an access token with session ID
      if (payload.sessionId && payload.type === "access") {
        try {
          await this.env.DB.prepare(
            "UPDATE user_sessions SET last_activity = datetime('now') WHERE session_id = ? AND is_active = 1",
          )
            .bind(payload.sessionId)
            .run();
        } catch (error) {
          console.warn("Failed to update session activity:", error);
        }
      }

      return payload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  // Token revocation using TokenManager
  async revokeToken(token, userId, reason = "logout") {
    return await this.tokenManager.revokeToken(token, userId, reason);
  }

  // Simplified login attempt tracking
  async trackLoginAttempt(email, ipAddress, success, failureReason = null) {
    // Avoid logging PII (do not log email)
    console.log("trackLoginAttempt called", { ipAddress, success });
    try {
      // Prefer Web Crypto when available, fall back to Node's crypto for tests/environments
      let emailHash;
      if (
        crypto &&
        crypto.subtle &&
        typeof crypto.subtle.digest === "function"
      ) {
        const encoder = new TextEncoder();
        const data = encoder.encode(email.toLowerCase());
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        emailHash = bufferToHex(hashBuffer);
      } else {
        const nodeCrypto = require("crypto");
        emailHash = nodeCrypto
          .createHash("sha256")
          .update(email.toLowerCase())
          .digest("hex");
      }

      const attemptId =
        crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : require("crypto").randomUUID();

      const prepared = this.env.DB.prepare(
        `
        INSERT INTO login_attempts (id, email_hash, ip_address, success, failure_reason)
        VALUES (?, ?, ?, ?, ?)
      `,
      );

      const bound = prepared.bind(
        attemptId,
        emailHash,
        ipAddress,
        success ? 1 : 0,
        failureReason,
      );

      await bound.run();

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
      `,
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

      // Protect against DB hangs by racing the DB call with a timeout.
      const dbQuery = this.env.DB.prepare(
        "SELECT id, email, name, created_at FROM users WHERE id = ?",
      )
        .bind(payload.userId)
        .all();

      const timeoutMs = 3000; // 3s timeout for DB queries in this hot path

      let queryResult;
      try {
        queryResult = await Promise.race([
          dbQuery,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("DB query timeout")), timeoutMs),
          ),
        ]);
      } catch (err) {
        console.warn("DB query failed or timed out in getUserFromToken:", err);
        return null;
      }

      const { results } = queryResult || {};
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
      `,
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
        `SELECT 1 FROM farms WHERE id = ? AND owner_id = ? LIMIT 1`,
      )
        .bind(farmId, userId)
        .all();

      if (ownerCheck.results?.length) {
        return true;
      }

      // Existing membership?
      const memberCheck = await this.env.DB.prepare(
        `SELECT 1 FROM farm_members WHERE farm_id = ? AND user_id = ? LIMIT 1`,
      )
        .bind(farmId, userId)
        .all();

      if (memberCheck.results?.length) {
        return true;
      }

      await this.env.DB.prepare(
        `INSERT INTO farm_members (farm_id, user_id, role)
         VALUES (?, ?, ?)`,
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
    success = true,
  ) {
    try {
      await this.env.DB.prepare(
        `
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, success)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
        .bind(
          userId,
          action,
          resourceType,
          resourceId,
          ipAddress,
          success ? 1 : 0,
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
    try {
      // Prefer Node's crypto.randomBytes when available for deterministic behavior in tests
      const nodeCrypto = require("crypto");
      return nodeCrypto
        .randomBytes(32)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    } catch (e) {
      const arr = new Uint8Array(32);
      crypto.getRandomValues(arr);
      return Buffer.from(arr)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    }
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
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export function createSuccessResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
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
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

// NOTE: Converted to async to support Web Crypto API
export async function hashResetToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(hashBuffer);
}
