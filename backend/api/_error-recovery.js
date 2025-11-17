// API Error Recovery and Health Monitoring System
// Implements graceful degradation and enhanced error handling
// Date: November 11, 2025

import { logError } from "./_errors.js";
import { createLogger } from "./_logger.js";

const logger = createLogger(process.env.NODE_ENV || "development");

/**
 * Enhanced API Error Recovery System
 * Provides graceful degradation for API failures
 */
export class APIErrorRecovery {
  constructor() {
    this.circuitBreakers = new Map();
    this.fallbackData = new Map();
    this.healthChecks = new Map();
    this.performanceMetrics = new Map();
  }

  /**
   * Check if a service is healthy (Circuit Breaker Pattern)
   */
  async checkServiceHealth(serviceName, healthCheckFn) {
    try {
      const result = await healthCheckFn();

      // Update circuit breaker state
      if (this.circuitBreakers.has(serviceName)) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (result.healthy) {
          breaker.failureCount = 0;
          breaker.state = "CLOSED";
        } else {
          breaker.failureCount++;
          if (breaker.failureCount >= breaker.threshold) {
            breaker.state = "OPEN";
          }
        }
      } else {
        this.circuitBreakers.set(serviceName, {
          state: result.healthy ? "CLOSED" : "OPEN",
          failureCount: result.healthy ? 0 : 1,
          threshold: 5,
          lastCheck: new Date(),
          cooldownPeriod: 60000, // 1 minute
        });
      }

      return {
        healthy: result.healthy,
        serviceName,
        responseTime: result.responseTime,
        state: this.circuitBreakers.get(serviceName)?.state || "UNKNOWN",
        lastCheck: this.circuitBreakers.get(serviceName)?.lastCheck,
      };
    } catch (error) {
      logger.error(`Health check failed for ${serviceName}`, error);
      return {
        healthy: false,
        serviceName,
        error: error.message,
        state: "OPEN",
      };
    }
  }

  /**
   * Execute operation with circuit breaker and fallback
   */
  async executeWithFallback(operationName, operationFn, fallbackFn = null) {
    const startTime = Date.now();

    try {
      // Check circuit breaker state
      const breaker = this.circuitBreakers.get(operationName);
      if (breaker && breaker.state === "OPEN") {
        // Check if cooldown period has passed
        const timeSinceLastCheck = Date.now() - breaker.lastCheck.getTime();
        if (timeSinceLastCheck < breaker.cooldownPeriod) {
          throw new Error(`Circuit breaker is OPEN for ${operationName}`);
        }
      }

      const result = await operationFn();
      const duration = Date.now() - startTime;

      // Record performance metrics
      this.recordPerformanceMetric(operationName, duration, true);

      // If circuit breaker was open, close it on success
      if (breaker && breaker.state === "OPEN") {
        breaker.state = "CLOSED";
        breaker.failureCount = 0;
        logger.info(`Circuit breaker closed for ${operationName}`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record performance metrics
      this.recordPerformanceMetric(operationName, duration, false);

      logger.error(`Operation ${operationName} failed`, error);

      // Try fallback if available
      if (fallbackFn) {
        try {
          logger.info(`Executing fallback for ${operationName}`);
          return await fallbackFn();
        } catch (fallbackError) {
          logger.error(
            `Fallback for ${operationName} also failed`,
            fallbackError
          );
        }
      }

      throw error;
    }
  }

  /**
   * Graceful degradation for database operations
   */
  async executeWithGracefulDegradation(operationName, primaryOp, degradedOp) {
    try {
      return await this.executeWithFallback(
        operationName,
        primaryOp,
        degradedOp
      );
    } catch (error) {
      // If both primary and fallback fail, provide minimal response
      return this.getMinimalResponse(operationName, error);
    }
  }

  /**
   * Get minimal response when all else fails
   */
  getMinimalResponse(operationName, error) {
    const response = {
      success: false,
      error: "Service temporarily unavailable",
      operation: operationName,
      timestamp: new Date().toISOString(),
      suggestion: "Please try again later",
    };

    // Add specific responses based on operation type
    if (operationName.includes("crops")) {
      response.message = "Crop data is temporarily unavailable";
      response.fallbackData = { crops: [], total: 0 };
    } else if (operationName.includes("animals")) {
      response.message = "Animal data is temporarily unavailable";
      response.fallbackData = { animals: [], total: 0 };
    } else if (operationName.includes("farms")) {
      response.message = "Farm data is temporarily unavailable";
      response.fallbackData = { farms: [], total: 0 };
    }

    return response;
  }

  /**
   * Record performance metrics
   */
  recordPerformanceMetric(operationName, duration, success) {
    if (!this.performanceMetrics.has(operationName)) {
      this.performanceMetrics.set(operationName, {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastCall: new Date(),
      });
    }

    const metrics = this.performanceMetrics.get(operationName);
    metrics.totalCalls++;

    if (success) {
      metrics.successfulCalls++;
    } else {
      metrics.failedCalls++;
    }

    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.totalCalls;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.lastCall = new Date();
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {};

    for (const [operation, metrics] of this.performanceMetrics) {
      summary[operation] = {
        ...metrics,
        successRate:
          metrics.totalCalls > 0
            ? ((metrics.successfulCalls / metrics.totalCalls) * 100).toFixed(
                2
              ) + "%"
            : "0%",
      };
    }

    return summary;
  }

  /**
   * System health check endpoint
   */
  async getSystemHealth() {
    const healthReport = {
      timestamp: new Date().toISOString(),
      overall: "HEALTHY",
      services: {},
      performance: this.getPerformanceSummary(),
      issues: [],
    };

    // Check circuit breaker states
    for (const [serviceName, breaker] of this.circuitBreakers) {
      healthReport.services[serviceName] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        threshold: breaker.threshold,
        lastCheck: breaker.lastCheck,
      };

      if (breaker.state === "OPEN") {
        healthReport.issues.push(`${serviceName} circuit breaker is OPEN`);
      }
    }

    // Determine overall health
    const openBreakers = Array.from(this.circuitBreakers.values()).filter(
      (b) => b.state === "OPEN"
    );
    if (openBreakers.length > 0) {
      healthReport.overall = "DEGRADED";
    }

    const criticalIssues = healthReport.issues.length;
    if (criticalIssues > 3) {
      healthReport.overall = "UNHEALTHY";
    }

    return healthReport;
  }
}

