import { AuthUtils, createErrorResponse } from "../_auth.js";
import { TokenManager } from "../_token-management.js";
import { CSRFProtection } from "../_csrf.js";

const REFRESH_COOKIE_CLEAR =
  "refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
const CSRF_COOKIE_CLEAR =
  "csrf_token=; HttpOnly=false; Secure; SameSite=Strict; Path=/; Max-Age=0";

export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  if (method === "POST") {
    return handleLogoutPost(context);
  } else if (method === "GET") {
    return handleLogoutGet(context);
  } else {
    return createErrorResponse("Method not allowed", 405);
  }
}

async function handleLogoutPost(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);
  const tokenManager = new TokenManager(env);
  const csrf = new CSRFProtection(env);

  try {
    const csrfValidation = await csrf.validateCSRFToken(request);
    if (!csrfValidation.valid) {
      console.warn("CSRF validation failed for logout request", {
        error: csrfValidation.error,
        ip: auth.getClientIP(request),
      });
      await csrf.logSecurityEvent(
        "csrf_validation_failed",
        null,
        {
          ipAddress: auth.getClientIP(request),
          userAgent: request.headers.get("user-agent") || "unknown",
          method: request.method,
          url: request.url,
        },
        { reason: csrfValidation.error }
      );
      return createErrorResponse("CSRF validation failed", 403);
    }

    // Get user from token (required for logout)
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createErrorResponse("Invalid or missing access token", 401);
    }

    // Extract tokens for revocation
    const accessToken = auth.extractToken(request);
    const refreshToken = request.headers
      .get("Cookie")
      ?.match(/refresh_token=([^;]+)/)?.[1];

    // Revoke access token if present
    if (accessToken) {
      await tokenManager.revokeToken(
        accessToken,
        user.id,
        "user_logout",
        "access",
        null,
        {
          ipAddress: auth.getClientIP(request),
          userAgent: request.headers.get("user-agent") || "unknown",
        }
      );
      console.log("Access token revoked for user:", user.id);
    }

    // Revoke refresh token if present
    if (refreshToken) {
      await tokenManager.revokeToken(
        refreshToken,
        user.id,
        "user_logout",
        "refresh",
        null,
        {
          ipAddress: auth.getClientIP(request),
          userAgent: request.headers.get("user-agent") || "unknown",
        }
      );
      console.log("Refresh token revoked for user:", user.id);
    }

    // Clear refresh token cookie by setting it to expire
    const responseHeaders = new Headers({ "Content-Type": "application/json" });
    responseHeaders.append("Set-Cookie", REFRESH_COOKIE_CLEAR);
    responseHeaders.append("Set-Cookie", CSRF_COOKIE_CLEAR);

    console.log("Logout successful for user:", user.id);

    return new Response(
      JSON.stringify({ message: "Logged out successfully" }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Support GET requests for logout redirects
async function handleLogoutGet(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);
  const tokenManager = new TokenManager(env);

  try {
    // Try to get user from token (optional for GET logout)
    const user = await auth.getUserFromToken(request);

    if (user) {
      // Extract and revoke tokens
      const accessToken = auth.extractToken(request);
      const refreshToken = request.headers
        .get("Cookie")
        ?.match(/refresh_token=([^;]+)/)?.[1];

      if (accessToken) {
        await tokenManager.revokeToken(
          accessToken,
          user.id,
          "user_logout_get",
          "access",
          null,
          {
            ipAddress: auth.getClientIP(request),
            userAgent: request.headers.get("user-agent") || "unknown",
          }
        );
      }

      if (refreshToken) {
        await tokenManager.revokeToken(
          refreshToken,
          user.id,
          "user_logout_get",
          "refresh",
          null,
          {
            ipAddress: auth.getClientIP(request),
            userAgent: request.headers.get("user-agent") || "unknown",
          }
        );
      }
    }

    const responseHeaders = new Headers({ "Content-Type": "application/json" });
    responseHeaders.append("Set-Cookie", REFRESH_COOKIE_CLEAR);
    responseHeaders.append("Set-Cookie", CSRF_COOKIE_CLEAR);

    return new Response(
      JSON.stringify({ message: "Logged out successfully" }),
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("Logout error (GET):", error);
    return createErrorResponse("Internal server error", 500);
  }
}
