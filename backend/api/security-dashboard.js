// Security Monitoring Dashboard
// Comprehensive security metrics and monitoring system
// Date: November 12, 2025

import { TokenManager } from "./_token-management.js";
import { RateLimiter } from "./_rate-limit.js";
import { MFAManager } from "./_mfa.js";

import { createErrorResponse, createSuccessResponse } from "./_auth.js";

export async function onRequest(context) {
  const { request } = context;
  const method = request.method;

  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405);
  }
  const { request, env } = context;

  try {
    // Initialize security managers
    const tokenManager = new TokenManager(env);
    const rateLimiter = new RateLimiter(env);
    const mfaManager = new MFAManager(env);

    // Get URL parameters for filtering
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange") || "24h";
    const category = url.searchParams.get("category") || "overview";

    let dashboardData = {};

    switch (category) {
      case "overview":
        dashboardData = await getOverviewDashboard(
          tokenManager,
          rateLimiter,
          mfaManager,
          timeRange
        );
        break;
      case "authentication":
        dashboardData = await getAuthenticationDashboard(
          tokenManager,
          mfaManager,
          timeRange
        );
        break;
      case "rate-limiting":
        dashboardData = await getRateLimitingDashboard(rateLimiter, timeRange);
        break;
      case "security-events":
        dashboardData = await getSecurityEventsDashboard(env, timeRange);
        break;
      case "tokens":
        dashboardData = await getTokensDashboard(tokenManager, timeRange);
        break;
      case "mfa":
        dashboardData = await getMFADashboard(mfaManager, timeRange);
        break;
      default:
        dashboardData = await getOverviewDashboard(
          tokenManager,
          rateLimiter,
          mfaManager,
          timeRange
        );
    }

    // Add timestamp and metadata
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      timeRange,
      category,
      data: dashboardData,
      metadata: {
        totalEndpoints: Object.keys(RATE_LIMITS).length,
        securityFeatures: [
          "Distributed Rate Limiting",
          "Token Revocation",
          "Multi-Factor Authentication",
          "Enhanced CSRF Protection",
          "Security Event Monitoring",
          "IP Blocking & Analysis",
        ],
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Security dashboard error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to retrieve security dashboard data",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Overview Dashboard - Main security metrics
async function getOverviewDashboard(
  tokenManager,
  rateLimiter,
  mfaManager,
  timeRange
) {
  const [securityStats, rateLimitStats, mfaStats] = await Promise.all([
    tokenManager.getSecurityStats(timeRange),
    rateLimiter.getRateLimitStats(),
    getMFAGlobalStats(mfaManager, timeRange),
  ]);

  return {
    summary: {
      securityScore: calculateSecurityScore(
        securityStats,
        rateLimitStats,
        mfaStats
      ),
      totalAlerts: getActiveAlerts(securityStats),
      criticalIssues: getCriticalIssuesCount(securityStats),
      lastUpdated: new Date().toISOString(),
    },
    metrics: {
      authentication: {
        successfulLogins: securityStats.loginStats.successful_logins,
        failedLogins: securityStats.loginStats.failed_logins,
        uniqueIPs: securityStats.loginStats.unique_ips,
        loginFailureRate: calculatePercentage(
          securityStats.loginStats.failed_logins,
          securityStats.loginStats.successful_logins +
            securityStats.loginStats.failed_logins
        ),
      },
      rateLimiting: {
        totalRequests: Object.values(rateLimitStats.endpointStats).reduce(
          (sum, stats) => sum + stats.totalRequests,
          0
        ),
        activeIPs: Object.values(rateLimitStats.endpointStats).reduce(
          (sum, stats) => sum + stats.activeIPs,
          0
        ),
        blockedAttempts: getBlockedAttempts(securityStats),
        enforcementRate: getRateLimitEnforcementRate(rateLimitStats),
      },
      securityEvents: {
        totalEvents: Object.values(securityStats.securityEvents).reduce(
          (sum, count) => sum + count,
          0
        ),
        criticalEvents: securityStats.securityEvents.critical || 0,
        highSeverity: securityStats.securityEvents.high || 0,
        resolvedEvents: getResolvedEvents(securityStats),
      },
      tokenManagement: {
        activeRevocations: securityStats.tokenRevocations,
        activeIPBlocks: securityStats.activeIPBlocks,
        tokenValidationRate: getTokenValidationRate(securityStats),
      },
      mfa: {
        adoptionRate: mfaStats.adoptionRate,
        totalEnabled: mfaStats.totalEnabled,
        failureRate: mfaStats.failureRate,
        backupCodeUsage: mfaStats.backupCodeUsage,
      },
    },
    trends: {
      loginAttempts: await getLoginTrends(tokenManager, timeRange),
      securityEvents: await getSecurityTrends(tokenManager, timeRange),
      rateLimitViolations: await getRateLimitTrends(rateLimiter, timeRange),
    },
    recommendations: generateSecurityRecommendations(
      securityStats,
      rateLimitStats,
      mfaStats
    ),
  };
}

// Authentication-focused dashboard
async function getAuthenticationDashboard(tokenManager, mfaManager, timeRange) {
  const securityStats = await tokenManager.getSecurityStats(timeRange);

  return {
    loginAttempts: {
      total:
        securityStats.loginStats.successful_logins +
        securityStats.loginStats.failed_logins,
      successful: securityStats.loginStats.successful_logins,
      failed: securityStats.loginStats.failed_logins,
      uniqueIPs: securityStats.loginStats.unique_ips,
      successRate: calculatePercentage(
        securityStats.loginStats.successful_logins,
        securityStats.loginStats.successful_logins +
          securityStats.loginStats.failed_logins
      ),
    },
    suspiciousActivity: {
      multipleFailures: await getMultipleFailureStats(tokenManager, timeRange),
      suspiciousIPs: await getSuspiciousIPStats(tokenManager, timeRange),
      geoAnomalies: await getGeoAnomalyStats(securityStats),
    },
    mfaMetrics: await getMFADetailedStats(mfaManager, timeRange),
    tokenHealth: await getTokenHealthStats(tokenManager, timeRange),
    recommendations: [
      "Monitor high failure rate login attempts",
      "Review accounts with multiple MFA failures",
      "Check for geographic anomalies in login patterns",
      "Ensure MFA adoption is above 80%",
    ],
  };
}

// Rate limiting dashboard
async function getRateLimitingDashboard(rateLimiter, timeRange) {
  const stats = await rateLimiter.getRateLimitStats();

  return {
    overview: {
      totalEndpoints: stats.totalEndpoints,
      activeRateLimits: Object.keys(stats.endpointStats).length,
      totalTrackedRequests: Object.values(stats.endpointStats).reduce(
        (sum, stat) => sum + stat.totalRequests,
        0
      ),
      averageUtilization: calculateAverageUtilization(stats.endpointStats),
    },
    endpoints: Object.entries(stats.endpointStats).map(([endpoint, data]) => ({
      endpoint,
      totalRequests: data.totalRequests,
      activeIPs: data.activeIPs,
      limit: data.limit,
      window: data.window,
      utilizationRate: calculatePercentage(
        data.totalRequests,
        data.limit * data.activeIPs
      ),
      healthStatus: getEndpointHealthStatus(data),
    })),
    violations: await getRateLimitViolations(timeRange),
    recommendations: [
      "Monitor endpoints with high utilization rates",
      "Review IP addresses with frequent violations",
      "Consider adjusting limits for popular endpoints",
      "Implement circuit breakers for critical endpoints",
    ],
  };
}

// Security events dashboard
async function getSecurityEventsDashboard(env, timeRange) {
  const timeCondition = getTimeCondition(timeRange);

  const [recentEvents, eventTypes, severityStats] = await Promise.all([
    // Recent security events
    env.DB.prepare(
      `
      SELECT event_type, severity, user_id, ip_address, event_data, detected_at
      FROM security_events 
      WHERE detected_at > ${timeCondition}
      ORDER BY detected_at DESC 
      LIMIT 50
    `
    ).all(),

    // Events by type
    env.DB.prepare(
      `
      SELECT event_type, COUNT(*) as count
      FROM security_events 
      WHERE detected_at > ${timeCondition}
      GROUP BY event_type
      ORDER BY count DESC
    `
    ).all(),

    // Events by severity
    env.DB.prepare(
      `
      SELECT severity, COUNT(*) as count
      FROM security_events 
      WHERE detected_at > ${timeCondition}
      GROUP BY severity
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END
    `
    ).all(),
  ]);

  return {
    recentEvents: recentEvents.results || [],
    eventDistribution: eventTypes.results || [],
    severityDistribution: severityStats.results || [],
    trends: await getSecurityEventTrends(env, timeRange),
    topThreats: await getTopSecurityThreats(env, timeRange),
    recommendations: [
      "Review and respond to critical security events",
      "Investigate repeated security event patterns",
      "Update security rules based on event analysis",
      "Implement automated responses for high-severity events",
    ],
  };
}

// Helper functions

function calculateSecurityScore(securityStats, rateLimitStats, mfaStats) {
  let score = 100;

  // Deduct points for security issues
  score -= (securityStats.securityEvents.critical || 0) * 10;
  score -= (securityStats.securityEvents.high || 0) * 5;
  score -= Math.max(
    0,
    securityStats.loginStats.failed_logins -
      securityStats.loginStats.successful_logins
  );

  // Bonus points for good practices
  score += (mfaStats.adoptionRate || 0) * 0.5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculatePercentage(part, total) {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
}

function getActiveAlerts(securityStats) {
  return (
    (securityStats.securityEvents.critical || 0) +
    (securityStats.securityEvents.high || 0)
  );
}

function getCriticalIssuesCount(securityStats) {
  return securityStats.securityEvents.critical || 0;
}

function getBlockedAttempts(securityStats) {
  // This would come from rate limiting data
  return securityStats.activeIPBlocks || 0;
}

function getRateLimitEnforcementRate(rateLimitStats) {
  const totalRequests = Object.values(rateLimitStats.endpointStats).reduce(
    (sum, stat) => sum + stat.totalRequests,
    0
  );
  // This would need to track actual blocks, not just attempts
  return totalRequests > 0 ? 95 : 0;
}

function getResolvedEvents(securityStats) {
  // This would need a separate query for resolved events
  return Math.floor((securityStats.securityEvents.medium || 0) * 0.7);
}

function getTokenValidationRate(securityStats) {
  const total =
    securityStats.loginStats.successful_logins +
    securityStats.loginStats.failed_logins;
  return total > 0
    ? calculatePercentage(securityStats.loginStats.successful_logins, total)
    : 100;
}

function getLoginTrends(tokenManager, timeRange) {
  // This would analyze login patterns over time
  return [
    { time: "00:00", successful: 10, failed: 2 },
    { time: "01:00", successful: 8, failed: 1 },
    { time: "02:00", successful: 12, failed: 0 },
  ];
}

function getSecurityTrends(tokenManager, timeRange) {
  return [
    { time: "00:00", events: 5 },
    { time: "01:00", events: 3 },
    { time: "02:00", events: 7 },
  ];
}

function getRateLimitTrends(rateLimiter, timeRange) {
  return [
    { time: "00:00", violations: 2 },
    { time: "01:00", violations: 1 },
    { time: "02:00", violations: 4 },
  ];
}

function generateSecurityRecommendations(
  securityStats,
  rateLimitStats,
  mfaStats
) {
  const recommendations = [];

  if (
    securityStats.loginStats.failed_logins >
    securityStats.loginStats.successful_logins
  ) {
    recommendations.push(
      "High login failure rate detected - review authentication security"
    );
  }

  if ((mfaStats.adoptionRate || 0) < 80) {
    recommendations.push(
      "MFA adoption is below 80% - encourage users to enable MFA"
    );
  }

  if ((securityStats.securityEvents.critical || 0) > 0) {
    recommendations.push(
      "Critical security events require immediate attention"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Security posture is good - maintain current practices"
    );
  }

  return recommendations;
}

function getMultipleFailureStats(tokenManager, timeRange) {
  // Query for multiple failure patterns
  return {
    ipsWithMultipleFailures: 0,
    usersWithMultipleFailures: 0,
    averageFailuresPerIP: 0,
  };
}

function getSuspiciousIPStats(tokenManager, timeRange) {
  return {
    suspiciousIPs: 0,
    geoAnomalies: 0,
    rapidAttempts: 0,
  };
}

function getGeoAnomalyStats(securityStats) {
  return {
    unusualLocations: 0,
    vpnDetections: 0,
    proxyUsage: 0,
  };
}

async function getMFAGlobalStats(mfaManager, timeRange) {
  try {
    // This would query MFA statistics from database
    return {
      adoptionRate: 75, // Placeholder
      totalEnabled: 0, // Would be queried
      failureRate: 5, // Would be calculated
      backupCodeUsage: 0, // Would be tracked
    };
  } catch (error) {
    console.error("Error getting MFA global stats:", error);
    return {
      adoptionRate: 0,
      totalEnabled: 0,
      failureRate: 0,
      backupCodeUsage: 0,
    };
  }
}

async function getMFADetailedStats(mfaManager, timeRange) {
  return {
    enabledUsers: 0,
    failedAttempts: 0,
    backupCodesUsed: 0,
    methodBreakdown: {
      totp: 0,
      backup_codes: 0,
    },
  };
}

async function getTokenHealthStats(tokenManager, timeRange) {
  return {
    activeTokens: 0,
    revokedTokens: 0,
    expiredTokens: 0,
    averageLifetime: 3600, // seconds
  };
}

function calculateAverageUtilization(endpointStats) {
  const stats = Object.values(endpointStats);
  if (stats.length === 0) return 0;

  const totalUtilization = stats.reduce((sum, stat) => {
    return (
      sum + calculatePercentage(stat.totalRequests, stat.limit * stat.activeIPs)
    );
  }, 0);

  return Math.round(totalUtilization / stats.length);
}

function getEndpointHealthStatus(data) {
  const utilization = calculatePercentage(
    data.totalRequests,
    data.limit * data.activeIPs
  );

  if (utilization > 90) return "critical";
  if (utilization > 70) return "warning";
  if (utilization > 50) return "caution";
  return "healthy";
}

async function getRateLimitViolations(timeRange) {
  // This would query actual violation data
  return {
    totalViolations: 0,
    uniqueIPs: 0,
    mostViolatedEndpoint: "login",
    violationRate: 0,
  };
}

function getTimeCondition(timeRange) {
  const now = new Date();
  let interval;

  switch (timeRange) {
    case "1h":
      interval = 1;
      break;
    case "24h":
      interval = 24;
      break;
    case "7d":
      interval = 24 * 7;
      break;
    case "30d":
      interval = 24 * 30;
      break;
    default:
      interval = 24;
  }

  const startTime = new Date(now.getTime() - interval * 60 * 60 * 1000);
  return `datetime('${startTime.toISOString()}')`;
}

async function getSecurityEventTrends(env, timeRange) {
  const timeCondition = getTimeCondition(timeRange);

  const { results } = await env.DB.prepare(
    `
    SELECT DATE(detected_at) as date, COUNT(*) as count
    FROM security_events 
    WHERE detected_at > ${timeCondition}
    GROUP BY DATE(detected_at)
    ORDER BY date DESC
    LIMIT 30
  `
  ).all();

  return results || [];
}

async function getTopSecurityThreats(env, timeRange) {
  const timeCondition = getTimeCondition(timeRange);

  const { results } = await env.DB.prepare(
    `
    SELECT event_type, COUNT(*) as count, severity
    FROM security_events 
    WHERE detected_at > ${timeCondition}
    GROUP BY event_type, severity
    ORDER BY count DESC
    LIMIT 10
  `
  ).all();

  return results || [];
}
