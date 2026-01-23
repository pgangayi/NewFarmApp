// Performance monitoring API endpoint
// Provides real-time performance metrics and alerts

import { performanceMonitor } from "./_performance.js";
import { DatabaseOperations } from "./_database.js";

/**
 * Performance monitoring API handler
 */
export async function onRequest(request, env) {
  try {
    const url = new URL(request.url);
    const method = request.method;

    // Only allow GET requests
    if (method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dbOps = new DatabaseOperations(env);

    // Get performance stats
    const stats = performanceMonitor.getStats();

    // Get active alerts
    const activeAlerts = performanceMonitor.getActiveAlerts();

    // Get recent slow queries from database metrics
    const dbMetrics = dbOps.getMetrics();

    // Get slow queries from performance monitor
    const recentSlowQueries = performanceMonitor.metrics.queryExecutionTimes
      .slice(-10) // Last 10 slow queries
      .map(q => ({
        query: q.query,
        executionTime: q.executionTime,
        table: q.table,
        operation: q.operation,
        timestamp: q.timestamp
      }));

    const response = {
      timestamp: new Date().toISOString(),
      performance: {
        ...stats,
        database: dbMetrics,
      },
      alerts: {
        active: activeAlerts,
        totalTriggered: stats.alertsTriggered,
      },
      slowQueries: recentSlowQueries,
      thresholds: performanceMonitor.alertThresholds,
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Performance API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
