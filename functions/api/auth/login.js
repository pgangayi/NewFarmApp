import { AuthUtils, createErrorResponse } from "../_auth.js";
import { RateLimiter } from "../_rate-limit.js";
import { findUserByEmail } from "../_auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);

  // Check rate limiting
  const clientIP = RateLimiter.getClientIP(request);
  const rateLimitResponse = RateLimiter.createRateLimitResponse(
    "login",
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
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = body;

    console.log("Login attempt for email:", email);

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user from database with constant-time processing
    const user = await findUserByEmail(env, email);
    if (!user) {
      // Use constant time to prevent timing attacks
      const fakeHash = "$2b$12$fakehashforconstanttimecomparison";
      await auth.verifyPassword(password, fakeHash);
      // Generic error message to prevent user enumeration
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify password
    const isValidPassword = await auth.verifyPassword(
      password,
      user.password_hash
    );
    if (!isValidPassword) {
      // Generic error message to prevent user enumeration
      return new Response(
        JSON.stringify({ error: "Invalid email or password" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate JWT token
    console.log("Generating token for user:", user.id);
    const token = auth.generateToken(user.id, user.email);

    // Return user data and token
    const { password_hash, ...userWithoutPassword } = user;
    console.log("Login successful for:", email);

    // Add rate limit headers to successful response
    const rateLimitHeaders = RateLimiter.getRateLimitHeaders("login", clientIP);

    return new Response(
      JSON.stringify({
        user: userWithoutPassword,
        token,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...rateLimitHeaders },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return createErrorResponse("Internal server error: " + error.message, 500);
  }
}
