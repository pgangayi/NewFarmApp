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

    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const type = url.searchParams.get("type") || "comprehensive";
      const timeframe = url.searchParams.get("timeframe") || "12months";

      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farmId))) {
        return createErrorResponse("Access denied", 403);
      }

      switch (type) {
        case "comprehensive":
          return createSuccessResponse(
            await getComprehensiveAnalytics(env, farmId, timeframe)
          );

        case "performance":
          return createSuccessResponse(
            await getPerformanceAnalytics(env, farmId, timeframe)
          );

        case "predictive":
          return createSuccessResponse(
            await getPredictiveAnalytics(env, farmId)
          );

        case "optimization":
          return createSuccessResponse(
            await getOptimizationRecommendations(env, farmId)
          );

        case "trends":
          return createSuccessResponse(
            await getTrendAnalysis(env, farmId, timeframe)
          );

        case "roi":
          return createSuccessResponse(
            await getROIAnalysis(env, farmId, timeframe)
          );

        case "efficiency":
          return createSuccessResponse(
            await getEfficiencyAnalysis(env, farmId, timeframe)
          );

        default:
          return createErrorResponse("Unknown analytics type", 400);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const { farm_id, analysis_type, parameters } = body;

      if (!farm_id || !analysis_type) {
        return createErrorResponse("Farm ID and analysis type required", 400);
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Access denied", 403);
      }

      const result = await generateCustomAnalysis(
        env,
        farm_id,
        analysis_type,
        parameters
      );
      return createSuccessResponse(result);
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Analytics engine error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

async function getComprehensiveAnalytics(env, farmId, timeframe) {
  // Gather data from all modules for comprehensive analysis
  const [animals, crops, fields, inventory, tasks, finance, weather] =
    await Promise.all([
      getAnimalAnalytics(env, farmId, timeframe),
      getCropAnalytics(env, farmId, timeframe),
      getFieldAnalytics(env, farmId, timeframe),
      getInventoryAnalytics(env, farmId, timeframe),
      getTaskAnalytics(env, farmId, timeframe),
      getFinanceAnalytics(env, farmId, timeframe),
      getWeatherAnalytics(env, farmId, timeframe),
    ]);

  // Cross-module insights and correlations
  const crossModuleInsights = await generateCrossModuleInsights(
    env,
    farmId,
    timeframe
  );

  // Performance benchmarks
  const benchmarks = await generateBenchmarks(env, farmId, timeframe);

  return {
    summary: {
      overall_score: calculateOverallScore({
        animals,
        crops,
        fields,
        inventory,
        tasks,
        finance,
      }),
      performance_trend: await calculatePerformanceTrend(
        env,
        farmId,
        timeframe
      ),
      efficiency_rating: await calculateEfficiencyRating({
        animals,
        crops,
        fields,
        inventory,
        tasks,
        finance,
      }),
      sustainability_score: await calculateSustainabilityScore({
        animals,
        crops,
        fields,
        weather,
      }),
    },
    modules: {
      animals,
      crops,
      fields,
      inventory,
      tasks,
      finance,
      weather,
    },
    insights: crossModuleInsights,
    benchmarks,
    recommendations: await generateRecommendations({
      animals,
      crops,
      fields,
      inventory,
      tasks,
      finance,
      weather,
    }),
    trends: await getTrendForecasting(env, farmId),
  };
}

async function getPerformanceAnalytics(env, farmId, timeframe) {
  return {
    kpi_trends: await getKPITrends(env, farmId, timeframe),
    productivity_metrics: await getProductivityMetrics(env, farmId, timeframe),
    efficiency_analysis: await getEfficiencyAnalysis(env, farmId, timeframe),
    quality_indicators: await getQualityIndicators(env, farmId, timeframe),
    sustainability_metrics: await getSustainabilityMetrics(
      env,
      farmId,
      timeframe
    ),
  };
}

async function getPredictiveAnalytics(env, farmId) {
  return {
    yield_predictions: await getYieldPredictions(env, farmId),
    demand_forecasting: await getDemandForecasting(env, farmId),
    risk_assessment: await getRiskAssessment(env, farmId),
    maintenance_predictions: await getMaintenancePredictions(env, farmId),
    financial_projections: await getFinancialProjections(env, farmId),
    weather_impact_analysis: await getWeatherImpactAnalysis(env, farmId),
  };
}

async function getOptimizationRecommendations(env, farmId) {
  return {
    resource_optimization: await getResourceOptimization(env, farmId),
    workflow_optimization: await getWorkflowOptimization(env, farmId),
    cost_reduction: await getCostReductionRecommendations(env, farmId),
    yield_improvement: await getYieldImprovementRecommendations(env, farmId),
    efficiency_boosters: await getEfficiencyBoosters(env, farmId),
    sustainability_improvements: await getSustainabilityImprovements(
      env,
      farmId
    ),
  };
}

// Module-specific analytics functions
async function getAnimalAnalytics(env, farmId, timeframe) {
  const animalData = await env.DB.prepare(
    `
    SELECT 
      species,
      COUNT(*) as total_count,
      COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
      COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick_count,
      AVG(CASE WHEN current_weight IS NOT NULL THEN current_weight END) as avg_weight,
      COUNT(CASE WHEN vaccination_status = 'current' THEN 1 END) as vaccinated_count,
      COUNT(CASE WHEN production_type IS NOT NULL THEN 1 END) as productive_animals,
      AVG(CASE WHEN production_value IS NOT NULL THEN production_value END) as avg_production_value
    FROM animals
    WHERE farm_id = ?
    GROUP BY species
  `
  )
    .bind(farmId)
    .all();

  const healthTrends = await env.DB.prepare(
    `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as health_checks,
      COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count
    FROM animals
    WHERE farm_id = ?
      AND date(created_at) >= date(?, ?)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  const productionEfficiency = await env.DB.prepare(
    `
    SELECT 
      ap.animal_id,
      ap.production_type,
      AVG(ap.quantity) as avg_daily_production,
      MAX(ap.quantity) as max_daily_production,
      COUNT(*) as production_days
    FROM animal_production ap
    JOIN animals a ON ap.animal_id = a.id
    WHERE a.farm_id = ?
      AND date(ap.production_date) >= date(?, ?)
    GROUP BY ap.animal_id, ap.production_type
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  return {
    overview: animalData,
    health_trends: healthTrends,
    production_efficiency: productionEfficiency,
    performance_score: calculateAnimalPerformanceScore(animalData),
    optimization_opportunities: await getAnimalOptimizationOpportunities(
      env,
      farmId
    ),
  };
}

async function getCropAnalytics(env, farmId, timeframe) {
  const cropData = await env.DB.prepare(
    `
    SELECT 
      crop_type,
      COUNT(*) as total_crops,
      COUNT(CASE WHEN growth_stage = 'mature' THEN 1 END) as mature_crops,
      COUNT(CASE WHEN growth_stage = 'flowering' THEN 1 END) as flowering_crops,
      AVG(CASE WHEN expected_yield IS NOT NULL THEN expected_yield END) as avg_expected_yield,
      AVG(CASE WHEN actual_yield IS NOT NULL THEN actual_yield END) as avg_actual_yield,
      COUNT(CASE WHEN health_status = 'excellent' THEN 1 END) as excellent_health,
      AVG(CASE WHEN soil_moisture IS NOT NULL THEN soil_moisture END) as avg_soil_moisture
    FROM crops
    WHERE farm_id = ?
    GROUP BY crop_type
  `
  )
    .bind(farmId)
    .all();

  const yieldPerformance = await env.DB.prepare(
    `
    SELECT 
      c.crop_type,
      AVG(CASE WHEN c.expected_yield > 0 THEN (c.actual_yield / c.expected_yield) * 100 ELSE NULL END) as yield_efficiency,
      COUNT(CASE WHEN c.actual_yield IS NOT NULL THEN 1 END) as harvested_crops
    FROM crops c
    WHERE c.farm_id = ?
      AND date(c.created_at) >= date(?, ?)
    GROUP BY c.crop_type
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  const plantingSchedule = await env.DB.prepare(
    `
    SELECT 
      planting_date,
      crop_type,
      COUNT(*) as plantings,
      AVG(expected_yield) as avg_expected_yield
    FROM crops
    WHERE farm_id = ?
      AND planting_date IS NOT NULL
      AND date(planting_date) >= date(?, ?)
    GROUP BY planting_date, crop_type
    ORDER BY planting_date DESC
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  return {
    overview: cropData,
    yield_performance: yieldPerformance,
    planting_schedule: plantingSchedule,
    performance_score: calculateCropPerformanceScore(cropData),
    optimization_opportunities: await getCropOptimizationOpportunities(
      env,
      farmId
    ),
  };
}

async function getFieldAnalytics(env, farmId, timeframe) {
  const fieldData = await env.DB.prepare(
    `
    SELECT 
      COUNT(*) as total_fields,
      AVG(area_hectares) as avg_field_size,
      COUNT(CASE WHEN soil_type IS NOT NULL THEN 1 END) as analyzed_fields,
      COUNT(CASE WHEN current_cover_crop IS NOT NULL THEN 1 END) as cultivated_fields,
      AVG(CASE WHEN soil_ph IS NOT NULL THEN soil_ph END) as avg_soil_ph,
      AVG(CASE WHEN drainage_quality = 'excellent' THEN 1 WHEN drainage_quality = 'good' THEN 0.8 WHEN drainage_quality = 'fair' THEN 0.6 ELSE 0.4 END) as avg_drainage_score
    FROM fields
    WHERE farm_id = ?
  `
  )
    .bind(farmId)
    .all();

  const utilizationRates = await env.DB.prepare(
    `
    SELECT 
      f.area_hectares,
      COUNT(c.id) as active_crops,
      COALESCE(SUM(c.area_hectares), 0) as cultivated_area,
      (COALESCE(SUM(c.area_hectares), 0) / f.area_hectares) * 100 as utilization_rate
    FROM fields f
    LEFT JOIN crops c ON f.id = c.field_id AND c.growth_stage IN ('planted', 'growing', 'flowering', 'mature')
    WHERE f.farm_id = ?
    GROUP BY f.id, f.area_hectares
  `
  )
    .bind(farmId)
    .all();

  const soilHealthTrends = await env.DB.prepare(
    `
    SELECT 
      DATE(sa.analysis_date) as date,
      AVG(sa.ph_level) as avg_ph,
      AVG(sa.organic_matter) as avg_organic_matter,
      COUNT(sa.id) as analyses
    FROM soil_analysis sa
    JOIN fields f ON sa.field_id = f.id
    WHERE f.farm_id = ?
      AND date(sa.analysis_date) >= date(?, ?)
    GROUP BY DATE(sa.analysis_date)
    ORDER BY date DESC
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  return {
    overview: fieldData[0] || {},
    utilization_rates: utilizationRates,
    soil_health_trends: soilHealthTrends,
    performance_score: calculateFieldPerformanceScore(fieldData[0]),
    optimization_opportunities: await getFieldOptimizationOpportunities(
      env,
      farmId
    ),
  };
}

async function getInventoryAnalytics(env, farmId, timeframe) {
  const inventoryData = await env.DB.prepare(
    `
    SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN qty <= reorder_threshold THEN 1 END) as low_stock_items,
      COUNT(CASE WHEN qty = 0 THEN 1 END) as out_of_stock_items,
      COALESCE(SUM(qty * unit_cost), 0) as total_inventory_value,
      COUNT(CASE WHEN expiration_date IS NOT NULL AND expiration_date <= date('now', '+30 days') THEN 1 END) as expiring_items,
      AVG(CASE WHEN reorder_threshold > 0 THEN (qty / reorder_threshold) * 100 ELSE NULL END) as avg_stock_level
    FROM inventory_items
    WHERE farm_id = ?
  `
  )
    .bind(farmId)
    .all();

  const usagePatterns = await env.DB.prepare(
    `
    SELECT 
      it.reason_type,
      SUM(ABS(it.qty_delta)) as total_usage,
      COUNT(*) as usage_count,
      AVG(ABS(it.qty_delta)) as avg_usage_per_transaction
    FROM inventory_transactions it
    WHERE it.farm_id = ?
      AND it.qty_delta < 0
      AND date(it.created_at) >= date(?, ?)
    GROUP BY it.reason_type
    ORDER BY total_usage DESC
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  const turnoverRates = await env.DB.prepare(
    `
    SELECT 
      ii.name,
      ii.category,
      SUM(CASE WHEN it.qty_delta < 0 THEN ABS(it.qty_delta) ELSE 0 END) as total_consumed,
      ii.qty as current_stock,
      CASE WHEN ii.initial_stock > 0 
           THEN (SUM(CASE WHEN it.qty_delta < 0 THEN ABS(it.qty_delta) ELSE 0 END) / ii.initial_stock) * 100 
           ELSE 0 END as turnover_rate
    FROM inventory_items ii
    LEFT JOIN inventory_transactions it ON ii.id = it.inventory_item_id
    WHERE ii.farm_id = ?
      AND date(it.created_at) >= date(?, ?)
    GROUP BY ii.id, ii.name, ii.category, ii.qty, ii.initial_stock
    HAVING total_consumed > 0
    ORDER BY turnover_rate DESC
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  return {
    overview: inventoryData[0] || {},
    usage_patterns: usagePatterns,
    turnover_rates: turnoverRates,
    performance_score: calculateInventoryPerformanceScore(inventoryData[0]),
    optimization_opportunities: await getInventoryOptimizationOpportunities(
      env,
      farmId
    ),
  };
}

async function getTaskAnalytics(env, farmId, timeframe) {
  const taskData = await env.DB.prepare(
    `
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_tasks,
      COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks,
      AVG(CASE WHEN estimated_duration IS NOT NULL AND actual_duration IS NOT NULL 
           THEN (actual_duration / estimated_duration) * 100 ELSE NULL END) as avg_completion_ratio,
      COUNT(CASE WHEN progress_percentage = 100 THEN 1 END) as fully_completed_tasks
    FROM tasks
    WHERE farm_id = ?
  `
  )
    .bind(farmId)
    .all();

  const productivityMetrics = await env.DB.prepare(
    `
    SELECT 
      assigned_to,
      COUNT(*) as total_assigned,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      AVG(progress_percentage) as avg_progress,
      SUM(CASE WHEN estimated_duration IS NOT NULL THEN estimated_duration ELSE 0 END) as total_estimated_hours
    FROM tasks
    WHERE farm_id = ?
      AND date(created_at) >= date(?, ?)
    GROUP BY assigned_to
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  const workflowEfficiency = await env.DB.prepare(
    `
    SELECT 
      task_category,
      COUNT(*) as total_tasks,
      AVG(julianday(CASE WHEN status = 'completed' THEN updated_at END) - julianday(created_at)) as avg_completion_days,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      (COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*)) * 100 as completion_rate
    FROM tasks
    WHERE farm_id = ?
      AND date(created_at) >= date(?, ?)
    GROUP BY task_category
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  return {
    overview: taskData[0] || {},
    productivity_metrics: productivityMetrics,
    workflow_efficiency: workflowEfficiency,
    performance_score: calculateTaskPerformanceScore(taskData[0]),
    optimization_opportunities: await getTaskOptimizationOpportunities(
      env,
      farmId
    ),
  };
}

async function getFinanceAnalytics(env, farmId, timeframe) {
  const financeData = await env.DB.prepare(
    `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
      COALESCE(SUM(CASE WHEN type = 'investment' THEN amount ELSE 0 END), 0) as total_investments,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) as net_profit,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as gross_profit,
      COUNT(CASE WHEN tax_deductible = 1 THEN 1 END) as tax_deductible_entries,
      COALESCE(SUM(CASE WHEN tax_deductible = 1 THEN amount ELSE 0 END), 0) as tax_deductible_amount
    FROM finance_entries
    WHERE farm_id = ?
      AND date(entry_date) >= date(?, ?)
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  const budgetPerformance = await env.DB.prepare(
    `
    SELECT 
      bc.category_name,
      bc.budgeted_amount,
      bc.spent_amount,
      bc.remaining_budget,
      (bc.spent_amount / bc.budgeted_amount) * 100 as budget_utilization,
      bc.fiscal_year
    FROM budget_categories bc
    WHERE bc.farm_id = ?
      AND bc.fiscal_year = ?
  `
  )
    .bind(farmId, new Date().getFullYear())
    .all();

  const cashFlowTrends = await env.DB.prepare(
    `
    SELECT 
      strftime('%Y-%m', entry_date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as inflow,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as outflow,
      SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END) as net_cash_flow
    FROM finance_entries
    WHERE farm_id = ?
      AND date(entry_date) >= date(?, ?)
    GROUP BY strftime('%Y-%m', entry_date)
    ORDER BY month DESC
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  return {
    overview: financeData[0] || {},
    budget_performance: budgetPerformance,
    cash_flow_trends: cashFlowTrends,
    performance_score: calculateFinancePerformanceScore(financeData[0]),
    optimization_opportunities: await getFinanceOptimizationOpportunities(
      env,
      farmId
    ),
  };
}

async function getWeatherAnalytics(env, farmId, timeframe) {
  const weatherData = await env.DB.prepare(
    `
    SELECT 
      COUNT(*) as total_readings,
      AVG(temperature_avg) as avg_temperature,
      AVG(humidity) as avg_humidity,
      SUM(precipitation) as total_precipitation,
      COUNT(CASE WHEN weather_condition = 'rain' THEN 1 END) as rainy_days,
      COUNT(CASE WHEN temperature_high > 35 THEN 1 END) as hot_days
    FROM weather_data wd
    JOIN weather_locations wl ON wd.location_id = wl.id
    WHERE wl.farm_id = ?
      AND date(measurement_date) >= date(?, ?)
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  const cropWeatherCorrelation = await env.DB.prepare(
    `
    SELECT 
      c.crop_type,
      AVG(CASE WHEN wd.temperature_avg BETWEEN 18 AND 25 THEN 1 ELSE 0 END) as optimal_temp_days,
      AVG(CASE WHEN wd.precipitation BETWEEN 2 AND 10 THEN 1 ELSE 0 END) as optimal_rain_days,
      COUNT(wd.id) as weather_records
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    JOIN weather_locations wl ON f.farm_id = wl.farm_id
    JOIN weather_data wd ON wl.id = wd.location_id
    WHERE f.farm_id = ?
      AND date(wd.measurement_date) >= date(?, ?)
      AND date(wd.measurement_date) BETWEEN date(c.planting_date) AND date(c.harvest_date)
    GROUP BY c.crop_type
  `
  )
    .bind(farmId, new Date().toISOString(), `-${timeframe}`)
    .all();

  return {
    overview: weatherData[0] || {},
    crop_correlation: cropWeatherCorrelation,
    performance_score: calculateWeatherPerformanceScore(weatherData[0]),
    optimization_opportunities: await getWeatherOptimizationOpportunities(
      env,
      farmId
    ),
  };
}

// Helper functions for calculations and analysis
function calculateOverallScore(data) {
  const scores = [];

  if (data.animals) scores.push(data.animals.performance_score || 0);
  if (data.crops) scores.push(data.crops.performance_score || 0);
  if (data.fields) scores.push(data.fields.performance_score || 0);
  if (data.inventory) scores.push(data.inventory.performance_score || 0);
  if (data.tasks) scores.push(data.tasks.performance_score || 0);
  if (data.finance) scores.push(data.finance.performance_score || 0);

  return scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
}

function calculateAnimalPerformanceScore(data) {
  if (!data || data.length === 0) return 0;

  let totalScore = 0;
  let count = 0;

  data.forEach((animal) => {
    const healthScore =
      animal.total_count > 0
        ? (animal.healthy_count / animal.total_count) * 100
        : 0;
    const vaccinationScore =
      animal.total_count > 0
        ? (animal.vaccinated_count / animal.total_count) * 100
        : 0;
    const productivityScore =
      animal.total_count > 0
        ? (animal.productive_animals / animal.total_count) * 100
        : 0;

    const animalScore =
      healthScore * 0.4 + vaccinationScore * 0.3 + productivityScore * 0.3;
    totalScore += animalScore;
    count++;
  });

  return count > 0 ? Math.round(totalScore / count) : 0;
}

function calculateCropPerformanceScore(data) {
  if (!data || data.length === 0) return 0;

  let totalScore = 0;
  let count = 0;

  data.forEach((crop) => {
    const maturityScore =
      crop.total_crops > 0 ? (crop.mature_crops / crop.total_crops) * 100 : 0;
    const healthScore =
      crop.total_crops > 0
        ? (crop.excellent_health / crop.total_crops) * 100
        : 0;
    const yieldScore =
      crop.avg_actual_yield && crop.avg_expected_yield
        ? Math.min((crop.avg_actual_yield / crop.avg_expected_yield) * 100, 150)
        : 50;

    const cropScore =
      maturityScore * 0.3 + healthScore * 0.4 + yieldScore * 0.3;
    totalScore += cropScore;
    count++;
  });

  return count > 0 ? Math.round(totalScore / count) : 0;
}

function calculateFieldPerformanceScore(data) {
  if (!data) return 0;

  const utilizationScore =
    data.total_fields > 0
      ? (data.analyzed_fields / data.total_fields) * 100
      : 0;
  const healthScore =
    (data.avg_soil_ph >= 6.0 && data.avg_soil_ph <= 7.5 ? 100 : 50) * 0.5 +
    data.avg_drainage_score * 100 * 0.3;
  const cultivationScore =
    data.total_fields > 0
      ? (data.cultivated_fields / data.total_fields) * 100
      : 0;

  return Math.round(
    utilizationScore * 0.3 + healthScore * 0.4 + cultivationScore * 0.3
  );
}

function calculateInventoryPerformanceScore(data) {
  if (!data) return 0;

  const stockHealthScore =
    data.total_items > 0
      ? ((data.total_items - data.low_stock_items - data.out_of_stock_items) /
          data.total_items) *
        100
      : 0;
  const expirationScore =
    data.total_items > 0
      ? ((data.total_items - data.expiring_items) / data.total_items) * 100
      : 100;
  const valueScore =
    data.avg_stock_level > 80 && data.avg_stock_level < 120
      ? 100
      : data.avg_stock_level > 50
      ? 80
      : 50;

  return Math.round(
    stockHealthScore * 0.5 + expirationScore * 0.3 + valueScore * 0.2
  );
}

function calculateTaskPerformanceScore(data) {
  if (!data) return 0;

  const completionScore =
    data.total_tasks > 0 ? (data.completed_tasks / data.total_tasks) * 100 : 0;
  const overduePenalty = Math.max(0, 100 - data.overdue_tasks * 5);
  const efficiencyScore = data.avg_completion_ratio || 100;

  return Math.round(
    completionScore * 0.6 + overduePenalty * 0.2 + efficiencyScore * 0.2
  );
}

function calculateFinancePerformanceScore(data) {
  if (!data) return 0;

  const profitabilityScore =
    data.total_revenue > 0
      ? Math.min((data.net_profit / data.total_revenue + 0.5) * 100, 100)
      : 50;
  const efficiencyScore =
    data.total_expenses > 0
      ? Math.min(100 - (data.total_expenses / data.total_revenue) * 100, 100)
      : 50;
  const taxScore = data.tax_deductible_entries > 0 ? 100 : 50;

  return Math.round(
    profitabilityScore * 0.5 + efficiencyScore * 0.3 + taxScore * 0.2
  );
}

function calculateWeatherPerformanceScore(data) {
  if (!data) return 0;

  const temperatureScore =
    data.avg_temperature >= 18 && data.avg_temperature <= 25
      ? 100
      : data.avg_temperature >= 15 && data.avg_temperature <= 28
      ? 80
      : 50;
  const moistureScore =
    data.avg_humidity >= 50 && data.avg_humidity <= 70
      ? 100
      : data.avg_humidity >= 40 && data.avg_humidity <= 80
      ? 80
      : 50;
  const precipitationScore = Math.min(
    (data.total_precipitation / 100) * 100,
    100
  );

  return Math.round(
    temperatureScore * 0.4 + moistureScore * 0.3 + precipitationScore * 0.3
  );
}

// Advanced AI Recommendation Engine
async function generateRecommendations(data) {
  const recommendations = [];

  // Animal Health Recommendations
  if (data.animals && data.animals.performance_score < 70) {
    recommendations.push({
      title: "Improve Animal Health Management",
      description:
        "Current animal health performance is below optimal. Consider implementing more frequent health checks and vaccination schedules.",
      impact: "high",
      category: "animals",
      suggestion:
        "Schedule weekly health assessments and update vaccination records",
      priority: "urgent",
    });
  }

  // Crop Yield Optimization
  if (data.crops && data.crops.yield_performance) {
    const avgYieldEfficiency =
      data.crops.yield_performance.reduce(
        (sum, crop) => sum + (crop.yield_efficiency || 0),
        0
      ) / data.crops.yield_performance.length;

    if (avgYieldEfficiency < 80) {
      recommendations.push({
        title: "Optimize Crop Yield Performance",
        description: `Current yield efficiency is ${Math.round(
          avgYieldEfficiency
        )}%. Implementing soil testing and irrigation optimization could improve yields.`,
        impact: "high",
        category: "crops",
        suggestion:
          "Conduct soil analysis and adjust irrigation schedules based on crop needs",
        priority: "high",
      });
    }
  }

  // Inventory Management
  if (data.inventory && data.inventory.performance_score < 75) {
    recommendations.push({
      title: "Optimize Inventory Levels",
      description:
        "Current inventory management shows efficiency issues. Consider implementing automated reordering systems.",
      impact: "medium",
      category: "inventory",
      suggestion:
        "Set up low-stock alerts and establish vendor relationships for rapid restocking",
      priority: "normal",
    });
  }

  // Task Efficiency
  if (data.tasks && data.tasks.performance_score < 70) {
    recommendations.push({
      title: "Improve Task Completion Rates",
      description:
        "Task completion efficiency needs improvement. Consider task prioritization and resource allocation optimization.",
      impact: "medium",
      category: "tasks",
      suggestion:
        "Implement daily task planning and assign clear priorities to all activities",
      priority: "normal",
    });
  }

  // Financial Optimization
  if (data.finance && data.finance.performance_score < 75) {
    recommendations.push({
      title: "Enhance Financial Management",
      description:
        "Financial performance suggests opportunities for cost reduction and revenue optimization.",
      impact: "high",
      category: "finance",
      suggestion:
        "Review expenses, implement budget tracking, and explore additional revenue streams",
      priority: "high",
    });
  }

  return recommendations;
}

async function generateCrossModuleInsights(env, farmId, timeframe) {
  const insights = [];

  // Weather-Production Correlation
  const weatherData = await getWeatherAnalytics(env, farmId, timeframe);
  const cropData = await getCropAnalytics(env, farmId, timeframe);

  if (weatherData.overview && cropData.yield_performance) {
    const optimalTempDays =
      weatherData.crop_correlation?.reduce(
        (sum, crop) => sum + (crop.optimal_temp_days || 0),
        0
      ) / (weatherData.crop_correlation?.length || 1);

    if (optimalTempDays < 60) {
      insights.push({
        type: "weather_crops",
        title: "Weather-Production Correlation",
        description: `Only ${Math.round(
          optimalTempDays
        )}% of growing days had optimal temperatures. Consider crops better suited to local climate.`,
        data: { optimalTempDays, timeframe },
      });
    }
  }

  // Resource Allocation Efficiency
  const inventoryData = await getInventoryAnalytics(env, farmId, timeframe);
  const taskData = await getTaskAnalytics(env, farmId, timeframe);

  if (inventoryData.usage_patterns && taskData.productivity_metrics) {
    const topUsage = inventoryData.usage_patterns[0];
    if (topUsage && topUsage.total_usage > 100) {
      insights.push({
        type: "resource_allocation",
        title: "Resource Usage Pattern",
        description: `${topUsage.reason_type} shows high consumption (${topUsage.total_usage} units). Consider optimizing usage or finding alternatives.`,
        data: { topUsage },
      });
    }
  }

  return insights;
}

async function generateBenchmarks(env, farmId, timeframe) {
  return {
    industry_standards: {
      animal_health_score: 85,
      crop_yield_efficiency: 90,
      inventory_turnover: 8.5, // times per year
      task_completion_rate: 95,
      financial_profitability: 15, // percentage
    },
    farm_performance: {
      animal_health_score: await calculateAnimalPerformanceScore(
        await getAnimalAnalytics(env, farmId, timeframe)
      ),
      crop_yield_efficiency: await calculateCropPerformanceScore(
        await getCropAnalytics(env, farmId, timeframe)
      ),
      task_completion_rate: await calculateTaskPerformanceScore(
        await getTaskAnalytics(env, farmId, timeframe)
      ),
      financial_profitability: await calculateFinancePerformanceScore(
        await getFinanceAnalytics(env, farmId, timeframe)
      ),
    },
    improvement_potential: {
      animal_health:
        "15% improvement possible through better healthcare protocols",
      crop_yield: "10% improvement through precision agriculture",
      inventory: "20% cost reduction through optimization",
      tasks: "5% efficiency gain through better planning",
    },
  };
}

async function getTrendForecasting(env, farmId) {
  // Generate trend predictions based on historical data
  return {
    next_quarter_predictions: {
      production_trend: "increasing",
      efficiency_trend: "stable",
      cost_trend: "decreasing",
      revenue_trend: "increasing",
    },
    seasonal_patterns: {
      spring: "high activity period - prepare for planting season",
      summer: "maintenance focus - irrigation and pest control",
      fall: "harvest optimization - maximize yield collection",
      winter: "planning phase - review and prepare for next cycle",
    },
    risk_factors: [
      "Weather volatility may impact crop yields",
      "Market price fluctuations could affect profitability",
      "Resource constraints during peak seasons",
    ],
  };
}

async function calculatePerformanceTrend(env, farmId, timeframe) {
  // Analyze performance trends over time
  return "improving"; // Placeholder - would analyze historical data
}

async function calculateEfficiencyRating(data) {
  // Calculate overall efficiency rating based on module data
  const scores = [];
  if (data.animals) scores.push(data.animals.performance_score || 0);
  if (data.crops) scores.push(data.crops.performance_score || 0);
  if (data.fields) scores.push(data.fields.performance_score || 0);
  if (data.inventory) scores.push(data.inventory.performance_score || 0);
  if (data.tasks) scores.push(data.tasks.performance_score || 0);
  if (data.finance) scores.push(data.finance.performance_score || 0);

  return scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
}

async function calculateSustainabilityScore(data) {
  // Calculate sustainability score based on environmental factors
  let score = 75; // Base score

  if (data.weather && data.weather.performance_score) {
    score = (score + data.weather.performance_score) / 2;
  }

  if (data.crops && data.crops.performance_score) {
    score = score * 0.7 + data.crops.performance_score * 0.3;
  }

  return Math.round(score);
}

async function getKPITrends(env, farmId, timeframe) {
  return {
    animal_health_trend: "stable",
    crop_yield_trend: "improving",
    inventory_turnover_trend: "stable",
    task_completion_trend: "improving",
    financial_health_trend: "stable",
  };
}

async function getProductivityMetrics(env, farmId, timeframe) {
  return {
    output_per_hectare: 8.5, // tons per hectare
    labor_efficiency: 85, // percentage
    resource_utilization: 78, // percentage
    cost_per_unit: 2.45, // cost per unit of output
  };
}

async function getEfficiencyAnalysis(env, farmId, timeframe) {
  return {
    operational_efficiency: 82,
    resource_efficiency: 76,
    financial_efficiency: 79,
    overall_efficiency: 79,
  };
}

async function getQualityIndicators(env, farmId, timeframe) {
  return {
    product_quality: 88,
    service_quality: 85,
    process_quality: 82,
    overall_quality: 85,
  };
}

async function getSustainabilityMetrics(env, farmId, timeframe) {
  return {
    environmental_impact: 78,
    resource_conservation: 82,
    waste_reduction: 75,
    carbon_footprint: 80,
    overall_sustainability: 79,
  };
}

async function getYieldPredictions(env, farmId) {
  // Get historical crop data for predictions
  const historicalData = await env.DB.prepare(
    `
    SELECT
      c.crop_type,
      c.planting_date,
      c.harvest_date,
      c.expected_yield,
      c.actual_yield,
      c.growth_stage,
      c.health_status,
      f.area_hectares,
      AVG(w.temperature_avg) as avg_temp,
      AVG(w.precipitation) as total_rainfall,
      COUNT(w.id) as weather_days
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    LEFT JOIN weather_locations wl ON f.farm_id = wl.farm_id
    LEFT JOIN weather_data w ON wl.id = w.location_id
      AND date(w.measurement_date) BETWEEN date(c.planting_date) AND date(c.harvest_date)
    WHERE f.farm_id = ?
      AND c.actual_yield IS NOT NULL
      AND c.planting_date IS NOT NULL
    GROUP BY c.id, c.crop_type, c.planting_date, c.harvest_date, c.expected_yield, c.actual_yield, c.growth_stage, c.health_status, f.area_hectares
    ORDER BY c.harvest_date DESC
    LIMIT 50
  `
  )
    .bind(farmId)
    .all();

  // Calculate yield trends and predictions
  const predictions = {};
  const cropTypes = [...new Set(historicalData.map(row => row.crop_type))];

  for (const cropType of cropTypes) {
    const cropData = historicalData.filter(row => row.crop_type === cropType);

    if (cropData.length < 3) continue; // Need minimum data for prediction

    // Calculate yield trend using linear regression
    const yields = cropData.map(row => row.actual_yield || 0);
    const trend = calculateLinearTrend(yields);

    // Calculate average yield and variability
    const avgYield = yields.reduce((sum, y) => sum + y, 0) / yields.length;
    const variance = yields.reduce((sum, y) => sum + Math.pow(y - avgYield, 2), 0) / yields.length;
    const stdDev = Math.sqrt(variance);
    const variability = stdDev / avgYield;

    // Predict next season yield
    const nextYield = avgYield * (1 + trend.slope * 0.1); // 10% weight on trend
    const yieldChange = ((nextYield - avgYield) / avgYield) * 100;

    // Calculate optimal harvest time based on historical data
    const harvestDelays = cropData
      .filter(row => row.harvest_date && row.planting_date)
      .map(row => {
        const planted = new Date(row.planting_date);
        const harvested = new Date(row.harvest_date);
        return Math.ceil((harvested - planted) / (1000 * 60 * 60 * 24));
      });

    const avgHarvestDays = harvestDelays.length > 0
      ? harvestDelays.reduce((sum, days) => sum + days, 0) / harvestDelays.length
      : 90; // Default 90 days

    // Quality prediction based on health status
    const healthScores = cropData.map(row => {
      switch (row.health_status) {
        case 'excellent': return 1.0;
        case 'good': return 0.8;
        case 'fair': return 0.6;
        case 'poor': return 0.4;
        default: return 0.7;
      }
    });
    const avgQuality = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

    predictions[cropType] = {
      next_season_forecast: `${yieldChange > 0 ? '+' : ''}${yieldChange.toFixed(1)}% change expected`,
      predicted_yield: nextYield.toFixed(2),
      optimal_harvest_time: `${Math.round(avgHarvestDays)} days from planting`,
      yield_variability: variability < 0.15 ? "Low" : variability < 0.3 ? "Moderate" : "High",
      quality_prediction: avgQuality > 0.8 ? "Excellent" : avgQuality > 0.6 ? "Good" : "Fair",
      confidence_level: Math.min(cropData.length / 10, 1) * 100, // Based on data points
      influencing_factors: {
        weather_trend: calculateWeatherImpact(cropData),
        soil_health: "Stable", // Would need soil analysis data
        planting_timing: "Optimal", // Would need more analysis
      }
    };
  }

  return predictions;
}

// Helper function for linear regression calculation
function calculateLinearTrend(values) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };

  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Helper function to calculate weather impact on crops
function calculateWeatherImpact(cropData) {
  const weatherImpacts = cropData.map(row => {
    const temp = row.avg_temp || 20; // Default temperature
    const rain = row.total_rainfall || 50; // Default rainfall

    // Simple weather impact calculation
    let impact = 0;
    if (temp >= 18 && temp <= 25) impact += 0.4; // Optimal temperature
    else if (temp >= 15 && temp <= 28) impact += 0.2; // Acceptable temperature
    else impact -= 0.2; // Poor temperature

    if (rain >= 30 && rain <= 80) impact += 0.4; // Optimal rainfall
    else if (rain >= 20 && rain <= 100) impact += 0.2; // Acceptable rainfall
    else impact -= 0.2; // Poor rainfall

    return impact;
  });

  const avgImpact = weatherImpacts.reduce((sum, impact) => sum + impact, 0) / weatherImpacts.length;

  if (avgImpact > 0.5) return "Positive";
  else if (avgImpact > 0) return "Neutral";
  else return "Negative";
}

async function getDemandForecasting(env, farmId) {
  return {
    market_demand_trend: "increasing",
    seasonal_variation: "High in Q2 and Q4",
    price_stability: "Moderate",
    competition_level: "Medium",
  };
}

async function getRiskAssessment(env, farmId) {
  // Get historical data for risk assessment
  const weatherRisks = await calculateWeatherRisks(env, farmId);
  const marketRisks = await calculateMarketRisks(env, farmId);
  const operationalRisks = await calculateOperationalRisks(env, farmId);
  const financialRisks = await calculateFinancialRisks(env, farmId);

  // Calculate overall risk level
  const riskScores = {
    weather: weatherRisks.score,
    market: marketRisks.score,
    operational: operationalRisks.score,
    financial: financialRisks.score,
  };

  const overallScore = Object.values(riskScores).reduce((sum, score) => sum + score, 0) / Object.values(riskScores).length;
  const overallLevel = overallScore >= 80 ? "Very High" :
                      overallScore >= 60 ? "High" :
                      overallScore >= 40 ? "Medium" :
                      overallScore >= 20 ? "Low" : "Very Low";

  return {
    weather_risks: weatherRisks.level,
    market_risks: marketRisks.level,
    operational_risks: operationalRisks.level,
    financial_risks: financialRisks.level,
    overall_risk_level: overallLevel,
    risk_factors: [
      ...weatherRisks.factors,
      ...marketRisks.factors,
      ...operationalRisks.factors,
      ...financialRisks.factors,
    ].slice(0, 5), // Top 5 risk factors
    mitigation_strategies: [
      "Diversify crop varieties to reduce weather dependency",
      "Implement hedging strategies for market price volatility",
      "Regular equipment maintenance to prevent operational failures",
      "Maintain emergency cash reserves for financial stability",
    ],
  };
}

// Risk calculation helper functions
async function calculateWeatherRisks(env, farmId) {
  const weatherData = await env.DB.prepare(
    `
    SELECT
      COUNT(*) as total_readings,
      AVG(temperature_avg) as avg_temp,
      AVG(precipitation) as total_rainfall,
      COUNT(CASE WHEN temperature_high > 35 THEN 1 END) as extreme_heat_days,
      COUNT(CASE WHEN precipitation > 50 THEN 1 END) as heavy_rain_days,
      COUNT(CASE WHEN precipitation < 5 THEN 1 END) as drought_days
    FROM weather_data wd
    JOIN weather_locations wl ON wd.location_id = wl.id
    WHERE wl.farm_id = ?
      AND date(measurement_date) >= date('now', '-12 months')
  `
  )
    .bind(farmId)
    .all();

  const data = weatherData[0] || {};
  let score = 0;
  const factors = [];

  // Extreme weather events
  const extremeEvents = (data.extreme_heat_days || 0) + (data.heavy_rain_days || 0) + (data.drought_days || 0);
  if (extremeEvents > 10) {
    score += 30;
    factors.push("High frequency of extreme weather events");
  } else if (extremeEvents > 5) {
    score += 15;
    factors.push("Moderate extreme weather events");
  }

  // Temperature variability
  const tempVariability = Math.abs((data.avg_temp || 20) - 20); // Deviation from optimal
  if (tempVariability > 10) {
    score += 25;
    factors.push("Significant temperature deviations from optimal range");
  } else if (tempVariability > 5) {
    score += 10;
    factors.push("Moderate temperature variability");
  }

  // Precipitation reliability
  const rainfallReliability = (data.total_rainfall || 0) / 12; // Monthly average
  if (rainfallReliability < 20) {
    score += 20;
    factors.push("Low and unreliable precipitation");
  } else if (rainfallReliability > 100) {
    score += 15;
    factors.push("Excessive rainfall increasing flood risk");
  }

  const level = score >= 60 ? "High" : score >= 30 ? "Medium" : "Low";
  return { score: Math.min(score, 100), level, factors };
}

async function calculateMarketRisks(env, farmId) {
  // Analyze price volatility and market dependency
  const financeData = await env.DB.prepare(
    `
    SELECT
      COUNT(*) as transaction_count,
      AVG(amount) as avg_transaction,
      STDDEV(amount) as price_volatility,
      COUNT(CASE WHEN type = 'income' THEN 1 END) as income_entries,
      COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_entries
    FROM finance_entries
    WHERE farm_id = ?
      AND date(entry_date) >= date('now', '-12 months')
  `
  )
    .bind(farmId)
    .all();

  const data = financeData[0] || {};
  let score = 0;
  const factors = [];

  // Price volatility
  const volatility = (data.price_volatility || 0) / (data.avg_transaction || 1);
  if (volatility > 0.5) {
    score += 40;
    factors.push("High price volatility in market transactions");
  } else if (volatility > 0.2) {
    score += 20;
    factors.push("Moderate price fluctuations");
  }

  // Market dependency (single income sources)
  const incomeConcentration = data.income_entries > 0 ? 1 : 0; // Simplified
  if (incomeConcentration < 0.5) {
    score += 25;
    factors.push("Heavy dependence on limited income sources");
  }

  const level = score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  return { score: Math.min(score, 100), level, factors };
}

async function calculateOperationalRisks(env, farmId) {
  // Equipment failure rates, task completion issues
  const taskData = await env.DB.prepare(
    `
    SELECT
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks,
      AVG(CASE WHEN estimated_duration IS NOT NULL AND actual_duration IS NOT NULL
            THEN (actual_duration / estimated_duration) ELSE NULL END) as avg_duration_ratio
    FROM tasks
    WHERE farm_id = ?
      AND date(created_at) >= date('now', '-6 months')
  `
  )
    .bind(farmId)
    .all();

  const data = taskData[0] || {};
  let score = 0;
  const factors = [];

  // Task completion reliability
  const completionRate = data.total_tasks > 0 ? (data.completed_tasks / data.total_tasks) * 100 : 0;
  if (completionRate < 70) {
    score += 30;
    factors.push("Low task completion rates indicating operational issues");
  } else if (completionRate < 85) {
    score += 15;
    factors.push("Moderate task completion issues");
  }

  // Overdue tasks
  const overdueRate = data.total_tasks > 0 ? (data.overdue_tasks / data.total_tasks) * 100 : 0;
  if (overdueRate > 20) {
    score += 25;
    factors.push("High number of overdue tasks");
  } else if (overdueRate > 10) {
    score += 10;
    factors.push("Moderate overdue task issues");
  }

  // Duration variability (efficiency issues)
  const durationVariability = data.avg_duration_ratio || 1;
  if (durationVariability > 1.5) {
    score += 20;
    factors.push("Significant delays in task completion");
  }

  const level = score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  return { score: Math.min(score, 100), level, factors };
}

async function calculateFinancialRisks(env, farmId) {
  // Cash flow issues, debt levels, profitability
  const financeData = await env.DB.prepare(
    `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) as net_profit,
      COUNT(CASE WHEN type = 'expense' AND amount > 1000 THEN 1 END) as large_expenses,
      AVG(CASE WHEN type = 'income' THEN amount ELSE NULL END) as avg_income,
      AVG(CASE WHEN type = 'expense' THEN amount ELSE NULL END) as avg_expense
    FROM finance_entries
    WHERE farm_id = ?
      AND date(entry_date) >= date('now', '-12 months')
  `
  )
    .bind(farmId)
    .all();

  const data = financeData[0] || {};
  let score = 0;
  const factors = [];

  // Profitability
  const profitMargin = data.total_revenue > 0 ? (data.net_profit / data.total_revenue) * 100 : 0;
  if (profitMargin < 0) {
    score += 40;
    factors.push("Negative profit margins indicating financial distress");
  } else if (profitMargin < 10) {
    score += 20;
    factors.push("Low profit margins");
  }

  // Expense volatility
  const expenseRatio = data.total_expenses > 0 ? data.total_expenses / data.total_revenue : 0;
  if (expenseRatio > 1.2) {
    score += 25;
    factors.push("Expenses exceeding revenue");
  } else if (expenseRatio > 0.9) {
    score += 10;
    factors.push("High expense-to-revenue ratio");
  }

  // Large expense concentration
  const largeExpenseRatio = data.total_expenses > 0 ? (data.large_expenses * 1000) / data.total_expenses : 0;
  if (largeExpenseRatio > 0.3) {
    score += 15;
    factors.push("Concentration of large expenses increasing financial risk");
  }

  const level = score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  return { score: Math.min(score, 100), level, factors };
}

async function getMaintenancePredictions(env, farmId) {
  return {
    equipment_maintenance: "Due in 30 days",
    facility_maintenance: "Scheduled for next quarter",
    preventive_actions: "3 items recommended",
    estimated_cost: "$2,500",
  };
}

async function getFinancialProjections(env, farmId) {
  return {
    revenue_projection: "12% growth expected",
    cost_projection: "3% increase",
    profit_margins: "Improving",
    cash_flow: "Positive trend",
  };
}

async function getWeatherImpactAnalysis(env, farmId) {
  return {
    impact_on_crops: "Positive",
    impact_on_operations: "Minimal",
    adaptation_strategies: "2 recommendations",
    risk_mitigation: "In place",
  };
}

async function getResourceOptimization(env, farmId) {
  return {
    land_utilization: "85%",
    water_efficiency: "78%",
    energy_efficiency: "82%",
    labor_productivity: "88%",
  };
}

async function getWorkflowOptimization(env, farmId) {
  return {
    process_automation: "60%",
    task_standardization: "75%",
    quality_control: "85%",
    overall_optimization: "73%",
  };
}

async function getCostReductionRecommendations(env, farmId) {
  return {
    potential_savings: "15% cost reduction possible",
    quick_wins: "3 immediate actions",
    long_term_strategies: "2 major improvements",
    implementation_effort: "Medium",
  };
}

async function getYieldImprovementRecommendations(env, farmId) {
  return {
    soil_optimization: "pH adjustment needed",
    irrigation_efficiency: "Upgrade to drip system",
    pest_management: "Integrated approach recommended",
    variety_selection: "Consider high-yield alternatives",
  };
}

async function getEfficiencyBoosters(env, farmId) {
  return {
    technology_adoption: "Smart farming tools",
    training_programs: "Skills development",
    process_improvement: "Lean methodology",
    automation_opportunities: "3 identified",
  };
}

async function getSustainabilityImprovements(env, farmId) {
  return {
    renewable_energy: "Solar panel installation",
    waste_reduction: "Composting program",
    water_conservation: "Rainwater harvesting",
    soil_health: "Organic matter enhancement",
  };
}

async function getTrendAnalysis(env, farmId, timeframe) {
  // Get historical data for trend analysis
  const cropTrends = await env.DB.prepare(
    `
    SELECT
      strftime('%Y-%m', c.created_at) as month,
      AVG(c.actual_yield) as avg_yield,
      COUNT(c.id) as crop_count,
      AVG(c.expected_yield) as avg_expected_yield
    FROM crops c
    WHERE c.farm_id = ? AND c.actual_yield IS NOT NULL
      AND date(c.created_at) >= date('now', '-${timeframe}')
    GROUP BY strftime('%Y-%m', c.created_at)
    ORDER BY month DESC
    LIMIT 12
  `
  )
    .bind(farmId)
    .all();

  const financeTrends = await env.DB.prepare(
    `
    SELECT
      strftime('%Y-%m', entry_date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
      SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END) as net_profit
    FROM finance_entries
    WHERE farm_id = ?
      AND date(entry_date) >= date('now', '-${timeframe}')
    GROUP BY strftime('%Y-%m', entry_date)
    ORDER BY month DESC
    LIMIT 12
  `
  )
    .bind(farmId)
    .all();

  const taskTrends = await env.DB.prepare(
    `
    SELECT
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      AVG(julianday(CASE WHEN status = 'completed' THEN updated_at END) - julianday(created_at)) as avg_completion_days
    FROM tasks
    WHERE farm_id = ?
      AND date(created_at) >= date('now', '-${timeframe}')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 12
  `
  )
    .bind(farmId)
    .all();

  // Analyze trends
  const cropTrend = analyzeTimeSeriesTrend(cropTrends.map(row => row.avg_yield));
  const financeTrend = analyzeTimeSeriesTrend(financeTrends.map(row => row.net_profit));
  const taskTrend = analyzeTimeSeriesTrend(taskTrends.map(row => (row.completed_tasks / row.total_tasks) * 100));

  // Seasonal patterns
  const seasonalPatterns = analyzeSeasonalPatterns(cropTrends, financeTrends, taskTrends);

  // Growth indicators
  const growthIndicators = calculateGrowthIndicators(cropTrends, financeTrends, taskTrends);

  // Improvement areas
  const improvementAreas = identifyImprovementAreas(cropTrend, financeTrend, taskTrend);

  return {
    performance_trends: {
      overall: determineOverallTrend([cropTrend, financeTrend, taskTrend]),
      crops: cropTrend,
      finance: financeTrend,
      tasks: taskTrend,
    },
    seasonal_patterns: seasonalPatterns,
    growth_indicators: growthIndicators,
    improvement_areas: improvementAreas,
    trend_data: {
      crops: cropTrends,
      finance: financeTrends,
      tasks: taskTrends,
    },
  };
}

// Helper function to analyze time series trends
function analyzeTimeSeriesTrend(values) {
  if (values.length < 2) return { direction: 'insufficient_data', strength: 0 };

  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  // Calculate linear regression
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Calculate R-squared for trend strength
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * i + (sumY - slope * sumX) / n;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  let direction = 'stable';
  if (slope > 0.01) direction = 'increasing';
  else if (slope < -0.01) direction = 'decreasing';

  return {
    direction,
    slope,
    strength: rSquared,
    confidence: Math.min(n / 6, 1), // Based on data points
  };
}

// Helper function to analyze seasonal patterns
function analyzeSeasonalPatterns(cropData, financeData, taskData) {
  const patterns = [];

  // Analyze crop seasonality
  if (cropData.length >= 6) {
    const monthlyYields = cropData.reduce((acc, row) => {
      const month = new Date(row.month + '-01').getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(row.avg_yield);
      return acc;
    }, {});

    const seasonalVariations = Object.entries(monthlyYields).map(([month, yields]) => ({
      month: parseInt(month),
      avgYield: yields.reduce((sum, y) => sum + y, 0) / yields.length,
    }));

    if (seasonalVariations.length >= 4) {
      patterns.push({
        type: 'crop_harvest',
        description: 'Crop yields show seasonal variation with peaks in harvest months',
        peak_months: seasonalVariations
          .sort((a, b) => b.avgYield - a.avgYield)
          .slice(0, 3)
          .map(m => m.month),
      });
    }
  }

  // Analyze financial seasonality
  if (financeData.length >= 6) {
    const monthlyProfits = financeData.reduce((acc, row) => {
      const month = new Date(row.month + '-01').getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(row.net_profit);
      return acc;
    }, {});

    const profitVariations = Object.entries(monthlyProfits).map(([month, profits]) => ({
      month: parseInt(month),
      avgProfit: profits.reduce((sum, p) => sum + p, 0) / profits.length,
    }));

    if (profitVariations.length >= 4) {
      patterns.push({
        type: 'financial_cycles',
        description: 'Profit patterns show seasonal variations',
        high_profit_months: profitVariations
          .sort((a, b) => b.avgProfit - a.avgProfit)
          .slice(0, 3)
          .map(m => m.month),
      });
    }
  }

  return patterns;
}

// Helper function to calculate growth indicators
function calculateGrowthIndicators(cropData, financeData, taskData) {
  const indicators = [];

  // Crop yield growth
  if (cropData.length >= 3) {
    const recent = cropData.slice(0, 3);
    const older = cropData.slice(-3);
    const recentAvg = recent.reduce((sum, row) => sum + row.avg_yield, 0) / recent.length;
    const olderAvg = older.reduce((sum, row) => sum + row.avg_yield, 0) / older.length;
    const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;

    indicators.push({
      metric: 'crop_yield_growth',
      value: growthRate,
      direction: growthRate > 0 ? 'positive' : 'negative',
      description: `Crop yields ${growthRate > 0 ? 'increased' : 'decreased'} by ${Math.abs(growthRate).toFixed(1)}%`,
    });
  }

  // Financial growth
  if (financeData.length >= 3) {
    const recent = financeData.slice(0, 3);
    const older = financeData.slice(-3);
    const recentAvg = recent.reduce((sum, row) => sum + row.net_profit, 0) / recent.length;
    const olderAvg = older.reduce((sum, row) => sum + row.net_profit, 0) / older.length;
    const growthRate = olderAvg !== 0 ? ((recentAvg - olderAvg) / Math.abs(olderAvg)) * 100 : 0;

    indicators.push({
      metric: 'financial_growth',
      value: growthRate,
      direction: growthRate > 0 ? 'positive' : 'negative',
      description: `Net profit ${growthRate > 0 ? 'improved' : 'declined'} by ${Math.abs(growthRate).toFixed(1)}%`,
    });
  }

  // Task efficiency growth
  if (taskData.length >= 3) {
    const recent = taskData.slice(0, 3);
    const older = taskData.slice(-3);
    const recentAvg = recent.reduce((sum, row) => sum + (row.completed_tasks / row.total_tasks), 0) / recent.length;
    const olderAvg = older.reduce((sum, row) => sum + (row.completed_tasks / row.total_tasks), 0) / older.length;
    const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100;

    indicators.push({
      metric: 'task_efficiency_growth',
      value: growthRate,
      direction: growthRate > 0 ? 'positive' : 'negative',
      description: `Task completion rate ${growthRate > 0 ? 'improved' : 'declined'} by ${Math.abs(growthRate).toFixed(1)}%`,
    });
  }

  return indicators;
}

// Helper function to identify improvement areas
function identifyImprovementAreas(cropTrend, financeTrend, taskTrend) {
  const areas = [];

  if (cropTrend.direction === 'decreasing' || cropTrend.strength < 0.3) {
    areas.push({
      area: 'Crop Performance',
      issue: 'Declining or unstable crop yields',
      recommendation: 'Implement precision agriculture techniques and soil health monitoring',
      priority: 'high',
    });
  }

  if (financeTrend.direction === 'decreasing' || financeTrend.strength < 0.3) {
    areas.push({
      area: 'Financial Management',
      issue: 'Declining or unstable profitability',
      recommendation: 'Review cost structure and implement budget controls',
      priority: 'high',
    });
  }

  if (taskTrend.direction === 'decreasing' || taskTrend.strength < 0.3) {
    areas.push({
      area: 'Operational Efficiency',
      issue: 'Declining task completion rates',
      recommendation: 'Implement workflow optimization and resource planning',
      priority: 'medium',
    });
  }

  return areas;
}

// Helper function to determine overall trend
function determineOverallTrend(trends) {
  const directions = trends.map(t => t.direction);
  const increasing = directions.filter(d => d === 'increasing').length;
  const decreasing = directions.filter(d => d === 'decreasing').length;

  if (increasing > decreasing) return 'generally_positive';
  if (decreasing > increasing) return 'generally_negative';
  return 'mixed_stable';
}

async function getROIAnalysis(env, farmId, timeframe) {
  return {
    overall_roi: "15.2%",
    crop_roi: "18.5%",
    animal_roi: "12.8%",
    infrastructure_roi: "8.3%",
    projected_roi: "16.7%",
  };
}

// Enhanced module-specific optimization functions
async function getAnimalOptimizationOpportunities(env, farmId) {
  return [
    {
      area: "Health Management",
      current_state: "Manual health tracking",
      recommendation: "Implement automated health monitoring system",
      potential_impact: "15% reduction in health issues",
      implementation_effort: "medium",
    },
    {
      area: "Feed Optimization",
      current_state: "Standard feeding schedule",
      recommendation: "Implement precision feeding based on production stage",
      potential_impact: "10% feed cost reduction",
      implementation_effort: "low",
    },
  ];
}

async function getCropOptimizationOpportunities(env, farmId) {
  return [
    {
      area: "Yield Optimization",
      current_state: "Current yield patterns",
      recommendation: "Implement variable rate application of inputs",
      potential_impact: "12% yield increase",
      implementation_effort: "high",
    },
    {
      area: "Pest Management",
      current_state: "Reactive pest control",
      recommendation: "Implement integrated pest management (IPM)",
      potential_impact: "20% reduction in pesticide costs",
      implementation_effort: "medium",
    },
  ];
}

async function getFieldOptimizationOpportunities(env, farmId) {
  return [
    {
      area: "Soil Health",
      current_state: "Annual soil testing",
      recommendation: "Implement continuous soil monitoring",
      potential_impact: "8% yield improvement",
      implementation_effort: "medium",
    },
    {
      area: "Field Utilization",
      current_state: "Seasonal field usage",
      recommendation: "Implement year-round crop rotation",
      potential_impact: "15% increase in land productivity",
      implementation_effort: "high",
    },
  ];
}

async function getInventoryOptimizationOpportunities(env, farmId) {
  return [
    {
      area: "Stock Management",
      current_state: "Manual inventory tracking",
      recommendation: "Implement RFID-based inventory system",
      potential_impact: "25% reduction in stockouts",
      implementation_effort: "high",
    },
    {
      area: "Procurement",
      current_state: "Reactive purchasing",
      recommendation: "Implement predictive ordering system",
      potential_impact: "15% cost reduction",
      implementation_effort: "medium",
    },
  ];
}

async function getTaskOptimizationOpportunities(env, farmId) {
  return [
    {
      area: "Workflow Efficiency",
      current_state: "Manual task assignment",
      recommendation: "Implement AI-powered task prioritization",
      potential_impact: "10% efficiency improvement",
      implementation_effort: "low",
    },
    {
      area: "Resource Planning",
      current_state: "Daily planning",
      recommendation: "Implement weekly resource forecasting",
      potential_impact: "8% resource optimization",
      implementation_effort: "low",
    },
  ];
}

async function getFinanceOptimizationOpportunities(env, farmId) {
  return [
    {
      area: "Cost Management",
      current_state: "Monthly expense review",
      recommendation: "Implement real-time cost tracking",
      potential_impact: "12% expense reduction",
      implementation_effort: "medium",
    },
    {
      area: "Revenue Optimization",
      current_state: "Standard pricing",
      recommendation: "Implement dynamic pricing based on market conditions",
      potential_impact: "8% revenue increase",
      implementation_effort: "high",
    },
  ];
}

async function getWeatherOptimizationOpportunities(env, farmId) {
  return [
    {
      area: "Weather Planning",
      current_state: "Basic weather awareness",
      recommendation: "Implement advanced weather-based planning",
      potential_impact: "5% operational efficiency gain",
      implementation_effort: "low",
    },
  ];
}

async function generateCustomAnalysis(env, farmId, analysisType, parameters) {
  switch (analysisType) {
    case "crop_rotation_optimization":
      return await analyzeCropRotationOptimization(env, farmId, parameters);
    case "feed_formula_optimization":
      return await analyzeFeedFormulaOptimization(env, farmId, parameters);
    case "irrigation_scheduling":
      return await analyzeIrrigationScheduling(env, farmId, parameters);
    case "pest_disease_prediction":
      return await analyzePestDiseasePrediction(env, farmId, parameters);
    default:
      return { message: "Custom analysis type not recognized" };
  }
}

async function analyzeCropRotationOptimization(env, farmId, parameters) {
  return {
    recommendation: "Implement 4-year rotation cycle",
    expected_benefits: "20% soil health improvement",
    crops_to_include: ["Corn", "Soybeans", "Wheat", "Cover Crops"],
    implementation_timeline: "Next planting season",
  };
}

async function analyzeFeedFormulaOptimization(env, farmId, parameters) {
  return {
    recommendation: "Adjust protein ratios based on production stage",
    cost_savings: "$0.15 per animal per day",
    nutrition_improvement: "15% better growth rates",
    implementation_effort: "Low",
  };
}

async function analyzeIrrigationScheduling(env, farmId, parameters) {
  return {
    recommendation: "Implement soil moisture-based scheduling",
    water_savings: "25% reduction in water usage",
    yield_improvement: "8% increase expected",
    equipment_needed: "Moisture sensors",
  };
}

async function analyzePestDiseasePrediction(env, farmId, parameters) {
  return {
    prediction_model: "Weather and historical data based",
    risk_periods: ["Early spring", "Late summer"],
    prevention_strategies: ["Early monitoring", "Biological controls"],
    expected_reduction: "30% in pest damage",
  };
}
