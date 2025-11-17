import {
  AuthUtils,
  createErrorResponse,
  createSuccessResponse,
  hashResetToken,
} from "../_auth.js";
import { RateLimiter } from "../_rate-limit.js";
import { DatabaseOperations, DB_ERROR_CODES } from "../_database.js";

export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  if (method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }
  const { env } = context;
  const auth = new AuthUtils(env);
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

  // Initialize database operations
  const db = new DatabaseOperations(env);

  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      // Consistency: Handle bad JSON parsing explicitly
      return createErrorResponse("Invalid JSON in request body", 400);
    }

    const { token, newPassword } = body;

    // PII Hygiene: Use generic confirmation
    console.log(
      "Password reset attempt with token:",
      token ? "provided" : "missing"
    );

    if (!token || !newPassword) {
      return createErrorResponse("Token and new password are required", 400);
    }

    // Enhanced password validation
    if (newPassword.length < 12) {
      return createErrorResponse(
        "Password must be at least 12 characters long",
        400
      );
    }

    // Check for complexity requirements
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return createErrorResponse(
        "Password must contain uppercase, lowercase, number, and special character",
        400
      );
    }

    // Hash the provided token to compare with stored hash (CRITICAL SECURITY STEP)
    const tokenHash = await hashResetToken(token);

    // Find valid reset token using DatabaseOperations
    let resetData = null;
    try {
      const result = await db.executeQuery(
        `
        SELECT prt.user_id, u.email 
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token_hash = ? 
          AND prt.expires_at > datetime('now')
          AND prt.used_at IS NULL
      `,
        [tokenHash],
        {
          operation: "query",
          table: "password_reset_tokens",
          userId: "system",
        }
      );

      if (result && result.data && result.data.length > 0) {
        resetData = result.data[0];
      }
    } catch (error) {
      console.error("Error finding reset token:", error);
      if (error.code !== DB_ERROR_CODES.NOT_FOUND) {
        return createErrorResponse("Database error", 500);
      }
    }

    if (!resetData) {
      console.log("Invalid or expired reset token");
      return createErrorResponse("Invalid or expired reset token", 400);
    }

    // PII Hygiene: Log user ID instead of email
    console.log("Valid reset token found for user ID:", resetData.user_id);

    // Hash the new password
    const newPasswordHash = await auth.hashPassword(newPassword);

    // Update user's password using UserRepository (would need to be created)
    try {
      const updateResult = await db.executeQuery(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        [newPasswordHash, new Date().toISOString(), resetData.user_id],
        {
          operation: "run",
          table: "users",
          userId: resetData.user_id, // User is updating their own password
        }
      );

      if (!updateResult.success) {
        console.error("Failed to update user password:", updateResult);
        return createErrorResponse("Failed to update password", 500);
      }
    } catch (error) {
      console.error("Error updating user password:", error);
      return createErrorResponse("Database error", 500);
    }

    // Mark token as used using DatabaseOperations
    try {
      await db.executeQuery(
        "UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?",
        [new Date().toISOString(), tokenHash],
        {
          operation: "run",
          table: "password_reset_tokens",
          userId: "system",
        }
      );
    } catch (error) {
      console.warn("Failed to mark token as used:", error);
      // Continue - password was updated successfully
    }

    // Also invalidate any other unused tokens for this user (Excellent security practice)
    try {
      await db.executeQuery(
        "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
        [new Date().toISOString(), resetData.user_id],
        {
          operation: "run",
          table: "password_reset_tokens",
          userId: "system",
        }
      );
    } catch (error) {
      console.warn("Failed to invalidate other tokens:", error);
      // Continue - main password reset was successful
    }

    // PII Hygiene: Log user ID instead of email
    console.log("Password reset successful for user ID:", resetData.user_id);

    // Add rate limit headers to response
    const rateLimitHeaders = rateLimiter.buildRateLimitHeaders(
      rateLimitInfo.limit,
      rateLimitInfo.remaining,
      rateLimitInfo.resetTime
    );

    return createSuccessResponse(
      {
        message: "Password has been reset successfully",
        status: "success",
      },
      200,
      rateLimitHeaders
    );
  } catch (error) {
    console.error("Password reset error:", error);

    // Log security event for failed password reset
    await auth.logSecurityEvent("password_reset_failed", {
      error: error.message,
      ip: auth.getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return createErrorResponse("Internal server error: " + error.message, 500);
  }
}
