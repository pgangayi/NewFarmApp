import { AuthUtils, createErrorResponse } from "../_auth.js";
import { RateLimiter } from "../_rate-limit.js";
import { TokenManager } from "../_token-management.js";
import { CSRFProtection } from "../_csrf.js";
import { DatabaseOperations, DB_ERROR_CODES } from "../_database.js";
import { UserRepository } from "../repositories/index.js";
import { buildPublicUser, createSessionResponse } from "./_session-response.js";

const MIN_PASSWORD_LENGTH = 8;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new AuthUtils(env);
  const tokenManager = new TokenManager(env);
  const csrf = new CSRFProtection(env);
  const db = new DatabaseOperations(env);
  const userRepo = new UserRepository(db);
  const rateLimiter = new RateLimiter(env);

  const endpointPath = new URL(request.url).pathname;
  const identifier = await rateLimiter.getIdentifier(request);
  const rateLimitInfo = await rateLimiter.checkLimit(
    identifier,
    endpointPath,
    request.method
  );

  if (!rateLimitInfo.allowed) {
    return rateLimiter.createRateLimitResponse(
      rateLimitInfo.remaining,
      rateLimitInfo.resetTime,
      rateLimitInfo.limit
    );
  }

  const ipAddress = auth.getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  const trackSignupAttempt = async (emailValue, success, reason) => {
    await tokenManager.trackLoginAttempt(
      emailValue || null,
      ipAddress,
      userAgent,
      success,
      reason
    );
  };

  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      await trackSignupAttempt(null, false, "invalid_json");
      return createErrorResponse("Invalid JSON in request body", 400);
    }

    const { email, password, name } = body;
    const normalizedEmail = email?.trim().toLowerCase();
    const trimmedName = name?.trim();

    if (!normalizedEmail || !password || !trimmedName) {
      await trackSignupAttempt(normalizedEmail, false, "missing_fields");
      return createErrorResponse("Email, password, and name are required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      await trackSignupAttempt(normalizedEmail, false, "invalid_email_format");
      return createErrorResponse("Invalid email format", 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      await trackSignupAttempt(normalizedEmail, false, "short_password");
      return createErrorResponse(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        400
      );
    }

    try {
      const existingUser = await userRepo.findByEmail(normalizedEmail, {
        userId: "system",
      });
      if (existingUser) {
        await trackSignupAttempt(normalizedEmail, false, "duplicate_email");
        return createErrorResponse("User already exists", 409);
      }
    } catch (error) {
      if (error.code !== DB_ERROR_CODES.NOT_FOUND) {
        console.error("Error checking existing user:", error);
        return createErrorResponse("Database error", 500);
      }
    }

    const passwordHash = await auth.hashPassword(password);
    let createdUser;
    try {
      createdUser = await userRepo.createUser(
        {
          email: normalizedEmail,
          name: trimmedName,
          password_hash: passwordHash,
          updated_at: new Date().toISOString(),
        },
        { userId: "system" }
      );
    } catch (error) {
      console.error("Error creating user:", error);
      return createErrorResponse("Failed to create user", 500);
    }

    const accessToken = auth.generateToken(createdUser.id, normalizedEmail);
    const refreshToken = auth.generateRefreshToken(
      createdUser.id,
      normalizedEmail
    );
    await trackSignupAttempt(normalizedEmail, true);

    const rateLimitHeaders = rateLimiter.buildRateLimitHeaders(
      rateLimitInfo.limit,
      rateLimitInfo.remaining,
      rateLimitInfo.resetTime
    );

    const sessionResult = await createSessionResponse({
      user: buildPublicUser(createdUser),
      userId: createdUser.id,
      accessToken,
      refreshToken,
      csrf,
      ipAddress,
      userAgent,
      rateLimitHeaders,
      status: 201,
    });

    if (sessionResult.error) {
      return sessionResult.error;
    }

    console.log("User signup successful", { userId: createdUser.id });

    return sessionResult.response;
  } catch (error) {
    console.error("Signup error:", error);
    await auth.logSecurityEvent("signup_failed", {
      error: error.message,
      ip: ipAddress,
      userAgent,
    });
    return createErrorResponse("Internal server error", 500);
  }
}
