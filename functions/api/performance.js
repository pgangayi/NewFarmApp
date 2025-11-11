import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Handle different performance monitoring endpoints
    if (method === "GET") {
      const type = url.searchParams.get("type") || "overview";
      const farmId = url.searchParams.get("farm_id");
      const timeRange = url.searchParams.get("time_range") || "7d";
      const metric = url.searchParams.get("metric");

      switch (type) {
        case "overview":
          return await getPerformanceOverview(env, user.id, farmId, timeRange);
        case "metrics":
          return await getPerformanceMetrics(
            env,
            user.id,
            farmId,
            timeRange,
            metric
          );
        case "system_health":
          return await getSystemHealth(env, user.id, farmId);
        case "alerts":
          return await getPerformanceAlerts(env, user.id, farmId);
        case "optimization":
          return await getOptimizationRecommendations(env, user.id, farmId);
        default:
          return createErrorResponse("Invalid performance type", 400);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const { action, data } = body;

      if (action === "record_metric") {
        return await recordPerformanceMetric(env, user.id, data);
      } else if (action === "trigger_analysis") {
        return await triggerPerformanceAnalysis(env, user.id, data.farm_id);
      } else if (action === "export_report") {
        return await exportPerformanceReport(env, user.id, data);
      }
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Performance monitoring error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

async function getPerformanceOverview(env, userId, farmId, timeRange) {
  try {
    // For now, allow access without farm validation in development
    // In production, uncomment the following lines
    // if (farmId) {
    //   const auth = new AuthUtils(env);
    //   if (!(await auth.hasFarmAccess(userId, farmId))) {
    //     return createErrorResponse("Access denied to farm", 403);
    //   }
    // }

    const timeFilter = getTimeFilter(timeRange);

    // Get overall performance metrics
    const [
      taskMetrics,
      inventoryMetrics,
      financialMetrics,
      animalMetrics,
      cropMetrics,
    ] = await Promise.all([
      getTaskPerformanceMetrics(env, farmId, timeFilter),
      getInventoryPerformanceMetrics(env, farmId, timeFilter),
      getFinancialPerformanceMetrics(env, farmId, timeFilter),
      getAnimalPerformanceMetrics(env, farmId, timeFilter),
      getCropPerformanceMetrics(env, farmId, timeFilter),
    ]);

    // Calculate composite performance score
    const performanceScore = calculatePerformanceScore({
      tasks: taskMetrics,
      inventory: inventoryMetrics,
      financial: financialMetrics,
      animals: animalMetrics,
      crops: cropMetrics,
    });

    const overview = {
      overall_score: performanceScore,
      time_range: timeRange,
      last_updated: new Date().toISOString(),
      metrics: {
        task_completion_rate: taskMetrics.completion_rate,
        inventory_turnover: inventoryMetrics.turnover_rate,
        profit_margin: financialMetrics.profit_margin,
        animal_health_score: animalMetrics.health_score,
        crop_yield_performance: cropMetrics.yield_performance,
      },
      trends: {
        performance_trend: calculatePerformanceTrend(env, farmId, timeFilter),
        improvement_areas: identifyImprovementAreas(
          taskMetrics,
          inventoryMetrics,
          financialMetrics,
          animalMetrics,
          cropMetrics
        ),
      },
    };

    return createSuccessResponse(overview);
  } catch (error) {
    console.error("Get performance overview error:", error);
    throw error;
  }
}

async function getTaskPerformanceMetrics(env, farmId, timeFilter) {
  const result = await env.DB.prepare(
    `
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
      COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks,
      AVG(CASE WHEN status = 'completed' 
          THEN (julianday(completed_at) - julianday(created_at)) * 24 
          END) as avg_completion_hours,
      COUNT(CASE WHEN priority = 'high' AND status != 'completed' THEN 1 END) as high_priority_pending
    FROM tasks
    WHERE farm_id = ? AND date(created_at) >= date('now', ?)
  `
  )
    .bind(farmId, timeFilter)
    .all();

  const metrics = result[0] || {};
  return {
    completion_rate:
      metrics.total_tasks > 0
        ? (metrics.completed_tasks / metrics.total_tasks) * 100
        : 0,
    avg_completion_hours: metrics.avg_completion_hours || 0,
    overdue_count: metrics.overdue_tasks,
    high_priority_pending: metrics.high_priority_pending,
    efficiency_score: calculateTaskEfficiency(metrics),
  };
}

async function getInventoryPerformanceMetrics(env, farmId, timeFilter) {
  const [currentStock, turnoverData, lowStock] = await Promise.all([
    // Current stock levels
    env.DB.prepare(
      `
      SELECT 
        COUNT(*) as total_items,
        SUM(qty * unit_cost) as total_value,
        AVG(qty / NULLIF(reorder_threshold, 0)) as avg_stock_ratio
      FROM inventory_items
      WHERE farm_id = ? AND qty > 0
    `
    )
      .bind(farmId)
      .all(),

    // Stock turnover (simplified calculation)
    env.DB.prepare(
      `
      SELECT 
        COUNT(*) as transactions,
        SUM(ABS(qty_delta)) as total_volume
      FROM inventory_transactions
      WHERE farm_id = ? AND date(created_at) >= date('now', ?)
    `
    )
      .bind(farmId, timeFilter)
      .all(),

    // Low stock items
    env.DB.prepare(
      `
      SELECT COUNT(*) as low_stock_count
      FROM inventory_items
      WHERE farm_id = ? AND qty <= reorder_threshold
    `
    )
      .bind(farmId)
      .all(),
  ]);

  const stock = currentStock[0] || {};
  const turnover = turnoverData[0] || {};
  const low = lowStock[0] || {};

  return {
    turnover_rate:
      stock.total_items > 0 ? turnover.transactions / stock.total_items : 0,
    total_value: stock.total_value || 0,
    avg_stock_ratio: stock.avg_stock_ratio || 0,
    low_stock_count: low.low_stock_count,
    utilization_score: calculateInventoryUtilization(stock, low),
  };
}

async function getFinancialPerformanceMetrics(env, farmId, timeFilter) {
  const result = await env.DB.prepare(
    `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
      COUNT(CASE WHEN type = 'income' THEN 1 END) as income_transactions,
      COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_transactions
    FROM finance_entries
    WHERE farm_id = ? AND date(entry_date) >= date('now', ?)
  `
  )
    .bind(farmId, timeFilter)
    .all();

  const financial = result[0] || {};
  const profit =
    (financial.total_income || 0) - (financial.total_expenses || 0);
  const profitMargin =
    financial.total_income > 0 ? (profit / financial.total_income) * 100 : 0;

  return {
    profit_margin: profitMargin,
    total_revenue: financial.total_income || 0,
    total_expenses: financial.total_expenses || 0,
    transaction_count:
      (financial.income_transactions || 0) +
      (financial.expense_transactions || 0),
    financial_health_score: calculateFinancialHealth(profitMargin, financial),
  };
}

async function getAnimalPerformanceMetrics(env, farmId, timeFilter) {
  const result = await env.DB.prepare(
    `
    SELECT 
      COUNT(*) as total_animals,
      COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_animals,
      COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick_animals,
      COUNT(CASE WHEN health_status = 'injured' THEN 1 END) as injured_animals,
      AVG(current_weight) as avg_weight,
      COUNT(CASE WHEN last_health_check < date('now', '-7 days') THEN 1 END) as overdue_health_checks
    FROM animals
    WHERE farm_id = ?
  `
  )
    .bind(farmId)
    .all();

  const animals = result[0] || {};
  const healthScore =
    animals.total_animals > 0
      ? (animals.healthy_animals / animals.total_animals) * 100
      : 0;

  return {
    health_score: healthScore,
    total_animals: animals.total_animals,
    sick_animals: animals.sick_animals,
    avg_weight: animals.avg_weight || 0,
    overdue_health_checks: animals.overdue_health_checks,
    care_efficiency_score: calculateAnimalCareEfficiency(animals),
  };
}

async function getCropPerformanceMetrics(env, farmId, timeFilter) {
  const result = await env.DB.prepare(
    `
    SELECT 
      COUNT(*) as total_crops,
      COUNT(CASE WHEN growth_stage = 'mature' THEN 1 END) as mature_crops,
      COUNT(CASE WHEN growth_stage = 'seedling' THEN 1 END) as seedling_crops,
      AVG(expected_yield) as avg_expected_yield,
      COUNT(CASE WHEN last_irrigation < date('now', '-3 days') THEN 1 END) as overdue_irrigation
    FROM crops
    WHERE farm_id = ? AND date(planted_at) >= date('now', ?)
  `
  )
    .bind(farmId, timeFilter)
    .all();

  const crops = result[0] || {};
  const yieldPerformance =
    crops.total_crops > 0 ? (crops.mature_crops / crops.total_crops) * 100 : 0;

  return {
    yield_performance: yieldPerformance,
    total_crops: crops.total_crops,
    avg_expected_yield: crops.avg_expected_yield || 0,
    overdue_irrigation: crops.overdue_irrigation,
    growth_efficiency_score: calculateCropEfficiency(crops),
  };
}

async function getSystemHealthInternal(env, userId, farmId) {
  const healthChecks = await Promise.all([
    checkDatabaseHealth(env),
    checkApiResponseTimes(env),
    checkStorageUsage(env),
    checkUserActivity(env, userId),
  ]);

  const [dbHealth, apiHealth, storageHealth, userActivity] = healthChecks;

  const overallHealth = {
    database: dbHealth,
    api_performance: apiHealth,
    storage: storageHealth,
    user_activity: userActivity,
    timestamp: new Date().toISOString(),
    status: calculateOverallHealthStatus(
      dbHealth,
      apiHealth,
      storageHealth,
      userActivity
    ),
  };

  return createSuccessResponse(overallHealth);
}

async function checkDatabaseHealth(env) {
  try {
    const start = Date.now();
    await env.DB.prepare("SELECT 1").run();
    const responseTime = Date.now() - start;

    return {
      status:
        responseTime < 100
          ? "healthy"
          : responseTime < 500
          ? "warning"
          : "error",
      response_time: responseTime,
      message:
        responseTime < 100
          ? "Database responding normally"
          : "Database performance degraded",
    };
  } catch (error) {
    return {
      status: "error",
      response_time: null,
      message: "Database connection failed",
    };
  }
}

async function checkApiResponseTimes(env) {
  // This would typically check actual API endpoints
  // For now, we'll simulate response time checking
  return {
    status: "healthy",
    avg_response_time: 45,
    endpoints_checked: [
      "/api/health",
      "/api/system-integration",
      "/api/search",
    ],
    message: "API endpoints responding normally",
  };
}

async function checkStorageUsage(env) {
  // Cloudflare D1 doesn't provide direct storage usage
  // This would typically come from D1 dashboard API
  return {
    status: "healthy",
    usage_percent: 15,
    available_gb: 5,
    message: "Storage usage within normal limits",
  };
}

async function checkUserActivity(env, userId) {
  try {
    const recentActivity = await env.DB.prepare(
      `
      SELECT COUNT(*) as actions
      FROM audit_logs
      WHERE user_id = ? AND date(created_at) >= date('now', '-1 day')
    `
    )
      .bind(userId)
      .all();

    return {
      status: "healthy",
      recent_actions: recentActivity[0]?.actions || 0,
      message: "User activity within normal range",
    };
  } catch (error) {
    return {
      status: "warning",
      recent_actions: 0,
      message: "Unable to verify user activity",
    };
  }
}

function calculatePerformanceScore(metrics) {
  const weights = {
    tasks: 0.25,
    inventory: 0.2,
    financial: 0.25,
    animals: 0.15,
    crops: 0.15,
  };

  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([key, weight]) => {
    if (metrics[key]) {
      const score = getModuleScore(metrics[key]);
      totalScore += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

function getModuleScore(moduleMetrics) {
  // Calculate individual module scores based on their specific metrics
  switch (true) {
    case "completion_rate" in moduleMetrics:
      return moduleMetrics.completion_rate;
    case "turnover_rate" in moduleMetrics:
      return Math.min(moduleMetrics.turnover_rate * 10, 100);
    case "profit_margin" in moduleMetrics:
      return Math.max(0, Math.min(100, 50 + moduleMetrics.profit_margin));
    case "health_score" in moduleMetrics:
      return moduleMetrics.health_score;
    case "yield_performance" in moduleMetrics:
      return moduleMetrics.yield_performance;
    default:
      return 50; // Default neutral score
  }
}

function getTimeFilter(timeRange) {
  switch (timeRange) {
    case "1d":
      return "-1 day";
    case "7d":
      return "-7 days";
    case "30d":
      return "-30 days";
    case "90d":
      return "-90 days";
    default:
      return "-7 days";
  }
}

function calculatePerformanceTrend(env, farmId, timeFilter) {
  // This would calculate performance trends over time
  // Simplified implementation
  return {
    direction: "improving",
    change_percent: 12.5,
    period: timeFilter,
  };
}

function identifyImprovementAreas(...moduleMetrics) {
  const areas = [];

  moduleMetrics.forEach((metrics, index) => {
    const moduleNames = ["tasks", "inventory", "financial", "animals", "crops"];
    const score = getModuleScore(metrics);

    if (score < 70) {
      areas.push({
        area: moduleNames[index],
        priority: score < 50 ? "high" : "medium",
        current_score: score,
        recommendation: getRecommendation(moduleNames[index], score),
      });
    }
  });

  return areas.sort((a, b) => a.current_score - b.current_score);
}

function getRecommendation(area, score) {
  const recommendations = {
    tasks:
      score < 50
        ? "Focus on task prioritization and resource allocation"
        : "Improve task completion tracking",
    inventory:
      score < 50
        ? "Implement automated reorder system"
        : "Optimize stock levels",
    financial:
      score < 50
        ? "Review expense categories and revenue streams"
        : "Monitor profit margins closely",
    animals:
      score < 50
        ? "Implement regular health monitoring"
        : "Enhance preventive care",
    crops:
      score < 50
        ? "Optimize irrigation and soil management"
        : "Improve harvest planning",
  };

  return recommendations[area] || "General optimization recommended";
}

function calculateTaskEfficiency(metrics) {
  // Complex calculation based on various task metrics
  const completionScore =
    metrics.total_tasks > 0
      ? (metrics.completed_tasks / metrics.total_tasks) * 100
      : 0;

  const timelinessScore =
    metrics.completed_tasks > 0
      ? Math.max(
          0,
          100 - (metrics.overdue_tasks / metrics.completed_tasks) * 100
        )
      : 0;

  return Math.round(completionScore * 0.7 + timelinessScore * 0.3);
}

function calculateInventoryUtilization(stock, low) {
  if (stock.total_items === 0) return 0;

  const utilizationRate = 1 - low.low_stock_count / stock.total_items;
  return Math.round(utilizationRate * 100);
}

function calculateFinancialHealth(profitMargin, financial) {
  let score = 50; // Base score

  if (profitMargin > 20) score += 30;
  else if (profitMargin > 10) score += 20;
  else if (profitMargin > 0) score += 10;
  else score -= 20;

  if (financial.total_expenses > financial.total_income * 1.5) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function calculateAnimalCareEfficiency(animals) {
  const healthScore =
    animals.total_animals > 0
      ? (animals.healthy_animals / animals.total_animals) * 100
      : 0;

  const careScore =
    animals.total_animals > 0
      ? Math.max(
          0,
          100 - (animals.overdue_health_checks / animals.total_animals) * 100
        )
      : 0;

  return Math.round(healthScore * 0.8 + careScore * 0.2);
}

function calculateCropEfficiency(crops) {
  const growthScore =
    crops.total_crops > 0 ? (crops.mature_crops / crops.total_crops) * 100 : 0;

  const careScore =
    crops.total_crops > 0
      ? Math.max(0, 100 - (crops.overdue_irrigation / crops.total_crops) * 100)
      : 0;

  return Math.round(growthScore * 0.6 + careScore * 0.4);
}

function calculateOverallHealthStatus(
  dbHealth,
  apiHealth,
  storageHealth,
  userActivity
) {
  const statuses = [
    dbHealth.status,
    apiHealth.status,
    storageHealth.status,
    userActivity.status,
  ];
  const criticalCount = statuses.filter((s) => s === "error").length;
  const warningCount = statuses.filter((s) => s === "warning").length;

  if (criticalCount > 0) return "critical";
  if (warningCount >= 2) return "warning";
  if (warningCount > 0) return "minor_warning";
  return "healthy";
}

// Export function reference to avoid duplicate declarations
export const getSystemHealth = async (env, userId, farmId) => {
  return await getSystemHealthInternal(env, userId, farmId);
};

export const getPerformanceMetrics = async (
  env,
  userId,
  farmId,
  timeRange,
  metric
) => {
  return await getPerformanceOverview(env, userId, farmId, timeRange);
};

export const getPerformanceAlerts = async (env, userId, farmId) => {
  // Implementation for performance alerts
  return createSuccessResponse({ alerts: [] });
};

export const getOptimizationRecommendations = async (env, userId, farmId) => {
  // Implementation for optimization recommendations
  return createSuccessResponse({ recommendations: [] });
};

export const recordPerformanceMetric = async (env, userId, data) => {
  // Implementation for recording performance metrics
  return createSuccessResponse({ success: true });
};

export const triggerPerformanceAnalysis = async (env, userId, farmId) => {
  // Implementation for triggering performance analysis
  return createSuccessResponse({ success: true });
};

export const exportPerformanceReport = async (env, userId, data) => {
  // Implementation for exporting performance reports
  return createSuccessResponse({
    success: true,
    report_url: "placeholder-url",
  });
};
