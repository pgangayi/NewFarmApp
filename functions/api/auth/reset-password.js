import {
  AuthUtils,
  createErrorResponse,
  createSuccessResponse,
} from "../_auth.js";
import { RateLimiter } from "../_rate-limit.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);

  // Check rate limiting
  const clientIP = RateLimiter.getClientIP(request);
  const rateLimitResponse = RateLimiter.createRateLimitResponse(
    "resetPassword",
    clientIP
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { token, newPassword } = body;

    console.log("Password reset with token:", token ? "provided" : "missing");

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

    // Hash the provided token to compare with stored hash
    const tokenHash = await hashResetToken(token);

    // Find valid reset token
    const { results } = await env.DB.prepare(
      `
      SELECT prt.user_id, u.email 
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token_hash = ? 
        AND prt.expires_at > datetime('now')
        AND prt.used_at IS NULL
    `
    )
      .bind(tokenHash)
      .all();

    if (!results || results.length === 0) {
      console.log("Invalid or expired reset token");
      return createErrorResponse("Invalid or expired reset token", 400);
    }

    const resetData = results[0];
    console.log("Valid reset token found for user:", resetData.email);

    // Hash the new password
    const newPasswordHash = await auth.hashPassword(newPassword);

    // Update user's password
    await env.DB.prepare(
      "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
      .bind(newPasswordHash, resetData.user_id)
      .run();

    // Mark token as used
    await env.DB.prepare(
      "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = ?"
    )
      .bind(tokenHash)
      .run();

    // Also invalidate any other unused tokens for this user
    await env.DB.prepare(
      "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL"
    )
      .bind(resetData.user_id)
      .run();

    console.log("Password reset successful for user:", resetData.email);

    // Add rate limit headers to response
    const rateLimitHeaders = RateLimiter.getRateLimitHeaders(
      "resetPassword",
      clientIP
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
    return createErrorResponse("Internal server error: " + error.message, 500);
  }
}

// Hash reset token for secure comparison
async function hashResetToken(token) {
  // Use SHA-256 hashing for token comparison
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
