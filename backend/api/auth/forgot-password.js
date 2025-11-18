import {
  AuthUtils,
  createErrorResponse,
  createSuccessResponse,
  generateSecureToken,
  hashResetToken,
} from "../_auth.js";
import { RateLimiter } from "../_rate-limit.js";
import { EmailService } from "../_email.js";
import { DatabaseOperations, DB_ERROR_CODES } from "../_database.js";
import { UserRepository } from "../repositories/index.js";

// Helper function to generate the full password reset link
function generateResetLink(token, env) {
  // Use the environment variable for the frontend base URL.
  // IMPORTANT: Ensure APP_URL is correctly set in your environment.
  const baseUrl = env.APP_URL || "http://localhost:3000";
  return `${baseUrl}/reset-password?token=${token}`;
}

export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  if (method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }
  const { env } = context;
  const auth = new AuthUtils(env);
  const emailService = new EmailService(env);
  const rateLimiter = new RateLimiter(env);

  // Initialize database operations
  const db = new DatabaseOperations(env);
  const userRepo = new UserRepository(db);

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

  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return createErrorResponse("Invalid JSON in request body", 400);
    }

    const { email } = body;

    console.log("Password reset request received."); // Avoid logging PII

    if (!email) {
      return createErrorResponse("Email is required", 400);
    }

    // Enhanced email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Check if user exists using UserRepository
    let user = null;
    try {
      const userResult = await userRepo.findByEmail(email, {
        userId: "system",
      });
      if (userResult && userResult.data && userResult.data.length > 0) {
        user = userResult.data[0];
      }
    } catch (error) {
      if (error.code !== DB_ERROR_CODES.NOT_FOUND) {
        console.error("Error finding user:", error);
        return createErrorResponse("Database error", 500);
      }
    }

    // Default response (security best practice: generic success message)
    let response = {
      message:
        "If an account with that email exists, a password reset link has been sent.",
      status: "sent",
    };

    if (user) {
      console.log("User found, processing reset token for user ID:", user.id);

      try {
        // Generate secure reset token
        const resetToken = generateSecureToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Create the full reset link using the token
        const resetLink = generateResetLink(resetToken, env);

        // Hash the reset token before storing (CRITICAL SECURITY)
        const tokenHash = await hashResetToken(resetToken);

        // Clean up any existing unused tokens for this user using DatabaseOperations
        try {
          await db.executeQuery(
            "DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL",
            [user.id],
            {
              operation: "run",
              table: "password_reset_tokens",
              userId: "system",
            }
          );
        } catch (cleanupError) {
          console.warn(
            "Failed to cleanup existing reset tokens:",
            cleanupError
          );
          // Continue processing even if cleanup fails
        }

        // Store hashed reset token using DatabaseOperations
        try {
          await db.executeQuery(
            "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
            [user.id, tokenHash, expiresAt.toISOString()],
            {
              operation: "run",
              table: "password_reset_tokens",
              userId: "system",
            }
          );
        } catch (insertError) {
          console.error("Failed to store reset token:", insertError);
          throw new Error("Failed to process reset request");
        }

        // Send actual email with the full link
        console.log(
          "Attempting to send password reset email for user ID:",
          user.id
        );
        const emailResult = await emailService.sendPasswordResetEmail(
          user.email,
          resetLink // Pass the full link instead of just the token
        );

        if (emailResult.success) {
          console.log("✅ Password reset email sent successfully!");
          response = {
            message:
              "Password reset link has been sent to your email. Please check your inbox.",
            status: "sent",
            emailId: emailResult.emailId,
          };

          // Log successful password reset request
          console.log("Password reset email sent for user:", user.id);
        } else {
          // If sending fails, throw to log, but proceed to generic success response
          throw new Error(`Email sending failed: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error(
          "❌ Email process failed for user ID:",
          user.id,
          emailError
        );
        // Fallback to generic response for security, even if processing failed
        response = {
          message:
            "If an account with that email exists, a password reset link has been sent.",
          status: "sent",
        };
      }
    } else {
      console.log("No user found for the requested email.");
      // Execution continues to generic success response for security
    }

    // Add rate limit headers to response
    const rateLimitHeaders = rateLimiter.buildRateLimitHeaders(
      rateLimitInfo.limit,
      rateLimitInfo.remaining,
      rateLimitInfo.resetTime
    );

    // Always return success (200 OK) with the generic message
    return createSuccessResponse(response, 200, rateLimitHeaders);
  } catch (error) {
    console.error("Uncaught Password reset error:", error);

    // Log security event for failed password reset request
    await auth.logSecurityEvent("password_reset_failed", {
      error: error.message,
      ip: auth.getClientIP(request),
      userAgent: request.headers.get("user-agent"),
    });

    return createErrorResponse("Internal server error", 500);
  }
}
