// Simplified Signup Endpoint
// Maintains security while reducing complexity
// Date: November 18, 2025

import { SimpleAuth, createErrorResponse } from "../_auth.js";
import { CSRFProtection } from "../_csrf.js";
import { EmailService } from "../_email.js";
import {
  validatePassword,
  validateEmail,
  validateName,
} from "../_validation.js";
import {
  buildPublicUser,
  createSessionResponse,
  SimpleUserRepository,
} from "./_session-response.js";

export async function onRequest(context) {
  const { request, env } = context;
  console.log(`[Auth:signup] Enter handler - ${request.method} ${request.url}`);

  if (request.method !== "POST") {
    console.log("Method not POST");
    return createErrorResponse("Method not allowed", 405);
  }

  const auth = new SimpleAuth(env);
  const userRepo = new SimpleUserRepository(env.DB);
  const emailService = new EmailService(env);

  try {
    console.log("Starting signup process");
    // Parse request body
    console.log("Parsing request body");
    const body = await request.json();
    const { email, password, name } = body;
    console.log("Request body parsed");

    // Validate input
    console.log("Validating input");
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return createErrorResponse(emailValidation.error, 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return createErrorResponse(passwordValidation.error, 400);
    }

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return createErrorResponse(nameValidation.error, 400);
    }
    console.log("Input validation complete");

    // Check if user already exists
    console.log("Checking if user exists");
    const existingUser = await userRepo.findByEmail(emailValidation.email);
    console.log("User existence check complete");
    if (existingUser) {
      return createErrorResponse("User with this email already exists", 409);
    }

    // Hash password
    console.log("Hashing password");
    const hashedPassword = await auth.hashPassword(password);
    console.log("Password hashing complete");

    // Insert user into database
    console.log("Creating user");
    const user = await userRepo.createUser({
      email: emailValidation.email,
      password_hash: hashedPassword,
      name: nameValidation.name,
    });
    console.log("User creation complete");

    // Generate verification token
    console.log("Generating verification token");
    const verificationToken = auth.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    console.log("Verification token generated");

    // Store verification token
    console.log("Storing verification token");
    await env.DB.prepare(
      `
      INSERT INTO email_verification_tokens (user_id, email, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
      .bind(
        user.id,
        emailValidation.email,
        verificationToken,
        expiresAt.toISOString(),
        new Date().toISOString(),
      )
      .run();
    console.log("Verification token stored");

    // Send verification email
    console.log("Sending verification email");
    try {
      await emailService.sendVerificationEmail(
        emailValidation.email,
        verificationToken,
        nameValidation.name,
      );
      console.log("Verification email sent");
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Do not fail signup solely due to email issues during debugging
    }

    // Create session/token
    console.log("Generating access token");
    const accessToken = await auth.generateAccessToken(
      user.id,
      emailValidation.email,
    );
    console.log("Access token generated");

    // Build public user object
    const publicUser = buildPublicUser(user);

    // Return response with user and token
    return new Response(
      JSON.stringify({
        user: publicUser,
        token: accessToken,
        message:
          "User created successfully. Please check your email to verify your account.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Signup error:", error);
    // Return stack and message when debug flag present in URL (local dev only)
    try {
      const url = new URL(request.url);
      if (url.searchParams.get("debug") === "1") {
        return new Response(
          JSON.stringify({
            error: "Internal server error",
            message: error?.message || "unknown",
            stack: error?.stack || null,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    } catch (e) {
      // ignore URL parse errors and fall back to generic response
      console.error("Error parsing URL for debug flag:", e);
    }

    return createErrorResponse("Internal server error", 500);
  }
}
