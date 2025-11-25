import crypto from "crypto";
import { createErrorResponse } from "../_auth.js";

const ACCESS_TOKEN_EXPIRES_IN = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60; // 30 days

export const SESSION_CONSTANTS = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
};

export function buildPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export class SimpleUserRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      return null;
    }

    const { results } = await this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(normalizedEmail)
      .all();

    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  async createUser(userData) {
    const { email, password_hash, name } = userData;
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    await this.db
      .prepare(
        `
        INSERT INTO users (id, email, name, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .bind(
        id,
        email.toLowerCase().trim(),
        name.trim(),
        password_hash,
        timestamp
      )
      .run();

    return {
      id,
      email,
      name,
      password_hash,
      created_at: timestamp,
    };
  }
}

export function createBaseResponseHeaders(rateLimitHeaders = {}) {
  return new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...rateLimitHeaders,
  });
}

export function buildRefreshCookie(
  refreshToken,
  maxAge = REFRESH_TOKEN_EXPIRES_IN
) {
  return `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function buildAuthPayload({
  user,
  accessToken,
  refreshToken,
  csrfToken,
  expiresIn = ACCESS_TOKEN_EXPIRES_IN,
}) {
  return {
    user,
    accessToken,
    refreshToken,
    csrfToken,
    expiresIn,
  };
}

export async function createSessionResponse({
  user,
  userId,
  accessToken,
  refreshToken,
  csrf,
  ipAddress,
  userAgent,
  rateLimitHeaders,
  status = 200,
  expiresIn = ACCESS_TOKEN_EXPIRES_IN,
  refreshMaxAge = REFRESH_TOKEN_EXPIRES_IN,
}) {
  const responseHeaders = createBaseResponseHeaders(rateLimitHeaders);
  const tempResponse = new Response(null, { headers: responseHeaders });

  const csrfResult = await csrf.generateAndSetToken(userId, tempResponse, {
    ipAddress,
    userAgent,
  });

  if (!csrfResult.success) {
    console.error("CSRF token generation failed", csrfResult.error);
    return {
      error: createErrorResponse("Failed to initialize CSRF token", 500),
    };
  }

  // Propagate CSRF cookie and header from the temporary response to the final headers
  const csrfCookie = tempResponse.headers.get("Set-Cookie");
  if (csrfCookie) {
    responseHeaders.append("Set-Cookie", csrfCookie);
  }

  const csrfHeader = tempResponse.headers.get("X-CSRF-Token");
  if (csrfHeader) {
    responseHeaders.set("X-CSRF-Token", csrfHeader);
  }

  responseHeaders.append(
    "Set-Cookie",
    buildRefreshCookie(refreshToken, refreshMaxAge)
  );

  const payload = buildAuthPayload({
    user,
    accessToken,
    refreshToken,
    csrfToken: csrfResult.token,
    expiresIn,
  });

  return {
    response: new Response(JSON.stringify(payload), {
      status,
      headers: responseHeaders,
    }),
    headers: responseHeaders,
    payload,
  };
}
