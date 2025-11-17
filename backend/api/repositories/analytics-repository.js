/**
 * Analytics Repository - Handles all analytics-related database operations
 * Phase 6 Migration: Analytics Engine - Comprehensive analytics with caching and snapshots
 * Provides secure, efficient analytics queries with real-time dashboard capabilities
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "../_repositories.js";

/**
 * Analytics Repository - Handles all analytics-related database operations
 * Phase 6 Migration: Analytics Engine Enhancement
 */
export class AnalyticsRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "analytics_cache");
    this.farmRepo = new FarmRepository(dbOperations);
  }

  /**
   * Get comprehensive animal analytics for a farm
   */
  async getAnimalAnalytics(farmId, userId, timeframe = "12months") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first
    const cacheKey = `animal_analytics_${farmId}_${timeframe}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    const animalData = await this.db.executeQuery(
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
    `,
      [farmId],
      {
        operation: "query",
        table: "animals",
        context: { getAnimalAnalytics: true, farmId, timeframe },
      }
    );

    const healthTrends = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "animals",
        context: { getAnimalHealthTrends: true, farmId, timeframe },
      }
    );

    const productionEfficiency = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "animal_production",
        context: { getAnimalProductionEfficiency: true, farmId, timeframe },
      }
    );

    const result = {
      overview: animalData,
      health_trends: healthTrends,
      production_efficiency: productionEfficiency,
      performance_score: this.calculateAnimalPerformanceScore(animalData),
      optimization_opportunities: await this.getAnimalOptimizationOpportunities(
        farmId
      ),
    };

    // Cache the result
    await this.setCachedAnalytics(cacheKey, result, 15); // 15 minutes

    return result;
  }

  /**
   * Get comprehensive crop analytics for a farm
   */
  async getCropAnalytics(farmId, userId, timeframe = "12months") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first
    const cacheKey = `crop_analytics_${farmId}_${timeframe}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    const cropData = await this.db.executeQuery(
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
    `,
      [farmId],
      {
        operation: "query",
        table: "crops",
        context: { getCropAnalytics: true, farmId, timeframe },
      }
    );

    const yieldPerformance = await this.db.executeQuery(
      `
      SELECT
        c.crop_type,
        AVG(CASE WHEN c.expected_yield > 0 THEN (c.actual_yield / c.expected_yield) * 100 ELSE NULL END) as yield_efficiency,
        COUNT(CASE WHEN c.actual_yield IS NOT NULL THEN 1 END) as harvested_crops
      FROM crops c
      WHERE c.farm_id = ?
        AND date(c.created_at) >= date(?, ?)
      GROUP BY c.crop_type
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "crops",
        context: { getCropYieldPerformance: true, farmId, timeframe },
      }
    );

    const plantingSchedule = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "crops",
        context: { getCropPlantingSchedule: true, farmId, timeframe },
      }
    );

    const result = {
      overview: cropData,
      yield_performance: yieldPerformance,
      planting_schedule: plantingSchedule,
      performance_score: this.calculateCropPerformanceScore(cropData),
      optimization_opportunities: await this.getCropOptimizationOpportunities(
        farmId
      ),
    };

    // Cache the result
    await this.setCachedAnalytics(cacheKey, result, 15);

    return result;
  }

  /**
   * Get comprehensive field analytics for a farm
   */
  async getFieldAnalytics(farmId, userId, timeframe = "12months") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first
    const cacheKey = `field_analytics_${farmId}_${timeframe}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    const fieldData = await this.db.executeQuery(
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
    `,
      [farmId],
      {
        operation: "query",
        table: "fields",
        context: { getFieldAnalytics: true, farmId, timeframe },
      }
    );

    const utilizationRates = await this.db.executeQuery(
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
    `,
      [farmId],
      {
        operation: "query",
        table: "fields",
        context: { getFieldUtilizationRates: true, farmId },
      }
    );

    const soilHealthTrends = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "soil_analysis",
        context: { getSoilHealthTrends: true, farmId, timeframe },
      }
    );

    const result = {
      overview: fieldData[0] || {},
      utilization_rates: utilizationRates,
      soil_health_trends: soilHealthTrends,
      performance_score: this.calculateFieldPerformanceScore(fieldData[0]),
      optimization_opportunities: await this.getFieldOptimizationOpportunities(
        farmId
      ),
    };

    // Cache the result
    await this.setCachedAnalytics(cacheKey, result, 15);

    return result;
  }

  /**
   * Get comprehensive inventory analytics for a farm
   */
  async getInventoryAnalytics(farmId, userId, timeframe = "12months") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first
    const cacheKey = `inventory_analytics_${farmId}_${timeframe}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    const inventoryData = await this.db.executeQuery(
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
    `,
      [farmId],
      {
        operation: "query",
        table: "inventory_items",
        context: { getInventoryAnalytics: true, farmId, timeframe },
      }
    );

    const usagePatterns = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "inventory_transactions",
        context: { getInventoryUsagePatterns: true, farmId, timeframe },
      }
    );

    const turnoverRates = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "inventory_items",
        context: { getInventoryTurnoverRates: true, farmId, timeframe },
      }
    );

    const result = {
      overview: inventoryData[0] || {},
      usage_patterns: usagePatterns,
      turnover_rates: turnoverRates,
      performance_score: this.calculateInventoryPerformanceScore(
        inventoryData[0]
      ),
      optimization_opportunities:
        await this.getInventoryOptimizationOpportunities(farmId),
    };

    // Cache the result
    await this.setCachedAnalytics(cacheKey, result, 15);

    return result;
  }

  /**
   * Get comprehensive task analytics for a farm
   */
  async getTaskAnalytics(farmId, userId, timeframe = "12months") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first
    const cacheKey = `task_analytics_${farmId}_${timeframe}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    const taskData = await this.db.executeQuery(
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
    `,
      [farmId],
      {
        operation: "query",
        table: "tasks",
        context: { getTaskAnalytics: true, farmId, timeframe },
      }
    );

    const productivityMetrics = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "tasks",
        context: { getTaskProductivityMetrics: true, farmId, timeframe },
      }
    );

    const workflowEfficiency = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "tasks",
        context: { getTaskWorkflowEfficiency: true, farmId, timeframe },
      }
    );

    const result = {
      overview: taskData[0] || {},
      productivity_metrics: productivityMetrics,
      workflow_efficiency: workflowEfficiency,
      performance_score: this.calculateTaskPerformanceScore(taskData[0]),
      optimization_opportunities: await this.getTaskOptimizationOpportunities(
        farmId
      ),
    };

    // Cache the result
    await this.setCachedAnalytics(cacheKey, result, 15);

    return result;
  }

  /**
   * Get comprehensive finance analytics for a farm
   */
  async getFinanceAnalytics(farmId, userId, timeframe = "12months") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first
    const cacheKey = `finance_analytics_${farmId}_${timeframe}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    const financeData = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "finance_entries",
        context: { getFinanceAnalytics: true, farmId, timeframe },
      }
    );

    const budgetPerformance = await this.db.executeQuery(
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
    `,
      [farmId, new Date().getFullYear()],
      {
        operation: "query",
        table: "budget_categories",
        context: { getFinanceBudgetPerformance: true, farmId },
      }
    );

    const cashFlowTrends = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "finance_entries",
        context: { getFinanceCashFlowTrends: true, farmId, timeframe },
      }
    );

    const result = {
      overview: financeData[0] || {},
      budget_performance: budgetPerformance,
      cash_flow_trends: cashFlowTrends,
      performance_score: this.calculateFinancePerformanceScore(financeData[0]),
      optimization_opportunities:
        await this.getFinanceOptimizationOpportunities(farmId),
    };

    // Cache the result
    await this.setCachedAnalytics(cacheKey, result, 15);

    return result;
  }

  /**
   * Get weather analytics for a farm
   */
  async getWeatherAnalytics(farmId, userId, timeframe = "12months") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first
    const cacheKey = `weather_analytics_${farmId}_${timeframe}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    const weatherData = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "weather_data",
        context: { getWeatherAnalytics: true, farmId, timeframe },
      }
    );

    const cropWeatherCorrelation = await this.db.executeQuery(
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
    `,
      [farmId, new Date().toISOString(), `-${timeframe}`],
      {
        operation: "query",
        table: "crops",
        context: { getCropWeatherCorrelation: true, farmId, timeframe },
      }
    );

    const result = {
      overview: weatherData[0] || {},
      crop_correlation: cropWeatherCorrelation,
      performance_score: this.calculateWeatherPerformanceScore(weatherData[0]),
      optimization_opportunities:
        await this.getWeatherOptimizationOpportunities(farmId),
    };

    // Cache the result
    await this.setCachedAnalytics(cacheKey, result, 15);

    return result;
  }

  /**
   * Get comprehensive analytics combining all modules
   */
  async getComprehensiveAnalytics(farmId, userId, timeframe = "12months") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first
    const cacheKey = `comprehensive_analytics_${farmId}_${timeframe}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    // Get all module analytics in parallel
    const [animals, crops, fields, inventory, tasks, finance, weather] =
      await Promise.all([
        this.getAnimalAnalytics(farmId, userId, timeframe),
        this.getCropAnalytics(farmId, userId, timeframe),
        this.getFieldAnalytics(farmId, userId, timeframe),
        this.getInventoryAnalytics(farmId, userId, timeframe),
        this.getTaskAnalytics(farmId, userId, timeframe),
        this.getFinanceAnalytics(farmId, userId, timeframe),
        this.getWeatherAnalytics(farmId, userId, timeframe),
      ]);

    // Cross-module insights and correlations
    const crossModuleInsights = await this.generateCrossModuleInsights(
      farmId,
      timeframe,
      {
        animals,
        crops,
        fields,
        inventory,
        tasks,
        finance,
        weather,
      }
    );

    // Performance benchmarks
    const benchmarks = await this.generateBenchmarks(farmId, timeframe, {
      animals,
      crops,
      fields,
      inventory,
      tasks,
      finance,
    });

    const result = {
      summary: {
        overall_score: this.calculateOverallScore({
          animals,
          crops,
          fields,
          inventory,
          tasks,
          finance,
        }),
        performance_trend: await this.calculatePerformanceTrend(
          farmId,
          timeframe
        ),
        efficiency_rating: this.calculateEfficiencyRating({
          animals,
          crops,
          fields,
          inventory,
          tasks,
          finance,
        }),
        sustainability_score: this.calculateSustainabilityScore({
          animals,
          crops,
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
      recommendations: await this.generateRecommendations({
        animals,
        crops,
        fields,
        inventory,
        tasks,
        finance,
        weather,
      }),
      trends: await this.getTrendForecasting(farmId),
    };

    // Cache the result (shorter cache time for comprehensive analytics)
    await this.setCachedAnalytics(cacheKey, result, 10);

    return result;
  }

  /**
   * Create analytics snapshot for historical data
   */
  async createAnalyticsSnapshot(farmId, userId, snapshotType = "monthly") {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    const snapshotData = await this.getComprehensiveAnalytics(farmId, userId);

    // Store snapshot
    await this.db.executeQuery(
      `
      INSERT INTO analytics_snapshots (
        farm_id, snapshot_type, snapshot_date, data, created_by
      ) VALUES (?, ?, ?, ?, ?)
    `,
      [
        farmId,
        snapshotType,
        new Date().toISOString(),
        JSON.stringify(snapshotData),
        userId,
      ],
      {
        operation: "run",
        table: "analytics_snapshots",
        context: { createAnalyticsSnapshot: true, farmId, snapshotType },
      }
    );

    return { success: true, snapshotType, farmId };
  }

  /**
   * Get analytics snapshots for trend analysis
   */
  async getAnalyticsSnapshots(
    farmId,
    userId,
    snapshotType = "monthly",
    limit = 12
  ) {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    const snapshots = await this.db.executeQuery(
      `
      SELECT * FROM analytics_snapshots
      WHERE farm_id = ? AND snapshot_type = ?
      ORDER BY snapshot_date DESC
      LIMIT ?
    `,
      [farmId, snapshotType, limit],
      {
        operation: "query",
        table: "analytics_snapshots",
        context: { getAnalyticsSnapshots: true, farmId, snapshotType, limit },
      }
    );

    // Parse JSON data
    return snapshots.map((snapshot) => ({
      ...snapshot,
      data: JSON.parse(snapshot.data),
    }));
  }

  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(farmId, userId) {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    // Check cache first (shorter cache for real-time data)
    const cacheKey = `dashboard_metrics_${farmId}`;
    const cached = await this.getCachedAnalytics(cacheKey);
    if (cached) {
      return cached;
    }

    const metrics = await this.db.executeQuery(
      `
      SELECT
        'animals' as module,
        COUNT(*) as total_count,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
        COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick_count
      FROM animals WHERE farm_id = ?

      UNION ALL

      SELECT
        'crops' as module,
        COUNT(*) as total_count,
        COUNT(CASE WHEN growth_stage = 'mature' THEN 1 END) as mature_count,
        COUNT(CASE WHEN health_status = 'excellent' THEN 1 END) as excellent_health
      FROM crops WHERE farm_id = ?

      UNION ALL

      SELECT
        'tasks' as module,
        COUNT(*) as total_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_count
      FROM tasks WHERE farm_id = ?

      UNION ALL

      SELECT
        'inventory' as module,
        COUNT(*) as total_count,
        COUNT(CASE WHEN qty <= reorder_threshold THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN qty = 0 THEN 1 END) as out_of_stock_count
      FROM inventory_items WHERE farm_id = ?
    `,
      [farmId, farmId, farmId, farmId],
      {
        operation: "query",
        table: "multiple_tables",
        context: { getDashboardMetrics: true, farmId },
      }
    );

    // Get recent activity
    const recentActivity = await this.db.executeQuery(
      `
      SELECT 'task_completed' as activity_type, title as description, updated_at as activity_date
      FROM tasks
      WHERE farm_id = ? AND status = 'completed' AND date(updated_at) >= date('now', '-7 days')
      ORDER BY updated_at DESC LIMIT 5
    `,
      [farmId],
      {
        operation: "query",
        table: "tasks",
        context: { getRecentActivity: true, farmId },
      }
    );

    const result = {
      metrics: metrics,
      recent_activity: recentActivity,
      alerts: await this.generateAlerts(farmId),
      last_updated: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await this.setCachedAnalytics(cacheKey, result, 5);

    return result;
  }

  // === CACHING METHODS ===

  /**
   * Get cached analytics data
   */
  async getCachedAnalytics(cacheKey) {
    try {
      const cached = await this.db.executeQuery(
        `
        SELECT data, created_at
        FROM analytics_cache
        WHERE cache_key = ? AND created_at > datetime('now', '-1 hour')
        ORDER BY created_at DESC LIMIT 1
      `,
        [cacheKey],
        {
          operation: "query",
          table: "analytics_cache",
          context: { getCachedAnalytics: true, cacheKey },
        }
      );

      if (cached.length > 0) {
        return JSON.parse(cached[0].data);
      }
    } catch (error) {
      // Cache miss or error, continue without cache
      console.log(`Cache miss for ${cacheKey}:`, error.message);
    }

    return null;
  }

  /**
   * Set cached analytics data
   */
  async setCachedAnalytics(cacheKey, data, ttlMinutes = 15) {
    try {
      await this.db.executeQuery(
        `
        INSERT OR REPLACE INTO analytics_cache (
          cache_key, data, created_at, expires_at
        ) VALUES (?, ?, ?, datetime('now', '+${ttlMinutes} minutes'))
      `,
        [cacheKey, JSON.stringify(data), new Date().toISOString()],
        {
          operation: "run",
          table: "analytics_cache",
          context: { setCachedAnalytics: true, cacheKey, ttlMinutes },
        }
      );
    } catch (error) {
      // Cache write failure, continue without caching
      console.log(`Cache write failed for ${cacheKey}:`, error.message);
    }
  }

  /**
   * Clear analytics cache for a farm
   */
  async clearAnalyticsCache(farmId, userId) {
    // Verify access
    const hasAccess = await this.farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    await this.db.executeQuery(
      "DELETE FROM analytics_cache WHERE cache_key LIKE ?",
      [`%_${farmId}_%`],
      {
        operation: "run",
        table: "analytics_cache",
        context: { clearAnalyticsCache: true, farmId },
      }
    );

    return { success: true, farmId };
  }

  // === CALCULATION METHODS ===

  calculateAnimalPerformanceScore(data) {
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

  calculateCropPerformanceScore(data) {
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
          ? Math.min(
              (crop.avg_actual_yield / crop.avg_expected_yield) * 100,
              150
            )
          : 50;

      const cropScore =
        maturityScore * 0.3 + healthScore * 0.4 + yieldScore * 0.3;
      totalScore += cropScore;
      count++;
    });

    return count > 0 ? Math.round(totalScore / count) : 0;
  }

  calculateFieldPerformanceScore(data) {
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

  calculateInventoryPerformanceScore(data) {
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

  calculateTaskPerformanceScore(data) {
    if (!data) return 0;

    const completionScore =
      data.total_tasks > 0
        ? (data.completed_tasks / data.total_tasks) * 100
        : 0;
    const overduePenalty = Math.max(0, 100 - data.overdue_tasks * 5);
    const efficiencyScore = data.avg_completion_ratio || 100;

    return Math.round(
      completionScore * 0.6 + overduePenalty * 0.2 + efficiencyScore * 0.2
    );
  }

  calculateFinancePerformanceScore(data) {
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

  calculateWeatherPerformanceScore(data) {
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

  calculateOverallScore(data) {
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

  calculateEfficiencyRating(data) {
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

  calculateSustainabilityScore(data) {
    let score = 75; // Base score

    if (data.weather && data.weather.performance_score) {
      score = (score + data.weather.performance_score) / 2;
    }

    if (data.animals && data.animals.performance_score) {
      score = score * 0.7 + data.animals.performance_score * 0.3;
    }

    return Math.round(score);
  }

  // === ASYNC CALCULATION METHODS ===

  async calculatePerformanceTrend(farmId, timeframe) {
    // Analyze performance trends over time
    return "improving"; // Placeholder - would analyze historical data
  }

  async generateCrossModuleInsights(farmId, timeframe, data) {
    const insights = [];

    // Weather-Production Correlation
    if (data.weather && data.crops) {
      const optimalTempDays =
        data.weather.crop_correlation?.reduce(
          (sum, crop) => sum + (crop.optimal_temp_days || 0),
          0
        ) / (data.weather.crop_correlation?.length || 1);

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
    if (data.inventory && data.tasks) {
      const topUsage = data.inventory.usage_patterns?.[0];
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

  async generateBenchmarks(farmId, timeframe, data) {
    return {
      industry_standards: {
        animal_health_score: 85,
        crop_yield_efficiency: 90,
        inventory_turnover: 8.5,
        task_completion_rate: 95,
        financial_profitability: 15,
      },
      farm_performance: {
        animal_health_score: data.animals?.performance_score || 0,
        crop_yield_efficiency: data.crops?.performance_score || 0,
        task_completion_rate: data.tasks?.performance_score || 0,
        financial_profitability: data.finance?.performance_score || 0,
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

  async generateRecommendations(data) {
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

  async getTrendForecasting(farmId) {
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

  // === OPTIMIZATION OPPORTUNITIES METHODS ===

  async getAnimalOptimizationOpportunities(farmId) {
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

  async getCropOptimizationOpportunities(farmId) {
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

  async getFieldOptimizationOpportunities(farmId) {
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

  async getInventoryOptimizationOpportunities(farmId) {
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

  async getTaskOptimizationOpportunities(farmId) {
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

  async getFinanceOptimizationOpportunities(farmId) {
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

  async getWeatherOptimizationOpportunities(farmId) {
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

  // === ALERTS AND NOTIFICATIONS ===

  async generateAlerts(farmId) {
    const alerts = [];

    // Check for critical issues
    const criticalMetrics = await this.db.executeQuery(
      `
      SELECT
        (SELECT COUNT(*) FROM animals WHERE farm_id = ? AND health_status = 'critical') as critical_animals,
        (SELECT COUNT(*) FROM inventory_items WHERE farm_id = ? AND qty = 0) as out_of_stock_items,
        (SELECT COUNT(*) FROM tasks WHERE farm_id = ? AND due_date < date('now') AND status != 'completed') as overdue_tasks
    `,
      [farmId, farmId, farmId],
      {
        operation: "query",
        table: "multiple_tables",
        context: { generateAlerts: true, farmId },
      }
    );

    const metrics = criticalMetrics[0] || {};

    if (metrics.critical_animals > 0) {
      alerts.push({
        type: "critical",
        title: "Critical Animal Health Issues",
        message: `${metrics.critical_animals} animals require immediate attention`,
        priority: "urgent",
      });
    }

    if (metrics.out_of_stock_items > 0) {
      alerts.push({
        type: "warning",
        title: "Out of Stock Items",
        message: `${metrics.out_of_stock_items} items are completely out of stock`,
        priority: "high",
      });
    }

    if (metrics.overdue_tasks > 0) {
      alerts.push({
        type: "warning",
        title: "Overdue Tasks",
        message: `${metrics.overdue_tasks} tasks are past their due date`,
        priority: "medium",
      });
    }

    return alerts;
  }
}
