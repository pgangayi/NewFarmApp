/**
 * Unit tests for _auth.js
 * Tests authentication, token management, and security utilities
 */

import {
  SimpleAuth,
  SimpleCSRF,
  createErrorResponse,
  createSuccessResponse,
  createUnauthorizedResponse,
  generateSecureToken,
  hashResetToken,
} from "../api/_auth.js";

// Mock dependencies
jest.mock("@tsndr/cloudflare-worker-jwt", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
}));

jest.mock("../api/_token-management.js", () => ({
  TokenManager: jest.fn().mockImplementation(() => ({
    isTokenRevoked: jest.fn(),
    revokeToken: jest.fn(),
  })),
}));

describe("SimpleAuth", () => {
  let auth;
  let mockEnv;
  let mockDB;

  beforeEach(() => {
    const bound = {
      run: jest.fn(() => ({ success: true })),
      all: jest.fn(() => ({ results: [] })),
    };

    const prepared = {
      bind: jest.fn(() => bound),
    };

    mockDB = {
      prepare: jest.fn(() => prepared),
    };

    mockEnv = { DB: mockDB };
    auth = new SimpleAuth(mockEnv);
  });

  describe("password hashing", () => {
    it("should hash password with PBKDF2", async () => {
      const password = "testPassword123!";

      const result = await auth.hashPassword(password);

      expect(result).toMatch(/^pbkdf2:100000:[a-f0-9]{32}:[a-f0-9]{64}$/);
    });

    it("should verify password correctly", async () => {
      const password = "testPassword123!";
      // Generate a real hash to verify against
      const hash = await auth.hashPassword(password);

      const result = await auth.verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it("should fail verification with wrong password", async () => {
      const password = "testPassword123!";
      const hash = await auth.hashPassword(password);

      const result = await auth.verifyPassword("wrongPassword", hash);

      expect(result).toBe(false);
    });
  });

  describe("token generation", () => {
    beforeEach(() => {
      require("@tsndr/cloudflare-worker-jwt").sign.mockResolvedValue(
        "mock_token",
      );
    });

    it("should generate access token with correct payload", async () => {
      const userId = "user-123";
      const email = "user@example.com";

      await auth.generateAccessToken(userId, email);

      expect(require("@tsndr/cloudflare-worker-jwt").sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          email,
          type: "access",
          exp: expect.any(Number),
          sessionId: expect.any(String),
        }),
        auth.jwtSecret,
      );
    });

    it("should generate refresh token with correct payload", async () => {
      const userId = "user-123";
      const email = "user@example.com";

      await auth.generateRefreshToken(userId, email);

      expect(require("@tsndr/cloudflare-worker-jwt").sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          email,
          type: "refresh",
          exp: expect.any(Number),
          sessionId: expect.any(String),
        }),
        auth.jwtSecret,
      );
    });

    it("should set correct expiration times", async () => {
      const now = Math.floor(Date.now() / 1000);
      const userId = "user-123";
      const email = "user@example.com";

      await auth.generateAccessToken(userId, email);

      const callArgs = require("@tsndr/cloudflare-worker-jwt").sign.mock
        .calls[0][0];
      expect(callArgs.exp).toBeGreaterThan(now + 14 * 60); // ~15 minutes
      expect(callArgs.exp).toBeLessThan(now + 16 * 60);
    });
  });

  describe("token verification", () => {
    beforeEach(() => {
      require("@tsndr/cloudflare-worker-jwt").verify.mockResolvedValue(true);
      require("@tsndr/cloudflare-worker-jwt").decode.mockReturnValue({
        payload: {
          userId: "user-123",
          type: "access",
          sessionId: "session-456",
        },
      });
      auth.tokenManager.isTokenRevoked.mockResolvedValue({ revoked: false });
    });

    it("should verify valid token", async () => {
      const token = "valid_token";

      const result = await auth.verifyToken(token);

      expect(result).toEqual({
        userId: "user-123",
        type: "access",
        sessionId: "session-456",
      });
    });

    it("should return null for invalid token", async () => {
      require("@tsndr/cloudflare-worker-jwt").verify.mockResolvedValue(false);

      const result = await auth.verifyToken("invalid_token");

      expect(result).toBeNull();
    });

    it("should return null for revoked token", async () => {
      auth.tokenManager.isTokenRevoked.mockResolvedValue({ revoked: true });

      const result = await auth.verifyToken("revoked_token");

      expect(result).toBeNull();
    });

    it("should map sub to userId if userId missing", async () => {
      require("@tsndr/cloudflare-worker-jwt").decode.mockReturnValue({
        payload: { sub: "user-123", type: "access" },
      });

      const result = await auth.verifyToken("token");

      expect(result.userId).toBe("user-123");
    });

    it("should update session activity for access tokens", async () => {
      await auth.verifyToken("token");

      expect(mockDB.prepare).toHaveBeenCalledWith(
        "UPDATE user_sessions SET last_activity = datetime('now') WHERE session_id = ? AND is_active = 1",
      );
    });
  });

  describe("token revocation", () => {
    it("should delegate to token manager", async () => {
      const token = "token_to_revoke";
      const userId = "user-123";
      const reason = "logout";

      auth.tokenManager.revokeToken.mockResolvedValue({ success: true });

      const result = await auth.revokeToken(token, userId, reason);

      expect(auth.tokenManager.revokeToken).toHaveBeenCalledWith(
        token,
        userId,
        reason,
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("login attempt tracking", () => {
    it("should track successful login", async () => {
      const email = "user@example.com";
      const ipAddress = "192.168.1.1";

      const result = await auth.trackLoginAttempt(email, ipAddress, true);

      expect(result).toBe(true);
      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO login_attempts"),
      );
    });

    it("should track failed login with reason", async () => {
      const email = "user@example.com";
      const ipAddress = "192.168.1.1";
      const failureReason = "Invalid password";

      await auth.trackLoginAttempt(email, ipAddress, false, failureReason);

      const bindCall = mockDB.prepare().bind;
      expect(bindCall).toHaveBeenCalledWith(
        expect.any(String), // id
        expect.any(String), // email_hash
        ipAddress,
        0, // success = false
        failureReason,
      );
    }, 10000);

    it("should hash email for privacy", async () => {
      const email = "USER@EXAMPLE.COM";
      const ipAddress = "192.168.1.1";

      await auth.trackLoginAttempt(email, ipAddress, true);

      // Verify email is hashed (lowercase)
      const bindArgs = mockDB.prepare().bind.mock.calls[0];
      expect(bindArgs[1]).toMatch(/^[a-f0-9]{64}$/); // SHA256 hash
    });
  });

  describe("rate limiting", () => {
    it("should not be rate limited with few failures", async () => {
      mockDB
        .prepare()
        .bind()
        .all.mockResolvedValue({ results: [{ attempts: 3 }] });

      const result = await auth.isRateLimited("192.168.1.1");

      expect(result).toBe(false);
    });

    it("should be rate limited with many failures", async () => {
      mockDB
        .prepare()
        .bind()
        .all.mockResolvedValue({ results: [{ attempts: 5 }] });

      const result = await auth.isRateLimited("192.168.1.1");

      expect(result).toBe(true);
    });
  });

  describe("token extraction", () => {
    it("should extract bearer token from header", () => {
      const request = {
        headers: new Map([["Authorization", "Bearer token123"]]),
      };

      const result = auth.extractToken(request);

      expect(result).toBe("token123");
    });

    it("should return null for missing header", () => {
      const request = { headers: new Map() };

      const result = auth.extractToken(request);

      expect(result).toBeNull();
    });

    it("should return null for invalid scheme", () => {
      const request = {
        headers: new Map([["Authorization", "Basic token123"]]),
      };

      const result = auth.extractToken(request);

      expect(result).toBeNull();
    });
  });

  describe("getUserFromToken", () => {
    it("should return user for valid token", async () => {
      const request = {
        headers: new Map([["Authorization", "Bearer valid_token"]]),
      };

      auth.extractToken = jest.fn().mockReturnValue("valid_token");
      auth.verifyToken = jest.fn().mockResolvedValue({ userId: "user-123" });
      mockDB
        .prepare()
        .bind()
        .all.mockResolvedValue({
          results: [
            { id: "user-123", email: "user@example.com", name: "John Doe" },
          ],
        });

      const result = await auth.getUserFromToken(request);

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "John Doe",
      });
    });

    it("should return null for invalid token", async () => {
      const request = { headers: new Map() };

      auth.extractToken = jest.fn().mockReturnValue(null);

      const result = await auth.getUserFromToken(request);

      expect(result).toBeNull();
    });
  });

  describe("getClientIP", () => {
    it("should extract IP from CF-Connecting-IP", () => {
      const request = {
        headers: new Map([["CF-Connecting-IP", "1.2.3.4"]]),
      };

      const result = auth.getClientIP(request);

      expect(result).toBe("1.2.3.4");
    });

    it("should fallback to X-Forwarded-For", () => {
      const request = {
        headers: new Map([["X-Forwarded-For", "5.6.7.8"]]),
      };

      const result = auth.getClientIP(request);

      expect(result).toBe("5.6.7.8");
    });

    it("should return unknown for no headers", () => {
      const request = { headers: new Map() };

      const result = auth.getClientIP(request);

      expect(result).toBe("unknown");
    });
  });

  describe("farm access", () => {
    it("should grant access to farm owner", async () => {
      mockDB
        .prepare()
        .bind()
        .all.mockResolvedValue({ results: [{}] });

      const result = await auth.hasFarmAccess("user-123", "farm-456");

      expect(result).toBe(true);
    });

    it("should deny access when no relationship", async () => {
      mockDB.prepare().bind().all.mockResolvedValue({ results: [] });

      const result = await auth.hasFarmAccess("user-123", "farm-456");

      expect(result).toBe(false);
    });

    it("should return false for invalid parameters", async () => {
      const result = await auth.hasFarmAccess(null, "farm-456");

      expect(result).toBe(false);
    });
  });

  describe("grantFarmAccess", () => {
    it("should grant access to new member", async () => {
      // Mock owner check (no owner)
      mockDB
        .prepare()
        .bind()
        .all.mockResolvedValueOnce({ results: [] }) // owner check
        .mockResolvedValueOnce({ results: [] }); // member check

      const result = await auth.grantFarmAccess(
        "farm-456",
        "user-123",
        "member",
      );

      expect(result).toBe(true);
      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO farm_members"),
      );
    });

    it("should return true if user is already owner", async () => {
      mockDB
        .prepare()
        .bind()
        .all.mockResolvedValue({ results: [{}] }); // owner check

      const result = await auth.grantFarmAccess("farm-456", "user-123");

      expect(result).toBe(true);
    });
  });

  describe("audit logging", () => {
    it("should log audit event", async () => {
      const userId = "user-123";
      const action = "login";
      const resourceType = "user";
      const resourceId = "user-123";
      const ipAddress = "192.168.1.1";

      await auth.logAuditEvent(
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        true,
      );

      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO audit_logs"),
      );
    });
  });
});

