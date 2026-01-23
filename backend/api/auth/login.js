// Simplified Login Endpoint
// Maintains security while reducing complexity
// Date: November 18, 2025

import crypto from "crypto";
import { SimpleAuth, createErrorResponse } from "../_auth.js";
import { CSRFProtection } from "../_csrf.js";
import { DatabaseOperations } from "../_database.js";
import { UserRepository } from "../repositories/index.js";
import {
  buildPublicUser,
  createSessionResponse,
} from "./_session-response.js";

export async function onRequest(context) {
  const { request, env } = context;
  console.log(`[Auth:login] Enter handler - ${request.method} ${request.url}`);

  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);
  const csrf = new CSRFProtection(env);
  const db = new DatabaseOperations(env);
  const userRepo = new UserRepository(db);

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return createErrorResponse("Email and password are required", 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    const ipAddress = auth.getClientIP(request);

    // Check rate limiting
    const isLimited = await auth.isRateLimited(ipAddress);
    if (isLimited) {
      await auth.trackLoginAttempt(email, ipAddress, false, "rate_limited");
      return createErrorResponse(
        "Too many failed attempts. Try again later.",
        429
      );
    }

    // Find user
    const user = await userRepo.findByEmail(email);
    if (!user) {
      await auth.trackLoginAttempt(email, ipAddress, false, "user_not_found");
      return createErrorResponse("Invalid email or password", 401);
    }

    // Verify password
    const isValidPassword = await auth.verifyPassword(
      password,
      user.password_hash
    );
    if (!isValidPassword) {
      await auth.trackLoginAttempt(email, ipAddress, false, "invalid_password");
      return createErrorResponse("Invalid email or password", 401);
    }


    // Check concurrent session limits
    const sessionLimit = user.concurrent_sessions || 3; // Default to 3 concurrent sessions
    const activeSessions = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND is_active = 1 AND expires_at > datetime('now')"
    ).bind(user.id).all();

    if (activeSessions.results[0].count >= sessionLimit) {
      // Terminate oldest session if limit exceeded
      await env.DB.prepare(
        "UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND is_active = 1 ORDER BY last_activity ASC LIMIT 1"
      ).bind(user.id).run();
    }

    // Generate tokens
    const accessToken = auth.generateAccessToken(user.id, user.email);
    const refreshToken = auth.generateRefreshToken(user.id, user.email);

    // Extract session ID from access token
    const sessionId = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64')).sessionId;

    // Create session record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await env.DB.prepare(
      "INSERT INTO user_sessions (id, user_id, session_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      crypto.randomUUID(),
      user.id,
      sessionId,
      ipAddress,
      request.headers.get("user-agent") || "unknown",
      expiresAt.toISOString()
    ).run();

    // Update user's last session
    await env.DB.prepare(
      "UPDATE users SET last_session_id = ? WHERE id = ?"
    ).bind(sessionId, user.id).run();

    // Track successful login
    await auth.trackLoginAttempt(email, ipAddress, true);

    // Log audit event
    await auth.logAuditEvent(user.id, "login", null, null, ipAddress, true);

    // Create session response
    const sessionResponse = await createSessionResponse({
      user: buildPublicUser(user),
      userId: user.id,
      accessToken,
      refreshToken,
      csrf,
      ipAddress,
      userAgent: request.headers.get("user-agent") || "unknown",
      status: 200,
      env,
    });

    if (sessionResponse.error) {
      return sessionResponse.error;
    }

    return sessionResponse.response;
  } catch (error) {
    console.error("Login error:", error);

    // Log security event for errors
    const ipAddress = auth.getClientIP(request);
    await auth.logAuditEvent(
      null,
      "login_failed",
      null,
      null,
      ipAddress,
      false
    );

    return createErrorResponse("Internal server error", 500);
  }
}
