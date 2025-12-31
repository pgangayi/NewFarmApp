/**
 * SIMPLIFIED AUTHENTICATION CORE
 * -----------------------------
 * A robust, consolidated authentication module using standard JWTs.
 * Best practice for development/SPA:
 * - Stateless JWTs
 * - Bcrypt password hashing
 * - Standard CORS handling
 */

import jwt from "@tsndr/cloudflare-worker-jwt";
import bcrypt from "bcryptjs";

// --- Configuration ---
const TOKEN_EXPIRY = "24h"; // Short enough for security, long enough for DX

// --- Helpers ---

// Standardized JSON Response
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const error = (msg, status = 400) =>
  new Response(JSON.stringify({ error: { message: msg } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// --- Core Functions ---

export class AuthCore {
  static async signup(request, env) {
    try {
      const { email, password, name } = await request.json();

      if (!email || !password || !name) {
        return error("Email, password, and name are required.");
      }

      // Check existing user
      const existing = await env.DB.prepare(
        "SELECT id FROM users WHERE email = ?"
      )
        .bind(email)
        .first();

      if (existing) {
        return error("User already exists.");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Create user
      await env.DB.prepare(
        "INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(userId, email, hashedPassword, name, "owner", now, now)
        .run();

      // Generate Token
      const token = await jwt.sign(
        { sub: userId, email, role: "owner" },
        env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      return json({
        user: { id: userId, email, name, role: "owner" },
        token,
      });
    } catch (e) {
      console.error("Signup Error:", e);
      return error("Signup failed: " + e.message, 500);
    }
  }

  static async login(request, env) {
    try {
      const { email, password } = await request.json();

      if (!email || !password) {
        return error("Email and password are required.");
      }

      // Get user
      const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .first();

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return error("Invalid credentials.", 401);
      }

      // Generate Token
      const token = await jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      // Log success (optional but good)
      console.log(`User logged in: ${user.email}`);

      return json({
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
        },
        token,
      });
    } catch (e) {
      console.error("Login Error:", e);
      return error("Login failed", 500);
    }
  }

  static async me(request, env) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return error("Unauthorized", 401);
      }

      const token = authHeader.split(" ")[1];
      const isValid = await jwt.verify(token, env.JWT_SECRET);

      if (!isValid) {
        return error("Invalid token", 401);
      }

      const { payload } = jwt.decode(token);

      const user = await env.DB.prepare(
        "SELECT id, email, full_name, role FROM users WHERE id = ?"
      )
        .bind(payload.sub)
        .first();

      if (!user) {
        return error("User not found", 404);
      }

      return json({
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
        },
      });
    } catch (e) {
      console.error("Me Error:", e);
      return error("Session invalid", 401);
    }
  }
}
