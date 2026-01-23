// Enhanced Rate Limiting Implementation
// Addresses audit findings for security enhancement

import { AuthUtils } from "./_auth.js";

const RATE_LIMIT_WINDOWS = {
  DEFAULT: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  AUTH: { requests: 10, window: 60 * 1000 }, // 10 auth attempts per minute
  CREATE: { requests: 50, window: 60 * 1000 }, // 50 creates per minute
  UPDATE: { requests: 100, window: 60 * 1000 }, // 100 updates per minute
  DELETE: { requests: 20, window: 60 * 1000 }, // 20 deletes per minute
  SEARCH: { requests: 30, window: 60 * 1000 }, // 30 searches per minute
};

const RATE_LIMIT_ERROR = {
  status: 429,
  statusText: "Too Many Requests",
  message: "Rate limit exceeded",
  type: "RATE_LIMIT_ERROR",
};

export class RateLimiter {
  constructor(env, options = {}) {
    this.env = env;
    this.redis = env.REDIS || null;
    this.inMemoryStore = new Map(); // Fallback for when Redis is not available
    this.config = { ...RATE_LIMIT_WINDOWS, ...options };
  }

  static extractClientIP(request) {
    return (
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"
    );
  }

  /**
   * Check if request should be rate limited
   * @param {string} identifier - Rate limit identifier (user_id, ip, etc.)
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
   */
  async checkLimit(identifier, endpoint, method) {
    const key = this.generateKey(identifier, endpoint, method);
    const limit = this.getLimitForEndpoint(endpoint, method);
    const now = Date.now();
    const windowStart = now - limit.window;

    try {
      if (this.redis) {
        return await this.checkRedisLimit(key, limit, windowStart, now);
      } else {
        return await this.checkMemoryLimit(key, limit, windowStart, now);
      }
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow request if rate limiting check fails
      return {
        allowed: true,
        remaining: limit.requests,
        resetTime: now + limit.window,
        limit: limit.requests,
      };
    }
  }

  async checkRedisLimit(key, limit, windowStart, now) {
    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, Math.ceil(limit.window / 1000));

    const results = await pipeline.exec();
    const currentCount = results[1][1]; // zcard result

    const allowed = currentCount < limit.requests;
    const remaining = Math.max(0, limit.requests - currentCount - 1);
    const resetTime = now + limit.window;

    return { allowed, remaining, resetTime, limit: limit.requests };
  }

  async checkMemoryLimit(key, limit, windowStart, now) {
    const record = this.inMemoryStore.get(key) || { requests: [], count: 0 };

    // Clean old requests
    record.requests = record.requests.filter(
      (timestamp) => timestamp > windowStart,
    );
    // Limit to last 100 requests to prevent large arrays causing hangs
    record.requests = record.requests.slice(-100);
    record.count = record.requests.length;

    const allowed = record.count < limit.requests;
    const remaining = Math.max(0, limit.requests - record.count - 1);
    const resetTime = now + limit.window;

    if (allowed) {
      record.requests.push(now);
      record.count++;
      this.inMemoryStore.set(key, record);
    }

    return { allowed, remaining, resetTime, limit: limit.requests };
  }

  generateKey(identifier, endpoint, method) {
    // Remove dynamic parts from endpoint for better rate limiting
    const cleanEndpoint = endpoint.replace(/\/[0-9a-f-]{36}/g, "/:id"); // UUID pattern
    return `rate_limit:${identifier}:${cleanEndpoint}:${method}`;
  }

  getLimitForEndpoint(endpoint, method) {
    const cleanEndpoint = endpoint.replace(/\/[0-9a-f-]{36}/g, "/:id");

    // Endpoint-specific limits
    if (cleanEndpoint.includes("/auth/") || cleanEndpoint.includes("auth")) {
      return this.config.AUTH;
    }
    if (method === "POST") {
      return this.config.CREATE;
    }
    if (method === "PUT" || method === "PATCH") {
      return this.config.UPDATE;
    }
    if (method === "DELETE") {
      return this.config.DELETE;
    }
    if (cleanEndpoint.includes("/search")) {
      return this.config.SEARCH;
    }

    return this.config.DEFAULT;
  }

  /**
   * Create rate limit exceeded response
   */
  createRateLimitResponse(remaining, resetTime, limit) {
    const errorResponse = {
      success: false,
      error: {
        code: RATE_LIMIT_ERROR.type,
        message: RATE_LIMIT_ERROR.message,
        remainingRequests: Math.max(0, remaining),
        resetTime: new Date(resetTime).toISOString(),
        limit,
      },
    };

    const headers = this.buildRateLimitHeaders(limit, remaining, resetTime);

    return new Response(JSON.stringify(errorResponse), {
      status: RATE_LIMIT_ERROR.status,
      statusText: RATE_LIMIT_ERROR.statusText,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  }

  buildRateLimitHeaders(limit, remaining, resetTime) {
    const safeLimit = Number.isFinite(limit) ? Math.max(0, limit) : 0;
    const safeRemaining = Number.isFinite(remaining)
      ? Math.max(0, remaining)
      : 0;
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((resetTime - Date.now()) / 1000),
    );

    return {
      "X-RateLimit-Limit": safeLimit.toString(),
      "X-RateLimit-Remaining": safeRemaining.toString(),
      "X-RateLimit-Reset": resetTime.toString(),
      "Retry-After": retryAfterSeconds.toString(),
      "Cache-Control": "no-store",
    };
  }

  /**
   * Middleware for automatic rate limiting
   */
  middleware() {
    return async (request, env) => {
      const identifier = await this.getIdentifier(request);
      const endpoint = new URL(request.url).pathname;
      const method = request.method;

      const { allowed, remaining, resetTime, limit } = await this.checkLimit(
        identifier,
        endpoint,
        method,
      );

      if (!allowed) {
        return this.createRateLimitResponse(remaining, resetTime, limit);
      }

      return null; // Allow request to continue
    };
  }

  /**
   * Get request identifier (user ID or IP)
   */
  async getIdentifier(request) {
    try {
      // Only attempt to resolve user from token when an Authorization header is present.
      // Avoids doing DB work for public endpoints (e.g. signup) which can hang the worker.
      const authHeader =
        request.headers.get("Authorization") ||
        request.headers.get("authorization");
      if (authHeader) {
        const auth = new AuthUtils(this.env);
        const user = await auth.getUserFromToken(request);
        if (user && user.id) {
          return `user_${user.id}`;
        }
      }
    } catch (error) {
      // User not authenticated, fall back to IP
    }

    // Fall back to IP address
    const clientIP = RateLimiter.extractClientIP(request);

    return `ip_${clientIP}`;
  }
}

/**
 * Utility function to apply rate limiting to any endpoint
 */
export async function applyRateLimit(request, env, endpoint, method) {
  const rateLimiter = new RateLimiter(env);
  const identifier = await rateLimiter.getIdentifier(request);
  const check = await rateLimiter.checkLimit(identifier, endpoint, method);

  if (!check.allowed) {
    return rateLimiter.createRateLimitResponse(
      check.remaining,
      check.resetTime,
      check.limit,
    );
  }

  return null;
}
