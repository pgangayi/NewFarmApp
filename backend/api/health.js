// Simple Health Check

/**
 * Performance Metrics Collector
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.requestCounters = new Map();
    this.responseTimes = new Map();
    this.errorRates = new Map();
    this.cacheHitRates = new Map();
  }

  /**
   * Record API request metrics
   */
  recordRequest(endpoint, method, duration, statusCode, cacheHit = false) {
    const key = `${method}:${endpoint}`;

    if (!this.requestCounters.has(key)) {
      this.requestCounters.set(key, {
        total: 0,
        success: 0,
        error: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        cacheHits: 0,
        cacheMisses: 0,
      });
    }

    const metrics = this.requestCounters.get(key);
    metrics.total++;

    if (statusCode >= 200 && statusCode < 300) {
      metrics.success++;
    } else {
      metrics.error++;
    }

    // Update duration metrics
    if (metrics.total === 1) {
      metrics.averageDuration = duration;
      metrics.minDuration = duration;
      metrics.maxDuration = duration;
    } else {
      metrics.averageDuration =
        (metrics.averageDuration * (metrics.total - 1) + duration) /
        metrics.total;
      metrics.minDuration = Math.min(metrics.minDuration, duration);
      metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    }

    // Update cache metrics
    if (cacheHit) {
      metrics.cacheHits++;
    } else {
      metrics.cacheMisses++;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {};

    for (const [endpoint, metrics] of this.requestCounters) {
      const total = metrics.total;
      const successRate =
        total > 0 ? ((metrics.success / total) * 100).toFixed(2) : "0.00";
      const errorRate =
        total > 0 ? ((metrics.error / total) * 100).toFixed(2) : "0.00";
      const cacheHitRate =
        metrics.cacheHits + metrics.cacheMisses > 0
          ? (
              (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) *
              100
            ).toFixed(2)
          : "0.00";

      summary[endpoint] = {
        ...metrics,
        successRate: `${successRate}%`,
        errorRate: `${errorRate}%`,
        cacheHitRate: `${cacheHitRate}%`,
      };
    }

    return summary;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    const summary = this.getPerformanceSummary();
    const totalRequests = Array.from(this.requestCounters.values()).reduce(
      (sum, metrics) => sum + metrics.total,
      0
    );

    const totalErrors = Array.from(this.requestCounters.values()).reduce(
      (sum, metrics) => sum + metrics.error,
      0
    );

    const overallErrorRate =
      totalRequests > 0
        ? ((totalErrors / totalRequests) * 100).toFixed(2)
        : "0.00";

    return {
      timestamp: new Date().toISOString(),
      overview: {
        totalRequests,
        totalErrors,
        overallErrorRate: `${overallErrorRate}%`,
        systemStatus:
          overallErrorRate > 10
            ? "WARNING"
            : overallErrorRate > 20
            ? "CRITICAL"
            : "HEALTHY",
      },
      endpoints: summary,
    };
  }
}

/**
 * System Health Check Handler
 */
export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      status: "HEALTHY",
      timestamp: new Date().toISOString(),
      message: "System is operational",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Comprehensive system health check
 */
async function handleComprehensiveHealthCheck(env) {
  const startTime = Date.now();

  const healthChecks = await Promise.allSettled([
    checkDatabaseHealth(env.DB),
    checkCacheHealth(),
    checkPerformanceHealth(),
    checkCircuitBreakerHealth(),
  ]);

  const [databaseHealth, cacheHealth, performanceHealth, circuitBreakerHealth] =
    healthChecks;

  const overallStatus = determineOverallStatus([
    databaseHealth.status === "fulfilled"
      ? databaseHealth.value
      : { status: "CRITICAL", message: "Check failed" },
    cacheHealth.status === "fulfilled"
      ? cacheHealth.value
      : { status: "WARNING", message: "Check failed" },
    performanceHealth.status === "fulfilled"
      ? performanceHealth.value
      : { status: "HEALTHY", message: "Check failed" },
    circuitBreakerHealth.status === "fulfilled"
      ? circuitBreakerHealth.value
      : { status: "WARNING", message: "Check failed" },
  ]);

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    checks: {
      database:
        databaseHealth.status === "fulfilled"
          ? databaseHealth.value
          : { status: "CRITICAL", error: databaseHealth.reason?.message },
      cache:
        cacheHealth.status === "fulfilled"
          ? cacheHealth.value
          : { status: "WARNING", error: cacheHealth.reason?.message },
      performance:
        performanceHealth.status === "fulfilled"
          ? performanceHealth.value
          : { status: "HEALTHY", error: performanceHealth.reason?.message },
      circuitBreakers:
        circuitBreakerHealth.status === "fulfilled"
          ? circuitBreakerHealth.value
          : { status: "WARNING", error: circuitBreakerHealth.reason?.message },
    },
    recommendations: generateRecommendations([
      databaseHealth.status === "fulfilled" ? databaseHealth.value : null,
      cacheHealth.status === "fulfilled" ? cacheHealth.value : null,
      performanceHealth.status === "fulfilled" ? performanceHealth.value : null,
      circuitBreakerHealth.status === "fulfilled"
        ? circuitBreakerHealth.value
        : null,
    ]),
  };

  return createSuccessResponse(response);
}

/**
 * Database health check with timeout and caching
 */
