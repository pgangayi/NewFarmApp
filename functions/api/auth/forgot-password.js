import {
  AuthUtils,
  createErrorResponse,
  createSuccessResponse,
  generateSecureToken,
  hashResetToken,
} from "../_auth.js";
import { RateLimiter } from "../_rate-limit.js";
import { EmailService } from "../_email.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);
  const emailService = new EmailService(env);

  // Check rate limiting
  const clientIP = RateLimiter.getClientIP(request);
  const rateLimitResponse = RateLimiter.createRateLimitResponse(
    "forgotPassword",
    clientIP
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return createErrorResponse("Invalid JSON in request body", 400);
    }

    const { email } = body;

    console.log("Password reset request for email:", email);

    if (!email) {
      return createErrorResponse("Email is required", 400);
    }

    // Enhanced email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Check if user exists
    const { results } = await env.DB.prepare(
      "SELECT id, email FROM users WHERE email = ?"
    )
      .bind(email)
      .all();

    // Always return success even if user doesn't exist (security best practice)
    let response = {
      message:
        "If an account with that email exists, a password reset link has been sent.",
      status: "sent",
    };

    if (results && results.length > 0) {
      const user = results[0];
      console.log("User found, generating reset token for:", user.email);

      try {
        // Generate secure reset token using crypto
        const resetToken = generateSecureToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Hash the reset token before storing (CRITICAL SECURITY FIX)
        const tokenHash = await hashResetToken(resetToken);

        // Clean up any existing unused tokens for this user
        await env.DB.prepare(
          "DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL"
        )
          .bind(user.id)
          .run();

        // Store hashed reset token
        await env.DB.prepare(
          "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)"
        )
          .bind(user.id, tokenHash, expiresAt.toISOString())
          .run();

        // Send actual email
        console.log("Sending password reset email to:", user.email);
        const emailResult = await emailService.sendPasswordResetEmail(
          user.email,
          resetToken
        );

        if (emailResult.success) {
          console.log("✅ Password reset email sent successfully!");
          response = {
            message:
              "Password reset link has been sent to your email. Please check your inbox.",
            status: "sent",
            emailId: emailResult.emailId,
          };
        } else {
          throw new Error("Email sending failed");
        }
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
        // Still return success for security, but log the issue
        response = {
          message:
            "If an account with that email exists, a password reset link has been sent.",
          status: "sent",
          emailError: "Email delivery failed - please contact support",
        };
      }
    } else {
      console.log("No user found for email:", email);
      // For security, we don't reveal whether user exists
    }

    // Add rate limit headers to response
    const rateLimitHeaders = RateLimiter.getRateLimitHeaders(
      "forgotPassword",
      clientIP
    );

    return createSuccessResponse(response, 200, rateLimitHeaders);
  } catch (error) {
    console.error("Password reset error:", error);
    return createErrorResponse("Internal server error: " + error.message, 500);
  }
}

// Generate reset link
function generateResetLink(token, env) {
  // Use the same base URL as the frontend or a configured app URL
  const baseUrl = env.APP_URL || "http://localhost:3000";
  return `${baseUrl}/reset-password?token=${token}`;
}
