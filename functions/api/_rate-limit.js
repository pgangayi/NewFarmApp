// Cloudflare Workers Rate Limiting
// Simple in-memory rate limiter for authentication endpoints

const RATE_LIMIT_STORE = new Map();

// Rate limit configurations (development-friendly limits)
const RATE_LIMITS = {
  login: { requests: 20, window: 60000 }, // 20 requests per minute
  signup: { requests: 10, window: 3600000 }, // 10 requests per hour
  forgotPassword: { requests: 10, window: 3600000 }, // 10 requests per hour
  resetPassword: { requests: 15, window: 300000 }, // 15 requests per 5 minutes
};

export class RateLimiter {
  static getClientIP(request) {
    return (
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      "unknown"
    );
  }

  static isRateLimited(endpoint, clientIP) {
    const config = RATE_LIMITS[endpoint];
    if (!config) return false;

    const key = `${endpoint}:${clientIP}`;
    const now = Date.now();
    const windowStart = now - config.window;

    // Get or create rate limit record
    let record = RATE_LIMIT_STORE.get(key);
    if (!record || record.windowStart < windowStart) {
      record = { count: 0, windowStart: now };
    }

    // Reset if outside window
    if (record.windowStart < windowStart) {
      record.count = 0;
      record.windowStart = now;
    }

    // Check limit
    if (record.count >= config.requests) {
      return {
        limited: true,
        retryAfter: Math.ceil(
          (record.windowStart + config.window - now) / 1000
        ),
      };
    }

    // Increment counter
    record.count++;
    RATE_LIMIT_STORE.set(key, record);

    return { limited: false, remaining: config.requests - record.count };
  }

  static getRateLimitHeaders(endpoint, clientIP) {
    const config = RATE_LIMITS[endpoint];
    if (!config) return {};

    const key = `${endpoint}:${clientIP}`;
    const record = RATE_LIMIT_STORE.get(key) || {
      count: 0,
      windowStart: Date.now(),
    };
    const resetTime = new Date(
      record.windowStart + config.window
    ).toISOString();

    return {
      "X-RateLimit-Limit": config.requests.toString(),
      "X-RateLimit-Remaining": Math.max(
        0,
        config.requests - record.count
      ).toString(),
      "X-RateLimit-Reset": resetTime,
    };
  }

  static createRateLimitResponse(endpoint, clientIP) {
    const limited = this.isRateLimited(endpoint, clientIP);
    if (limited.limited) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: limited.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": limited.retryAfter.toString(),
            ...this.getRateLimitHeaders(endpoint, clientIP),
          },
        }
      );
    }
    return null;
  }
}
