// Advanced Anomaly Detection System
// Machine learning-based threat detection and behavioral analysis
// Date: November 12, 2025

import crypto from "crypto";

export class AnomalyDetectionSystem {
  constructor(env) {
    this.env = env;
    this.riskThresholds = {
      loginAttempts: 5,
      failedLoginsPerHour: 10,
      newDeviceRiskScore: 0.7,
      unusualLocationRiskScore: 0.8,
      timeOfDayRiskScore: 0.6,
      ipReputationRiskScore: 0.9,
    };
  }

  // Analyze user behavior for anomalies
  async analyzeUserBehavior(userId, currentContext, historicalData = []) {
    try {
      const riskFactors = await this.calculateRiskFactors(
        userId,
        currentContext,
        historicalData
      );
      const anomalyScore = this.calculateAnomalyScore(riskFactors);
      const riskLevel = this.determineRiskLevel(anomalyScore);

      // Log analysis results
      await this.logAnomalyAnalysis(userId, {
        riskFactors,
        anomalyScore,
        riskLevel,
        currentContext,
      });

      return {
        riskScore: anomalyScore,
        riskLevel,
        riskFactors,
        requiresAction: riskLevel === "high" || riskLevel === "critical",
        recommendedActions: this.getRecommendedActions(riskLevel, riskFactors),
      };
    } catch (error) {
      console.error("Error analyzing user behavior:", error);
      return {
        riskScore: 0.5,
        riskLevel: "medium",
        error: "Analysis failed",
      };
    }
  }

  // Calculate individual risk factors
  async calculateRiskFactors(userId, context, historicalData) {
    const riskFactors = {
      loginPattern: await this.analyzeLoginPattern(userId, context),
      deviceAnomaly: await this.analyzeDeviceAnomaly(userId, context),
      locationAnomaly: await this.analyzeLocationAnomaly(userId, context),
      timeAnomaly: await this.analyzeTimeAnomaly(userId, context),
      ipAnomaly: await this.analyzeIPAnomaly(userId, context),
      behavioralAnomaly: await this.analyzeBehavioralAnomaly(
        userId,
        context,
        historicalData
      ),
    };

    return riskFactors;
  }

