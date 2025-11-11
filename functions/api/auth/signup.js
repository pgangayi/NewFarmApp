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
    "signup",
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

    const { email, password, name } = body;

    if (!email || !password || !name) {
      return createErrorResponse("Email, password, and name required", 400);
    }

    // Enhanced email validation with more strict regex
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse("Invalid email format", 400);
    }

    // Check if user already exists
    const { results: existingUsers } = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(email)
      .all();

    if (existingUsers && existingUsers.length > 0) {
      // Add rate limit headers to error response
      const rateLimitHeaders = RateLimiter.getRateLimitHeaders(
        "signup",
        clientIP
      );
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      });
    }

    // Enhanced password validation
    if (password.length < 12) {
      return createErrorResponse(
        "Password must be at least 12 characters long",
        400
      );
    }

    // Check for complexity requirements
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return createErrorResponse(
        "Password must contain uppercase, lowercase, number, and special character",
        400
      );
    }

    // Hash password
    const passwordHash = await auth.hashPassword(password);

    // Generate user ID
    const userId = `user_${Date.now()}_${crypto
      .randomUUID()
      .replace(/-/g, "")}`;

    // Create user in database
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)"
    )
      .bind(userId, email, name, passwordHash)
      .run();

    // Generate JWT token
    const token = auth.generateToken(userId, email);

    // Return user data and token
    const user = {
      id: userId,
      email,
      name,
      created_at: new Date().toISOString(),
    };

    // Add rate limit headers to successful response
    const rateLimitHeaders = RateLimiter.getRateLimitHeaders(
      "signup",
      clientIP
    );

    return new Response(
      JSON.stringify({
        user,
        token,
        message: "User created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return createErrorResponse("Internal server error: " + error.message, 500);
  }
}
