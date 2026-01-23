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
      queryExecutionTimes: [],
      alertsTriggered: 0,
    };
    this.alertThresholds = {
      slowQueryMs: 1000,
      errorRatePercent: 5,
      avgResponseTimeMs: 2000,
    };
    this.alerts = [];
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

    // Check for performance alerts
    this.checkPerformanceAlerts();
  }

  // Record slow query
  recordSlowQuery(query, executionTime, table = 'unknown', operation = 'unknown') {
    this.metrics.slowQueries++;
    this.metrics.queryExecutionTimes.push({
      query: query.substring(0, 200),
      executionTime,
      table,
      operation,
      timestamp: new Date().toISOString()
    });

    // Keep only last 500 query times
    if (this.metrics.queryExecutionTimes.length > 500) {
      this.metrics.queryExecutionTimes.shift();
    }

    if (this.env.ENVIRONMENT === "development") {
      console.warn(`Slow query (${executionTime}ms):`, query.substring(0, 100));
    }

    // Trigger alert for very slow queries
    if (executionTime > this.alertThresholds.slowQueryMs * 2) {
      this.triggerAlert('CRITICAL_SLOW_QUERY', {
        query: query.substring(0, 200),
        executionTime,
        table,
        operation
      });
    }
  }

  // Check for performance alerts
  checkPerformanceAlerts() {
    const stats = this.getStats();

    // Check error rate
    if (stats.errorRate > this.alertThresholds.errorRatePercent) {
      this.triggerAlert('HIGH_ERROR_RATE', {
        errorRate: stats.errorRate,
        threshold: this.alertThresholds.errorRatePercent
      });
    }

    // Check average response time
    if (stats.avgResponseTime > this.alertThresholds.avgResponseTimeMs) {
      this.triggerAlert('HIGH_RESPONSE_TIME', {
        avgResponseTime: stats.avgResponseTime,
        threshold: this.alertThresholds.avgResponseTimeMs
      });
    }

    // Check for too many slow queries
    if (this.metrics.slowQueries > 10) {
      this.triggerAlert('EXCESSIVE_SLOW_QUERIES', {
        slowQueryCount: this.metrics.slowQueries
      });
    }
  }

  // Trigger performance alert
  triggerAlert(type, data) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.push(alert);
    this.metrics.alertsTriggered++;

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log alert
    console.warn(`PERFORMANCE ALERT [${type}]:`, data);

    // In production, this could send notifications via email/webhook
    if (this.env.ENVIRONMENT === "production") {
      // TODO: Implement notification system (email, webhook, etc.)
    }

    return alert;
  }

  // Get active alerts
  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  // Acknowledge alert
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
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
      queryExecutionTimes,
      alertsTriggered,
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

    const avgQueryTime =
      queryExecutionTimes.length > 0
        ? queryExecutionTimes.reduce((sum, q) => sum + q.executionTime, 0) / queryExecutionTimes.length
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
      avgQueryTime: Math.round(avgQueryTime),
      cacheHits,
      cacheMisses,
      cacheHitRate: cacheHitRate.toFixed(2),
      alertsTriggered,
      activeAlerts: this.getActiveAlerts().length,
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
      queryExecutionTimes: [],
      alertsTriggered: 0,
    };
    this.alerts = [];
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
