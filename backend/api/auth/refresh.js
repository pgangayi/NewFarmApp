import { AuthUtils, createErrorResponse } from "../_auth.js";
import { TokenManager } from "../_token-management.js";
import { CSRFProtection } from "../_csrf.js";
import { DatabaseOperations } from "../_database.js";
import { UserRepository } from "../repositories/index.js";
import {
  buildPublicUser,
  createSessionResponse,
  SimpleUserRepository,
} from "./_session-response.js";

export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  if (method === "POST") {
    return handleRefreshRequest(context);
  } else if (method === "GET") {
    return handleRefreshHealthCheck(context);
  }

  return createErrorResponse("Method not allowed", 405);
}

async function handleRefreshRequest(context) {
  const { request, env } = context;
  const auth = new AuthUtils(env);
  const tokenManager = new TokenManager(env);
  const csrf = new CSRFProtection(env);
  const db = new DatabaseOperations(env);
  const userRepo = new UserRepository(db);

  const ipAddress = auth.getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Try to validate CSRF but allow refresh if user token is valid
    const csrfValidation = await csrf.validateCSRFToken(request);
    if (!csrfValidation.valid) {
      console.warn("CSRF validation failed during token refresh", {
        error: csrfValidation.error,
        ip: ipAddress,
      });
      // Log but continue - CSRF may have expired
    }

    const refreshToken = request.headers
      .get("Cookie")
      ?.match(/refresh_token=([^;]+)/)?.[1];

    if (!refreshToken) {
      return createErrorResponse("Refresh token missing", 401);
    }

    const payload = await auth.verifyToken(refreshToken);
    if (!payload) {
      return createErrorResponse("Invalid refresh token", 401);
    }

    const revocationStatus = await tokenManager.isTokenRevoked(
      refreshToken,
      "refresh",
    );
    if (revocationStatus.revoked) {
      return createErrorResponse("Refresh token revoked", 401);
    }

    const user = await userRepo.findByEmail(payload.email);
    if (!user) {
      return createErrorResponse("User not found", 401);
    }

    const newAccessToken = await auth.generateAccessToken(user.id, user.email);
    const shouldRotateRefreshToken = env.REFRESH_TOKEN_ROTATION !== "false";
    let newRefreshToken = refreshToken;

    if (shouldRotateRefreshToken) {
      newRefreshToken = await auth.generateRefreshToken(user.id, user.email);
      await tokenManager.revokeToken(
        refreshToken,
        user.id,
        "refresh_token_rotated",
        "refresh",
        null,
        { ipAddress, userAgent },
      );
    }

    const sessionResult = await createSessionResponse({
      user: buildPublicUser(user),
      userId: user.id,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      csrf,
      ipAddress,
      userAgent,
      status: 200,
      env,
    });

    if (sessionResult.error) {
      return sessionResult.error;
    }

    return sessionResult.response;
  } catch (error) {
    console.error("Token refresh error:", error);
    await auth.logSecurityEvent("token_refresh_failed", {
      error: error.message,
      ip: ipAddress,
      userAgent,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

async function handleRefreshHealthCheck(context) {
  const { request } = context;

  const hasRefreshToken = request.headers
    .get("Cookie")
    ?.includes("refresh_token=");

  return new Response(
    JSON.stringify({
      hasRefreshToken,
      message: hasRefreshToken
        ? "Refresh token available"
        : "No refresh token found",
    }),
    {
      status: hasRefreshToken ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    },
  );
}