async function checkDatabaseHealth(db) {
  try {
    const startTime = Date.now();

    // Use error recovery for database health check
    const result = await withErrorRecovery(
      "database_health_check",
      async () => {
        const { results } = await db.prepare("SELECT 1 as health_check").all();
        return {
          status: "HEALTHY",
          responseTime: Date.now() - startTime,
          connectionStatus: "Connected",
          results: results[0],
        };
      },
      {
        fallbackFn: async () => ({
          status: "DEGRADED",
          responseTime: Date.now() - startTime,
          connectionStatus: "Fallback Mode",
          message: "Using cached health status",
        }),
        gracefulDegradation: true,
      }
    );

    return result;
  } catch (error) {
    return {
      status: "CRITICAL",
      error: error.message,
      connectionStatus: "Disconnected",
    };
  }
}

/**
 * Cache health check
 */
async function checkCacheHealth() {
  try {
    const stats = cacheManager.getStats();

    return {
      status: "HEALTHY",
      cacheSize: stats.size,
      cacheEntries: stats.entries.length,
      performance:
        stats.size < 100
          ? "Good"
          : stats.size < 500
          ? "Acceptable"
          : "Needs Optimization",
    };
  } catch (error) {
    return {
      status: "CRITICAL",
      error: error.message,
    };
  }
}

/**
 * Performance health check
 */
async function checkPerformanceHealth() {
  try {
    const performanceMonitor = new PerformanceMonitor();
    const report = performanceMonitor.generatePerformanceReport();

    return {
      status:
        report.overview.systemStatus === "HEALTHY"
          ? "HEALTHY"
          : report.overview.systemStatus === "WARNING"
          ? "WARNING"
          : "CRITICAL",
      totalRequests: report.overview.totalRequests,
      errorRate: report.overview.overallErrorRate,
      systemStatus: report.overview.systemStatus,
    };
  } catch (error) {
    return {
      status: "WARNING",
      error: error.message,
    };
  }
}

/**
 * Circuit breaker health check
 */
async function checkCircuitBreakerHealth() {
  try {
    const systemHealth = await apiErrorRecovery.getSystemHealth();

    return {
      status: systemHealth.overall,
      openBreakers: Object.values(systemHealth.services).filter(
        (s) => s.state === "OPEN"
      ).length,
      totalServices: Object.keys(systemHealth.services).length,
      issues: systemHealth.issues,
    };
  } catch (error) {
    return {
      status: "WARNING",
      error: error.message,
    };
  }
}

/**
 * Determine overall system status
 */
function determineOverallStatus(checkResults) {
  const statuses = checkResults.map((check) => check?.status || "UNKNOWN");

  if (statuses.includes("CRITICAL")) return "CRITICAL";
  if (statuses.includes("WARNING")) return "WARNING";
  if (statuses.every((status) => status === "HEALTHY")) return "HEALTHY";
  return "UNKNOWN";
}

/**
 * Generate system recommendations
 */
function generateRecommendations(healthChecks) {
  const recommendations = [];

  healthChecks.forEach((check, index) => {
    if (!check) return;

    switch (index) {
      case 0: // Database
        if (check.status === "CRITICAL") {
          recommendations.push({
            priority: "HIGH",
            category: "Database",
            issue: "Database connection failed",
            action: "Check database server status and connectivity",
          });
        }
        break;
      case 1: // Cache
        if (check.performance === "Needs Optimization") {
          recommendations.push({
            priority: "MEDIUM",
            category: "Cache",
            issue: "Cache size is large",
            action: "Consider implementing cache eviction policies",
          });
        }
        break;
      case 2: // Performance
        if (check.systemStatus === "WARNING") {
          recommendations.push({
            priority: "MEDIUM",
            category: "Performance",
            issue: "High error rate detected",
            action: "Review error logs and implement better error handling",
          });
        }
        break;
    }
  });

  return recommendations;
}

/**
 * Handle system health check
 */
async function handleSystemHealthCheck(env) {
  const healthCheck = await checkDatabaseHealth(env.DB);

  return createSuccessResponse({
    status: healthCheck.status,
    timestamp: new Date().toISOString(),
    database: healthCheck,
    uptime: process.uptime?.() || "Unknown",
  });
}

/**
 * Handle performance report
 */
async function handlePerformanceReport(env) {
  const performanceMonitor = new PerformanceMonitor();
  const report = performanceMonitor.generatePerformanceReport();

  return createSuccessResponse(report);
}

/**
 * Handle cache statistics
 */
async function handleCacheStats(env) {
  const stats = cacheManager.getStats();

  return createSuccessResponse({
    timestamp: new Date().toISOString(),
    cache: stats,
  });
}

/**
 * Handle database health check
 */
async function handleDatabaseHealthCheck(env) {
  const healthCheck = await checkDatabaseHealth(env.DB);

  return createSuccessResponse(healthCheck);
}

// Export performance monitor singleton
export const performanceMonitor = new PerformanceMonitor();

// Export performance monitoring middleware
export function performanceMiddleware(operationName) {
  return async (req, res, next) => {
    const startTime = Date.now();

    try {
      await next();
      const duration = Date.now() - startTime;
      performanceMonitor.recordRequest(
        req.url,
        req.method,
        duration,
        res.status || 200,
        req.cacheHit || false
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordRequest(
        req.url,
        req.method,
        duration,
        500,
        req.cacheHit || false
      );
      throw error;
    }
  };
}

// Export health check helpers
export async function performHealthCheck(env) {
  return await handleComprehensiveHealthCheck(env);
}

export function recordApiMetrics(
  endpoint,
  method,
  duration,
  statusCode,
  cacheHit = false
) {
  performanceMonitor.recordRequest(
    endpoint,
    method,
    duration,
    statusCode,
    cacheHit
  );
}
