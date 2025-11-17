// Performance monitoring and optimization utilities
// Implements caching, query optimization, and performance tracking

import { getClientIP } from "./_logger.js";

// Simple in-memory cache with TTL
export class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });

    // Set cleanup timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
const globalCache = new MemoryCache();

// Cache decorator for functions
export function cacheable(ttlSeconds = 300) {
  return function (target, propertyName, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      globalCache.set(cacheKey, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}

// Database query optimizer
export class QueryOptimizer {
  constructor(env) {
    this.env = env;
    this.queryCache = new MemoryCache();
  }

  // Execute optimized query with caching
  // Note: @cacheable(60) decorator removed - not supported by Workers
  // Cache for 1 minute
  async executeQuery(query, params = [], cacheKey = null) {
    const startTime = Date.now();

    try {
      const result = await this.env.DB.prepare(query)
        .bind(...params)
        .all();

      const executionTime = Date.now() - startTime;

      // Log slow queries
      if (executionTime > 1000) {
        console.warn(
          `Slow query detected (${executionTime}ms):`,
          query.substring(0, 100)
        );
      }

      return result;
    } catch (error) {
      console.error("Query execution error:", error);
      throw error;
    }
  }

  // Optimize INSERT operations with batch support
  async executeBatchInsert(table, data, batchSize = 100) {
    const results = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const placeholders = batch.map(() => "(?)").join(", ");
      const values = batch.flat();
      const query = `INSERT INTO ${table} VALUES ${placeholders}`;

      const result = await this.env.DB.prepare(query)
        .bind(...values)
        .run();

      results.push(result);
    }

    return results;
  }

  // Optimize SELECT with pagination
  async executePaginatedQuery(query, params, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const paginatedQuery = `${query} LIMIT ${pageSize} OFFSET ${offset}`;

    return await this.executeQuery(paginatedQuery, params);
  }
}

// Response caching for API endpoints
export class ResponseCache {
  constructor() {
    this.cache = new MemoryCache();
  }

  set(key, response, ttlSeconds = 300) {
    this.cache.set(
      key,
      {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: response.body,
      },
      ttlSeconds
    );
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    return new Response(cached.body, {
      status: cached.status,
      headers: cached.headers,
    });
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// Performance monitoring
export class PerformanceMonitor {
  constructor(env) {
    this.env = env;
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  // Record request metrics
  recordRequest(responseTime, hasError = false, isCacheHit = false) {
    this.metrics.requests++;

    if (hasError) {
      this.metrics.errors++;
    }

    if (isCacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    this.metrics.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
    }
  }

  // Record slow query
  recordSlowQuery(query, executionTime) {
    this.metrics.slowQueries++;

    if (this.env.ENVIRONMENT === "development") {
      console.warn(`Slow query (${executionTime}ms):`, query.substring(0, 100));
    }
  }

  // Get performance statistics
  getStats() {
    const {
      requests,
      errors,
      responseTimes,
      slowQueries,
      cacheHits,
      cacheMisses,
    } = this.metrics;

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const p95ResponseTime =
      responseTimes.length > 0
        ? responseTimes.sort((a, b) => a - b)[
            Math.floor(responseTimes.length * 0.95)
          ]
        : 0;

    const errorRate = requests > 0 ? (errors / requests) * 100 : 0;
    const cacheHitRate =
      cacheHits + cacheMisses > 0
        ? (cacheHits / (cacheHits + cacheMisses)) * 100
        : 0;

    return {
      requests,
      errors,
      errorRate: errorRate.toFixed(2),
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      slowQueries,
      cacheHits,
      cacheMisses,
      cacheHitRate: cacheHitRate.toFixed(2),
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

// Global performance monitor
export const performanceMonitor = new PerformanceMonitor({
  ENVIRONMENT: process.env.ENVIRONMENT || "production",
});

// Middleware for performance monitoring
export function performanceMiddleware() {
  return async (request, env) => {
    const startTime = Date.now();
    const isCacheHit = false; // Set by route handlers

    try {
      const response = await request;
      const responseTime = Date.now() - startTime;

      performanceMonitor.recordRequest(
        responseTime,
        response.status >= 400,
        isCacheHit
      );

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      performanceMonitor.recordRequest(responseTime, true, isCacheHit);
      throw error;
    }
  };
}

// Database connection pool monitoring
export class DatabaseMonitor {
  constructor(env) {
    this.env = env;
    this.connectionStats = {
      totalQueries: 0,
      slowQueries: 0,
      errorQueries: 0,
      avgQueryTime: 0,
    };
  }

  // Monitor query execution
  async monitorQuery(query, params = [], executionTime) {
    this.connectionStats.totalQueries++;

    if (executionTime > 1000) {
      this.connectionStats.slowQueries++;
    }

    // Calculate running average
    this.connectionStats.avgQueryTime =
      (this.connectionStats.avgQueryTime *
        (this.connectionStats.totalQueries - 1) +
        executionTime) /
      this.connectionStats.totalQueries;
  }

  getStats() {
    return { ...this.connectionStats };
  }
}

export const databaseMonitor = new DatabaseMonitor({});
