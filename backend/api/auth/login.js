// Simplified Login Endpoint
// Maintains security while reducing complexity
// Date: November 18, 2025

import { SimpleAuth, createErrorResponse } from "../_auth.js";
import { CSRFProtection } from "../_csrf.js";
import {
  buildPublicUser,
  createSessionResponse,
  SimpleUserRepository,
} from "./_session-response.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);
  const csrf = new CSRFProtection(env);
  const userRepo = new SimpleUserRepository(env.DB);

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

    // Generate tokens
    const accessToken = auth.generateAccessToken(user.id, user.email);
    const refreshToken = auth.generateRefreshToken(user.id, user.email);

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
