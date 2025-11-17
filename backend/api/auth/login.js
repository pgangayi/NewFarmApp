import { AuthUtils, createErrorResponse } from "../_auth.js";
import { RateLimiter } from "../_rate-limit.js";
import { TokenManager } from "../_token-management.js";
import { CSRFProtection } from "../_csrf.js";
import { DatabaseOperations, DB_ERROR_CODES } from "../_database.js";
import { UserRepository } from "../repositories/index.js";
import { buildPublicUser, createSessionResponse } from "./_session-response.js";
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

  const trackLoginAttempt = async (emailValue, success, failureReason) => {
    await tokenManager.trackLoginAttempt(
      emailValue || null,
      ipAddress,
      userAgent,
      success,
      failureReason
    );
  };

  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      await trackLoginAttempt(null, false, "invalid_json");
      return createErrorResponse("Invalid JSON in request body", 400);
    }

    const { email, password } = body;

    if (!email || !password) {
      await trackLoginAttempt(email, false, "missing_credentials");
      return createErrorResponse("Email and password are required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await trackLoginAttempt(email, false, "invalid_email_format");
      return createErrorResponse("Invalid email format", 400);
    }

    let user;
    try {
      user = await userRepo.findByEmail(email, {
        userId: "system",
      });
    } catch (error) {
      if (error.code !== DB_ERROR_CODES.NOT_FOUND) {
        console.error("Error finding user:", error);
        return createErrorResponse("Database error", 500);
      }
      user = null;
    }

    if (!user) {
      const fakeHash = "$2b$12$fakehashforconstanttimecomparison";
      await auth.verifyPassword(password, fakeHash);
      await trackLoginAttempt(email, false, "user_not_found");
      return createErrorResponse("Invalid email or password", 401);
    }

    const isValidPassword = await auth.verifyPassword(
      password,
      user.password_hash
    );
    if (!isValidPassword) {
      await trackLoginAttempt(email, false, "invalid_password");
      return createErrorResponse("Invalid email or password", 401);
    }

    const accessToken = auth.generateToken(user.id, user.email);
    const refreshToken = auth.generateRefreshToken(user.id, user.email);
    await trackLoginAttempt(email, true);

    const rateLimitHeaders = rateLimiter.buildRateLimitHeaders(
      rateLimitInfo.limit,
      rateLimitInfo.remaining,
      rateLimitInfo.resetTime
    );

    const sessionResult = await createSessionResponse({
      user: buildPublicUser(user),
      userId: user.id,
      accessToken,
      refreshToken,
      csrf,
      ipAddress,
      userAgent,
      rateLimitHeaders,
      status: 200,
    });

    if (sessionResult.error) {
      return sessionResult.error;
    }

    console.log("User login successful", { userId: user.id });

    return sessionResult.response;
  } catch (error) {
    console.error("Login error:", error);

    await auth.logSecurityEvent("login_failed", {
      error: error.message,
      ip: ipAddress,
      userAgent,
    });

    return createErrorResponse("Internal server error", 500);
  }
}
