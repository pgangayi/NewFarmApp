// Cloudflare Authentication Utilities
// JWT and password utilities for Cloudflare Workers (Cloudflare D1 + custom JWT)
// Enhanced with token revocation and security monitoring

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TokenManager } from "./_token-management.js";

export class AuthUtils {
  constructor(env) {
    this.env = env;
    this.tokenManager = new TokenManager(env);
  }

  // Hash a password
  async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify a password
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  generateToken(userId, email) {
    const payload = {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      // Shorter token lifetime: 1 hour
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    };

    return jwt.sign(payload, this.env.JWT_SECRET);
  }

  // Generate refresh token with longer lifetime
  generateRefreshToken(userId, email) {
    const payload = {
      userId,
      email,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
      // Longer token lifetime: 30 days
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    };

    return jwt.sign(payload, this.env.JWT_SECRET);
  }

  // Verify JWT token with revocation checking
  async verifyToken(token) {
    try {
      // First verify the JWT signature and expiration
      const payload = jwt.verify(token, this.env.JWT_SECRET);

      // Check if token is revoked
      const revocationStatus = await this.tokenManager.isTokenRevoked(
        token,
        "access"
      );
      if (revocationStatus.revoked) {
        console.log(`Revoked token attempt: ${revocationStatus.reason}`);
        return null;
      }

      return payload;
    } catch (error) {
      // Check if it's a revocation-related error
      if (error.message.includes("revoked")) {
        console.log("Token verification failed due to revocation");
      }
      return null;
    }
  }

  // Extract token from Authorization header
  extractToken(request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Get user from token with enhanced security
  async getUserFromToken(request) {
    try {
      const token = this.extractToken(request);
      if (!token) return null;

      const payload = await this.verifyToken(token);
      if (!payload) return null;

      // Track successful token validation
      await this.tokenManager.trackLoginAttempt(
        payload.email,
        this.getClientIP(request),
        request.headers.get("user-agent") || "unknown",
        true
      );

      const { results } = await this.env.DB.prepare(
        "SELECT id, email, name, created_at FROM users WHERE id = ?"
      )
        .bind(payload.userId)
        .all();

      return results && results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error("Auth validation error:", error);
      // Track failed validation attempt
      await this.tokenManager.trackLoginAttempt(
        null,
        this.getClientIP(request),
        request.headers.get("user-agent") || "unknown",
        false,
        "Token validation failed"
      );
      return null;
    }
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

  // Revoke token (for logout or security incidents)
  async revokeToken(token, userId, reason, requestContext = {}) {
    return await this.tokenManager.revokeToken(
      token,
      userId,
      reason,
      "access",
      null,
      {
        ipAddress: this.getClientIP(requestContext.request || {}),
        userAgent: requestContext.userAgent || "unknown",
      }
    );
  }

  // Check if user has access to a farm
  async hasFarmAccess(userId, farmId) {
    const { results } = await this.env.DB.prepare(
      `SELECT 1
       FROM farms
       WHERE id = ? AND owner_id = ?
       UNION ALL
       SELECT 1
       FROM farm_members
       WHERE farm_id = ? AND user_id = ?
       LIMIT 1`
    )
      .bind(farmId, userId, farmId, userId)
      .all();

    return Array.isArray(results) && results.length > 0;
  }

  // Grant farm access to a user
  async grantFarmAccess(farmId, userId, role = "member") {
    // For now, just verify the farm exists and user is owner
    // In a more complex system, this would create farm_users records
    const { results } = await this.env.DB.prepare(
      "SELECT id FROM farms WHERE id = ? AND owner_id = ?"
    )
      .bind(farmId, userId)
      .all();

    return results && results.length > 0;
  }
}

// Export helper functions for response handling
export function createUnauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function createSuccessResponse(
  data,
  status = 200,
  additionalHeaders = {}
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...additionalHeaders },
  });
}

// Find user by email with error handling
export async function findUserByEmail(env, email) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?"
    )
      .bind(email)
      .all();

    return results && results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    return null;
  }
}

// Security headers for all auth responses
export function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Content-Security-Policy", "default-src 'self'");
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

// Generate cryptographically secure token
export function generateSecureToken() {
  // Use Web Crypto API for secure random generation
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);

  // Convert to base64url for URL-safe token
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Hash reset token for secure storage
export async function hashResetToken(token) {
  // Use SHA-256 hashing for token storage
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// CSRF protection utilities
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function validateCSRFToken(request, storedToken) {
  const csrfToken = request.headers.get("X-CSRF-Token");
  return csrfToken && storedToken && csrfToken === storedToken;
}
