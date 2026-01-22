// Email Verification System
// Handles account verification and email confirmation

import { SimpleAuth, createErrorResponse, createSuccessResponse } from "../_auth.js";
import { EmailService } from "../_email.js";
import { SimpleUserRepository } from "./_session-response.js";

export async function onRequestSendVerification(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);
  const userRepo = new SimpleUserRepository(env.DB);

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return createErrorResponse("Email is required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Find user by email
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return createErrorResponse("User not found", 404);
    }

    // Check if already verified
    if (user.email_verified) {
      return createErrorResponse("Email already verified", 400);
    }

    // Generate verification token
    const verificationToken = auth.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await env.DB.prepare(`
      INSERT OR REPLACE INTO email_verification_tokens (user_id, email, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user.id,
      email.toLowerCase().trim(),
      verificationToken,
      expiresAt.toISOString(),
      new Date().toISOString()
    ).run();

    // Send verification email
    const emailService = new EmailService(env);
    await emailService.sendVerificationEmail(email, verificationToken, user.name);

    return createSuccessResponse({ 
      message: "Verification email sent",
      email: email.toLowerCase().trim()
    });

  } catch (error) {
    console.error("Send verification error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function onRequestVerify(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);
  const userRepo = new SimpleUserRepository(env.DB);

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return createErrorResponse("Verification token is required", 400);
    }

    // Find and validate token
    const tokenRecord = await env.DB.prepare(`
      SELECT * FROM email_verification_tokens 
      WHERE token = ? AND expires_at > ? AND used = FALSE
    `).bind(token, new Date().toISOString()).first();

    if (!tokenRecord) {
      return createErrorResponse("Invalid or expired verification token", 400);
    }

    // Get user
    const user = await userRepo.findById(tokenRecord.user_id);
    if (!user) {
      return createErrorResponse("User not found", 404);
    }

    // Mark user as verified
    await env.DB.prepare(`
      UPDATE users SET email_verified = TRUE, updated_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), user.id).run();

    // Mark token as used
    await env.DB.prepare(`
      UPDATE email_verification_tokens SET used = TRUE, used_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), tokenRecord.id).run();

    // Log audit event
    await auth.logAuditEvent(
      user.id,
      "email_verified",
      null,
      null,
      auth.getClientIP(request),
      true
    );

    return createSuccessResponse({ 
      message: "Email verified successfully",
      email_verified: true
    });

  } catch (error) {
    console.error("Verify email error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

export async function onRequestResend(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);
  const userRepo = new SimpleUserRepository(env.DB);

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return createErrorResponse("Email is required", 400);
    }

    // Find user
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return createErrorResponse("User not found", 404);
    }

    // Check if already verified
    if (user.email_verified) {
      return createErrorResponse("Email already verified", 400);
    }

    // Delete existing tokens for this user
    await env.DB.prepare(`
      DELETE FROM email_verification_tokens WHERE email = ?
    `).bind(email.toLowerCase().trim()).run();

    // Generate new token
    const verificationToken = auth.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store new verification token
    await env.DB.prepare(`
      INSERT INTO email_verification_tokens (user_id, email, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user.id,
      email.toLowerCase().trim(),
      verificationToken,
      expiresAt.toISOString(),
      new Date().toISOString()
    ).run();

    // Send verification email
    const emailService = new EmailService(env);
    await emailService.sendVerificationEmail(email, verificationToken, user.name);

    return createSuccessResponse({ 
      message: "Verification email resent",
      email: email.toLowerCase().trim()
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
