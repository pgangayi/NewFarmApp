// Simplified Signup Endpoint
// Maintains security while reducing complexity
// Date: November 18, 2025

import { SimpleAuth, createErrorResponse } from "../_auth.js";
import { CSRFProtection } from "../_csrf.js";
import {
  buildPublicUser,
  createSessionResponse,
  SimpleUserRepository,
} from "./_session-response.js";

const MIN_PASSWORD_LENGTH = 8;

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
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return createErrorResponse("Email, password, and name are required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Validate password length
    if (password.length < MIN_PASSWORD_LENGTH) {
      return createErrorResponse(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        400
      );
    }

    // Check if user already exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return createErrorResponse("User already exists", 409);
    }

    // Hash password
    const passwordHash = await auth.hashPassword(password);

    // Create user
    const createdUser = await userRepo.createUser({
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name.trim(),
    });

    // Generate tokens
    const accessToken = auth.generateAccessToken(
      createdUser.id,
      createdUser.email
    );
    const refreshToken = auth.generateRefreshToken(
      createdUser.id,
      createdUser.email
    );

    // Log audit event
    const ipAddress = auth.getClientIP(request);
    await auth.logAuditEvent(
      createdUser.id,
      "signup",
      null,
      null,
      ipAddress,
      true
    );

    // Create session response
    const sessionResponse = await createSessionResponse({
      user: buildPublicUser(createdUser),
      userId: createdUser.id,
      accessToken,
      refreshToken,
      csrf,
      ipAddress,
      userAgent: request.headers.get("user-agent") || "unknown",
      status: 201,
      env,
    });

    if (sessionResponse.error) {
      return sessionResponse.error;
    }

    return sessionResponse.response;
  } catch (error) {
    console.error("Signup error:", error);

    // Log security event for errors
    const ipAddress = auth.getClientIP(request);
    await auth.logAuditEvent(
      null,
      "signup_failed",
      null,
      null,
      ipAddress,
      false
    );

    return createErrorResponse("Internal server error", 500);
  }
}
