// Simplified Session Response Utilities
// Reduces complexity while maintaining functionality
// Date: November 18, 2025

import crypto from "crypto";

const ACCESS_TOKEN_EXPIRES_IN = 60 * 60; // 1 hour
const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60; // 30 days

export function buildPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  };
}

export function createSessionResponse({
  user,
  accessToken,
  refreshToken,
  csrfToken,
  status = 200,
}) {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });

  // Set refresh token as httpOnly cookie
  const refreshCookie = `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${REFRESH_TOKEN_EXPIRES_IN}`;
  headers.append("Set-Cookie", refreshCookie);

  const payload = {
    user,
    accessToken,
    refreshToken,
    csrfToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };

  return new Response(JSON.stringify(payload), {
    status,
    headers,
  });
}

// Simplified user repository functions
export class SimpleUserRepository {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    const { results } = await this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email.toLowerCase().trim())
      .all();
    return results && results.length > 0 ? results[0] : null;
  }

  async createUser(userData) {
    const { email, password_hash, name } = userData;
    const id = crypto.randomUUID();

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
        new Date().toISOString()
      )
      .run();

    return {
      id,
      email,
      name,
      password_hash,
      created_at: new Date().toISOString(),
    };
  }
}
