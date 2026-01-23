import {
  AuthUtils,
  createErrorResponse,
  createSuccessResponse,
} from "../_auth.js";
import { RateLimiter } from "../_rate-limit.js";

/**
 * Handles the core logic for token validation, applying rate limiting first.
 * @param {object} context - The context object containing request, env, and ctx.
 * @returns {Response} A Response object with validation results or an error.
 */
async function handleValidationRequest(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);
  const rateLimiter = new RateLimiter(env);
  const endpointPath = new URL(request.url).pathname;

  // Rate Limiting Check
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

  // Rate limit headers for success response
  const rateLimitHeaders = rateLimiter.buildRateLimitHeaders(
    rateLimitInfo.limit,
    rateLimitInfo.remaining,
    rateLimitInfo.resetTime
  );

  try {
    // Get user from token (AuthUtils should handle token extraction and verification)
    const user = await auth.getUserFromToken(request);

    if (!user) {
      // Token is invalid, expired, or missing
      return createErrorResponse(
        "Invalid or missing token",
        401,
        rateLimitHeaders
      );
    }

    // PII Hygiene: Return user ID instead of the full user object if possible,
    // but often frontend requires the whole user object for state. We return
    // the user object, assuming AuthUtils sanitizes PII like password hash.
    return createSuccessResponse(
      {
        user: user,
        valid: true,
      },
      200,
      rateLimitHeaders
    );
  } catch (error) {
    console.error("Token validation error:", error);
    // Use a generic error message for internal issues
    return createErrorResponse(
      "Internal server error during validation",
      500,
      rateLimitHeaders
    );
  }
}

export async function onRequest(context) {
  const { request } = context;
  console.log(`[Auth:validate] Enter handler - ${request.method} ${request.url}`);
  const method = request.method;

  // Handle both GET and POST requests for token validation
  if (method === "GET" || method === "POST") {
    return handleValidationRequest(context);
  }

  return createErrorResponse("Method not allowed", 405);
}