  // Analyze login patterns
  async analyzeLoginPattern(userId, context) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT 
          COUNT(*) as total_attempts,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_attempts,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_attempts,
          MAX(attempted_at) as last_attempt,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM login_attempts 
        WHERE user_id = ? AND attempted_at > datetime('now', '-1 hour')
      `
      )
        .bind(userId)
        .all();

      const stats = results[0] || { total_attempts: 0, failed_attempts: 0 };

      let riskScore = 0;
      const reasons = [];

      // Too many failed attempts
      if (stats.failed_attempts > this.riskThresholds.failedLoginsPerHour) {
        riskScore += 0.3;
        reasons.push(`Excessive failed attempts: ${stats.failed_attempts}`);
      }

      // Multiple IP addresses in short time
      if (stats.unique_ips > 3) {
        riskScore += 0.2;
        reasons.push(`Multiple IPs: ${stats.unique_ips} different IPs`);
      }

      // Brute force pattern
      if (stats.failed_attempts >= 5 && stats.successful_attempts === 0) {
        riskScore += 0.4;
        reasons.push("Brute force pattern detected");
      }

      return {
        riskScore: Math.min(riskScore, 1.0),
        details: {
          failedAttempts: stats.failed_attempts,
          uniqueIPs: stats.unique_ips,
        },
        reasons,
      };
    } catch (error) {
      console.error("Error analyzing login pattern:", error);
      return { riskScore: 0.0, reasons: ["Analysis error"] };
    }
  }

  // Analyze device anomalies
  async analyzeDeviceAnomaly(userId, context) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT device_fingerprint, COUNT(*) as login_count
        FROM enhanced_sessions 
        WHERE user_id = ? AND created_at > datetime('now', '-30 days')
        GROUP BY device_fingerprint
        ORDER BY login_count DESC
      `
      )
        .bind(userId)
        .all();

      const knownDevices = results || [];
      const currentDevice = context.deviceFingerprint;

      let riskScore = 0;
      const reasons = [];

      // Check if device is new
      const deviceKnown = knownDevices.some(
        (device) => device.device_fingerprint === currentDevice
      );
      if (!deviceKnown) {
        riskScore += this.riskThresholds.newDeviceRiskScore;
        reasons.push("Login from new device");
      }

      // Check device login frequency
      const deviceStats = knownDevices.find(
        (device) => device.device_fingerprint === currentDevice
      );
      if (deviceStats && deviceStats.login_count === 1) {
        riskScore += 0.2;
        reasons.push("Single login from device");
      }

      return {
        riskScore: Math.min(riskScore, 1.0),
        details: {
          deviceKnown,
          loginCount: deviceStats?.login_count || 0,
          totalKnownDevices: knownDevices.length,
        },
        reasons,
      };
    } catch (error) {
      console.error("Error analyzing device anomaly:", error);
      return { riskScore: 0.0, reasons: ["Analysis error"] };
    }
  }

  // Analyze location anomalies
  async analyzeLocationAnomaly(userId, context) {
    try {
      const { results } = await this.env.DB.prepare(
        `
        SELECT 
          country_code, 
          COUNT(*) as visits,
          MAX(last_activity) as last_visit
        FROM enhanced_sessions 
        WHERE user_id = ? AND country_code IS NOT NULL
          AND last_activity > datetime('now', '-90 days')
        GROUP BY country_code
        ORDER BY visits DESC
      `
      )
        .bind(userId)
        .all();

      const knownLocations = results || [];
      const currentLocation = context.location || {};

      let riskScore = 0;
      const reasons = [];

      // Check if country is new
      const locationKnown = knownLocations.some(
        (loc) => loc.country_code === currentLocation.country
      );
      if (!locationKnown && currentLocation.country) {
        riskScore += this.riskThresholds.unusualLocationRiskScore;
        reasons.push(`Login from new country: ${currentLocation.country}`);
      }

      // Check for rapid location changes
      const recentSessions = await this.env.DB.prepare(
        `
        SELECT country_code, last_activity
        FROM enhanced_sessions 
        WHERE user_id = ? 
          AND last_activity > datetime('now', '-2 hours')
        ORDER BY last_activity DESC
        LIMIT 5
      `
      )
        .bind(userId)
        .all();

      if (recentSessions.length > 1) {
        const countries = [
          ...new Set(recentSessions.map((s) => s.country_code)),
        ];
        if (countries.length > 2) {
          riskScore += 0.3;
          reasons.push("Multiple countries in short time");
        }
      }

      return {
        riskScore: Math.min(riskScore, 1.0),
        details: {
          currentLocation: currentLocation.country,
          knownLocations: knownLocations.length,
          recentCountryChanges: countries?.length || 0,
        },
        reasons,
      };
    } catch (error) {
      console.error("Error analyzing location anomaly:", error);
      return { riskScore: 0.0, reasons: ["Analysis error"] };
    }
  }

  // Analyze time-based anomalies
  async analyzeTimeAnomaly(userId, context) {
    try {
      const currentHour = new Date().getHours();
      const currentDay = new Date().getDay(); // 0 = Sunday

      const { results } = await this.env.DB.prepare(
        `
        SELECT 
          strftime('%H', created_at) as login_hour,
          strftime('%w', created_at) as login_day,
          COUNT(*) as frequency
        FROM enhanced_sessions 
        WHERE user_id = ? AND created_at > datetime('now', '-30 days')
        GROUP BY login_hour, login_day
      `
      )
        .bind(userId)
        .all();

      const typicalHours = new Set(results.map((r) => parseInt(r.login_hour)));
      const typicalDays = new Set(results.map((r) => parseInt(r.login_day)));

      let riskScore = 0;
      const reasons = [];

      // Check if current time is unusual
      if (!typicalHours.has(currentHour)) {
        riskScore += 0.1;
        reasons.push(`Unusual login hour: ${currentHour}:00`);
      }

      // Very late or early login
      if (currentHour < 6 || currentHour > 23) {
        riskScore += this.riskThresholds.timeOfDayRiskScore;
        reasons.push(`Unusual time: ${currentHour}:00`);
      }

      return {
        riskScore: Math.min(riskScore, 1.0),
        details: {
          currentHour,
          currentDay,
          typicalHours: Array.from(typicalHours),
          isUnusualTime: currentHour < 6 || currentHour > 23,
        },
        reasons,
      };
    } catch (error) {
      console.error("Error analyzing time anomaly:", error);
      return { riskScore: 0.0, reasons: ["Analysis error"] };
    }
  }

  // Analyze IP reputation and anomalies
  async analyzeIPAnomaly(userId, context) {
    try {
      const clientIP = context.clientIP;

      // Check against known IPs
      const { results } = await this.env.DB.prepare(
        `
        SELECT ip_address, COUNT(*) as frequency, MAX(last_activity) as last_seen
        FROM enhanced_sessions 
        WHERE user_id = ? 
          AND last_activity > datetime('now', '-90 days')
        GROUP BY ip_address
        ORDER BY frequency DESC
      `
      )
        .bind(userId)
        .all();

      const knownIPs = results || [];
      const ipKnown = knownIPs.some((ip) => ip.ip_address === clientIP);

      let riskScore = 0;
      const reasons = [];

      // New IP address
      if (!ipKnown) {
        riskScore += 0.2;
        reasons.push("Login from new IP address");
      }

      // Check IP reputation (simplified)
      const isSuspiciousIP = this.isSuspiciousIP(clientIP);
      if (isSuspiciousIP) {
        riskScore += this.riskThresholds.ipReputationRiskScore;
        reasons.push("Suspicious IP address");
      }

      // Check for rapid IP changes
      const recentIPs = await this.env.DB.prepare(
        `
        SELECT DISTINCT ip_address
        FROM enhanced_sessions 
        WHERE user_id = ? 
          AND last_activity > datetime('now', '-1 hour')
      `
      )
        .bind(userId)
        .all();

      if (recentIPs.length > 3) {
        riskScore += 0.3;
        reasons.push("Multiple IP addresses in short time");
      }

      return {
        riskScore: Math.min(riskScore, 1.0),
        details: {
          currentIP: clientIP,
          knownIPs: knownIPs.length,
          isKnownIP: ipKnown,
          recentIPChanges: recentIPs.length,
        },
        reasons,
      };
    } catch (error) {
      console.error("Error analyzing IP anomaly:", error);
      return { riskScore: 0.0, reasons: ["Analysis error"] };
    }
  }

  // Analyze behavioral patterns
  async analyzeBehavioralAnomaly(userId, context, historicalData) {
    try {
      // Get recent session patterns
      const { results } = await this.env.DB.prepare(
        `
        SELECT 
          strftime('%H', created_at) as hour,
          strftime('%w', created_at) as day,
          EXTRACT(EPOCH FROM (expires_at - created_at))/3600 as session_duration,
          user_agent
        FROM enhanced_sessions 
        WHERE user_id = ? 
          AND created_at > datetime('now', '-30 days')
        ORDER BY created_at DESC
        LIMIT 20
      `
      )
        .bind(userId)
        .all();

      const patterns = results || [];

      let riskScore = 0;
      const reasons = [];

      // Check for unusual session duration
      if (patterns.length > 0) {
        const avgDuration =
          patterns.reduce((sum, p) => sum + p.session_duration, 0) /
          patterns.length;
        const currentDuration = context.sessionDuration || avgDuration;

        if (Math.abs(currentDuration - avgDuration) > avgDuration * 0.5) {
          riskScore += 0.2;
          reasons.push(
            `Unusual session duration: ${currentDuration}h vs typical ${avgDuration}h`
          );
        }
      }

      // Check for pattern deviations
      if (patterns.length > 5) {
        const typicalHours = patterns.map((p) => parseInt(p.hour));
        const userAgentPattern = patterns.map((p) => p.user_agent).join("|");

        // Simple deviation detection
        const userAgentChanged = !userAgentPattern.includes(
          context.userAgent || ""
        );
        if (userAgentChanged && patterns.length > 10) {
          riskScore += 0.15;
          reasons.push("User agent pattern changed");
        }
      }

      return {
        riskScore: Math.min(riskScore, 1.0),
        details: {
          patternSampleSize: patterns.length,
          averageSessionDuration:
            patterns.length > 0
              ? patterns.reduce((sum, p) => sum + p.session_duration, 0) /
                patterns.length
              : 0,
        },
        reasons,
      };
    } catch (error) {
      console.error("Error analyzing behavioral anomaly:", error);
      return { riskScore: 0.0, reasons: ["Analysis error"] };
    }
  }

  // Calculate overall anomaly score
  calculateAnomalyScore(riskFactors) {
    const weights = {
      loginPattern: 0.25,
      deviceAnomaly: 0.2,
      locationAnomaly: 0.25,
      timeAnomaly: 0.1,
      ipAnomaly: 0.15,
      behavioralAnomaly: 0.05,
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const [factor, weight] of Object.entries(weights)) {
      if (riskFactors[factor]) {
        weightedScore += riskFactors[factor].riskScore * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  // Determine risk level based on score
  determineRiskLevel(score) {
    if (score >= 0.8) return "critical";
    if (score >= 0.6) return "high";
    if (score >= 0.4) return "medium";
    if (score >= 0.2) return "low";
    return "minimal";
  }

  // Get recommended actions based on risk level
  getRecommendedActions(riskLevel, riskFactors) {
    const actions = [];

    switch (riskLevel) {
      case "critical":
        actions.push("IMMEDIATE_SESSION_TERMINATION");
        actions.push("FORCE_PASSWORD_CHANGE");
        actions.push("REQUIRE_MFA_VERIFICATION");
        actions.push("NOTIFY_SECURITY_TEAM");
        break;

      case "high":
        actions.push("REQUIRE_MFA_VERIFICATION");
        actions.push("ENHANCED_MONITORING");
        actions.push("SEND_SECURITY_ALERT");
        break;

      case "medium":
        actions.push("ADDITIONAL_VERIFICATION");
        actions.push("INCREASED_LOGGING");
        break;

      case "low":
        actions.push("CONTINUE_MONITORING");
        break;
    }

    // Add specific actions based on risk factors
    if (riskFactors.locationAnomaly?.riskScore > 0.7) {
      actions.push("VERIFY_LOCATION");
    }
    if (riskFactors.deviceAnomaly?.riskScore > 0.7) {
      actions.push("VERIFY_DEVICE");
    }
    if (riskFactors.loginPattern?.riskScore > 0.7) {
      actions.push("INVESTIGATE_LOGIN_PATTERN");
    }

    return actions;
  }

  // Check if IP is suspicious (simplified)
  isSuspiciousIP(ip) {
    const suspiciousPatterns = [
      /^10\./, // Private networks
      /^192\.168\./, // Private networks
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private networks
      /^127\./, // Localhost
      /^0\./, // Invalid
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(ip));
  }

  // Log anomaly analysis results
  async logAnomalyAnalysis(userId, analysisResult) {
    try {
      const logId = `anomaly_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO anomaly_analysis_logs (
          id, user_id, risk_score, risk_level, risk_factors, 
          current_context, recommended_actions, analyzed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          logId,
          userId,
          analysisResult.riskScore,
          analysisResult.riskLevel,
          JSON.stringify(analysisResult.riskFactors),
          JSON.stringify(analysisResult.currentContext),
          JSON.stringify(analysisResult.recommendedActions)
        )
        .run();

      // If high risk, also log to security events
      if (
        analysisResult.riskLevel === "high" ||
        analysisResult.riskLevel === "critical"
      ) {
        await this.logSecurityEvent(
          "high_risk_anomaly_detected",
          userId,
          {},
          {
            riskScore: analysisResult.riskScore,
            riskLevel: analysisResult.riskLevel,
            primaryRiskFactors: Object.entries(analysisResult.riskFactors)
              .filter(([_, factor]) => factor.riskScore > 0.5)
              .map(([factor, _]) => factor),
          }
        );
      }
    } catch (error) {
      console.error("Error logging anomaly analysis:", error);
    }
  }

  // Log security events
  async logSecurityEvent(eventType, userId, requestContext, eventData = {}) {
    try {
      const eventId = `anomaly_${Date.now()}_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;

      await this.env.DB.prepare(
        `
        INSERT INTO security_events (
          id, event_type, severity, user_id, ip_address, user_agent, event_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          eventId,
          eventType,
          "high",
          userId,
          requestContext.ipAddress || "unknown",
          requestContext.userAgent || "unknown",
          JSON.stringify(eventData)
        )
        .run();
    } catch (error) {
      console.error("Error logging security event:", error);
    }
  }

  // Get anomaly statistics
  async getAnomalyStatistics(timeRange = "7d") {
    try {
      const timeCondition = this.getTimeCondition(timeRange);

      const { results } = await this.env.DB.prepare(
        `
        SELECT 
          risk_level,
          COUNT(*) as count,
          AVG(risk_score) as avg_risk_score
        FROM anomaly_analysis_logs 
        WHERE analyzed_at > ${timeCondition}
        GROUP BY risk_level
      `
      ).all();

      return {
        timeRange,
        riskLevelDistribution: results.reduce((acc, row) => {
          acc[row.risk_level] = {
            count: row.count,
            avgRiskScore: row.avg_risk_score,
          };
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("Error getting anomaly statistics:", error);
      return { error: "Failed to get statistics" };
    }
  }

  // Generate time condition for database queries
  getTimeCondition(timeRange) {
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
        interval = 24 * 7;
    }

    const startTime = new Date(now.getTime() - interval * 60 * 60 * 1000);
    return `datetime('${startTime.toISOString()}')`;
  }
}

// Export utility functions
export const AnomalyUtils = {
  // Real-time risk calculation on client side
  calculateClientRiskScore(context) {
    let score = 0;
    const factors = [];

    // Time-based risk
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      score += 0.1;
      factors.push("Unusual time");
    }

    // Device-based risk
    if (context.isNewDevice) {
      score += 0.2;
      factors.push("New device");
    }

    // Location-based risk
    if (context.isUnusualLocation) {
      score += 0.3;
      factors.push("Unusual location");
    }

    return { score: Math.min(score, 1.0), factors };
  },

  // Get risk level from score
  getRiskLevel(score) {
    if (score >= 0.8) return "critical";
    if (score >= 0.6) return "high";
    if (score >= 0.4) return "medium";
    if (score >= 0.2) return "low";
    return "minimal";
  },
};