/**
 * Database Health Checker
 */
export class DatabaseHealthChecker {
  constructor(db) {
    this.db = db;
    this.lastCheck = null;
    this.cachedResult = null;
    this.checkInterval = 30000; // 30 seconds
  }

  async performHealthCheck() {
    try {
      const startTime = Date.now();

      // Test basic connectivity
      const { results } = await this.db
        .prepare("SELECT 1 as health_check")
        .all();
      const responseTime = Date.now() - startTime;

      this.lastCheck = new Date();
      this.cachedResult = {
        healthy: true,
        responseTime,
        timestamp: this.lastCheck,
        details: {
          connectionTest: true,
          queryPerformance: responseTime < 1000 ? "GOOD" : "SLOW",
        },
      };

      return this.cachedResult;
    } catch (error) {
      this.lastCheck = new Date();
      this.cachedResult = {
        healthy: false,
        error: error.message,
        timestamp: this.lastCheck,
        details: {
          connectionTest: false,
          errorType: error.code || "UNKNOWN",
        },
      };

      return this.cachedResult;
    }
  }

  async getCachedHealthCheck() {
    if (
      !this.lastCheck ||
      Date.now() - this.lastCheck.getTime() > this.checkInterval
    ) {
      return await this.performHealthCheck();
    }

    return this.cachedResult;
  }
}

/**
 * Cache Manager for API Performance
 */
export class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlSeconds * 1000);
  }

  get(key) {
    const expiration = this.ttl.get(key);

    if (expiration && Date.now() > expiration) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        value: typeof value === "object" ? "..." : value,
        expires: this.ttl.get(key),
      })),
    };
  }
}

// Export singleton instances
export const apiErrorRecovery = new APIErrorRecovery();
export const cacheManager = new CacheManager();

// Export helper functions
export async function withErrorRecovery(
  operationName,
  operationFn,
  options = {}
) {
  const { fallbackFn = null, gracefulDegradation = false } = options;

  if (gracefulDegradation) {
    return await apiErrorRecovery.executeWithGracefulDegradation(
      operationName,
      operationFn,
      fallbackFn
    );
  } else {
    return await apiErrorRecovery.executeWithFallback(
      operationName,
      operationFn,
      fallbackFn
    );
  }
}

export async function checkHealth(serviceName, healthCheckFn) {
  return await apiErrorRecovery.checkServiceHealth(serviceName, healthCheckFn);
}

export function recordPerformance(operationName, duration, success) {
  apiErrorRecovery.recordPerformanceMetric(operationName, duration, success);
}