describe("SimpleCSRF", () => {
  let csrf;

  beforeEach(() => {
    csrf = new SimpleCSRF({});
  });

  describe("generateToken", () => {
    it("should generate a CSRF token", () => {
      const token = csrf.generateToken();

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token).not.toMatch(/[+/=]/); // URL-safe
    });
  });

  describe("validateToken", () => {
    it("should validate correct token format", () => {
      const request = {
        headers: new Map([
          ["X-CSRF-Token", "valid_token_123456789012345678901234567890"],
        ]),
      };

      const result = csrf.validateToken(request, "user-123");

      expect(result).toBe(true);
    });

    it("should reject missing token", () => {
      const request = { headers: new Map() };

      const result = csrf.validateToken(request, "user-123");

      expect(result).toBe(false);
    });

    it("should reject invalid token format", () => {
      const request = {
        headers: new Map([["X-CSRF-Token", "invalid@token!"]]),
      };

      const result = csrf.validateToken(request, "user-123");

      expect(result).toBe(false);
    });
  });
});

describe("response helpers", () => {
  it("should create error response", () => {
    const response = createErrorResponse("Test error", 400);

    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("should create success response", () => {
    const data = { message: "Success" };
    const response = createSuccessResponse(data, 201);

    expect(response.status).toBe(201);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should create unauthorized response", () => {
    const response = createUnauthorizedResponse();

    expect(response.status).toBe(401);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});

describe("utility functions", () => {
  it("should generate secure token", () => {
    const token = generateSecureToken(16);

    expect(typeof token).toBe("string");
    expect(token.length).toBe(32); // 16 bytes * 2 hex chars
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it("should hash reset token", async () => {
    const token = "reset_token_123";
    const hash = await hashResetToken(token);

    expect(typeof hash).toBe("string");
    expect(hash.length).toBe(64); // SHA256 hex length
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});
