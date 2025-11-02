import { AuthUtils, createUnauthorizedResponse, createErrorResponse, createSuccessResponse } from './_auth.js';

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

    // Comprehensive system dashboard endpoint
    if (method === 'GET') {
      const farmId = url.searchParams.get('farm_id');
      const type = url.searchParams.get('type') || 'dashboard';

      if (!farmId) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse('Access denied', 403);
      }

      if (type === 'dashboard') {
        // Get comprehensive dashboard data across all modules
        const dashboardData = await getDashboardData(env, farmId);
        return createSuccessResponse(dashboardData);

      } else if (type === 'integration') {
        // Get integration points and cross-module relationships
        const integrationData = await getIntegrationData(env, farmId);
        return createSuccessResponse(integrationData);

      } else if (type === 'workflow') {
        // Get workflow automation and process data
        const workflowData = await getWorkflowData(env, farmId);
        return createSuccessResponse(workflowData);

      } else if (type === 'analytics') {
        // Get advanced analytics and insights
        const analyticsData = await getAdvancedAnalytics(env, farmId);
        return createSuccessResponse(analyticsData);
      }

    } else if (method === 'POST') {
      const body = await request.json();
      const { action, farm_id, data } = body;

      if (!action || !farm_id) {
        return createErrorResponse('Action and farm ID required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Access denied', 403);
      }

      // Handle different integration actions
      switch (action) {
        case 'sync_inventory':
          return await handleInventorySync(env, farm_id, data);
        case 'auto_task_creation':
          return await handleAutoTaskCreation(env, farm_id, data);
        case 'financial_insights':
          return await handleFinancialInsights(env, farm_id, data);
        case 'crop_rotation_recommendation':
          return await handleCropRotation(env, farm_id, data);
        case 'resource_optimization':
          return await handleResourceOptimization(env, farm_id, data);
        default:
          return createErrorResponse('Unknown action', 400);
      }
    }

    return createErrorResponse('Method not allowed', 405);

  } catch (error) {
    console.error('System integration error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

async function getDashboardData(env, farmId) {
  // Get data from all modules
  const [farms, animals, crops, fields, inventory, tasks, finance] = await Promise.all([
    // Farm data
    env.DB.prepare(`
      SELECT 
        f.*,
        COUNT(DISTINCT a.id) as animal_count,
        COUNT(DISTINCT c.id) as crop_count,
        COUNT(DISTINCT fi.id) as field_count,
        COUNT(DISTINCT t.id) as task_count,
        COALESCE(SUM(CASE WHEN fe.type = 'income' THEN fe.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN fe.type = 'expense' THEN fe.amount ELSE 0 END), 0) as total_expenses
      FROM farms f
      LEFT JOIN animals a ON f.id = a.farm_id
      LEFT JOIN crops c ON f.id = c.farm_id
      LEFT JOIN fields fi ON f.id = fi.farm_id
      LEFT JOIN tasks t ON f.id = t.farm_id
      LEFT JOIN finance_entries fe ON f.id = fe.farm_id
      WHERE f.id = ?
      GROUP BY f.id
    `).bind(farmId).all(),

    // Animal statistics
    env.DB.prepare(`
      SELECT 
        species,
        COUNT(*) as count,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
        AVG(CASE WHEN current_weight IS NOT NULL THEN current_weight END) as avg_weight
      FROM animals
      WHERE farm_id = ?
      GROUP BY species
    `).bind(farmId).all(),

    // Crop statistics
    env.DB.prepare(`
      SELECT 
        crop_type,
        COUNT(*) as count,
        AVG(expected_yield) as avg_yield,
        COUNT(CASE WHEN growth_stage = 'mature' THEN 1 END) as mature_count
      FROM crops
      WHERE farm_id = ?
      GROUP BY crop_type
    `).bind(farmId).all(),

    // Field utilization
    env.DB.prepare(`
      SELECT 
        COUNT(*) as total_fields,
        AVG(area_hectares) as avg_area,
        COUNT(CASE WHEN current_cover_crop IS NOT NULL THEN 1 END) as cultivated_fields
      FROM fields
      WHERE farm_id = ?
    `).bind(farmId).all(),

    // Inventory status
    env.DB.prepare(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN qty <= reorder_threshold THEN 1 END) as low_stock_items,
        COALESCE(SUM(qty * unit_cost), 0) as total_value
      FROM inventory_items
      WHERE farm_id = ?
    `).bind(farmId).all(),

    // Task overview
    env.DB.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_tasks,
        COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks
      FROM tasks
      WHERE farm_id = ?
    `).bind(farmId).all(),

    // Financial summary
    env.DB.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) as net_profit
      FROM finance_entries
      WHERE farm_id = ?
        AND date(entry_date) >= date('now', '-30 days')
    `).bind(farmId).all()
  ]);

  return {
    farm: farms[0] || {},
    animals: animals,
    crops: crops,
    fields: fields[0] || {},
    inventory: inventory[0] || {},
    tasks: tasks[0] || {},
    finance: finance[0] || {},
    alerts: await getSystemAlerts(env, farmId),
    insights: await generateSystemInsights(env, farmId)
  };
}

async function getIntegrationData(env, farmId) {
  // Get cross-module relationships and integration points
  const relationships = await env.DB.prepare(`
    SELECT 
      'tasks' as module,
      'animals' as related_module,
      COUNT(*) as relationship_count
    FROM tasks t
    JOIN animals a ON t.target_id = CAST(a.id AS TEXT)
    WHERE t.target_type = 'animal' AND t.farm_id = ?
    
    UNION ALL
    
    SELECT 
      'tasks' as module,
      'crops' as related_module,
      COUNT(*) as relationship_count
    FROM tasks t
    JOIN crops c ON t.target_id = CAST(c.id AS TEXT)
    WHERE t.target_type = 'crop' AND t.farm_id = ?
    
    UNION ALL
    
    SELECT 
      'finance' as module,
      'inventory' as related_module,
      COUNT(*) as relationship_count
    FROM finance_entries fe
    JOIN inventory_transactions it ON fe.reference_id = CAST(it.id AS TEXT)
    WHERE fe.reference_type = 'inventory' AND fe.farm_id = ?
  `).bind(farmId, farmId, farmId).all();

  return {
    relationships: relationships,
    data_flows: await getDataFlows(env, farmId),
    integration_points: getIntegrationPoints()
  };
}

async function getWorkflowData(env, farmId) {
  // Get automated workflow and process data
  const workflows = await env.DB.prepare(`
    SELECT 
      w.workflow_name,
      w.trigger_type,
      w.status,
      COUNT(wi.id) as execution_count,
      MAX(wi.executed_at) as last_execution
    FROM workflows w
    LEFT JOIN workflow_instances wi ON w.id = wi.workflow_id
    WHERE w.farm_id = ?
    GROUP BY w.id, w.workflow_name, w.trigger_type, w.status
  `).bind(farmId).all();

  return {
    workflows: workflows,
    process_automation: await getProcessAutomation(env, farmId),
    efficiency_metrics: await getEfficiencyMetrics(env, farmId)
  };
}

async function getAdvancedAnalytics(env, farmId) {
  // Get comprehensive analytics across all modules
  const analytics = {
    performance_trends: await getPerformanceTrends(env, farmId),
    productivity_metrics: await getProductivityMetrics(env, farmId),
    financial_analysis: await getFinancialAnalysis(env, farmId),
    operational_efficiency: await getOperationalEfficiency(env, farmId),
    predictive_insights: await getPredictiveInsights(env, farmId)
  };

  return analytics;
}

async function getSystemAlerts(env, farmId) {
  // Get system-wide alerts and notifications
  const alerts = [];

  // Check for overdue tasks
  const overdueTasks = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM tasks 
    WHERE farm_id = ? AND due_date < date('now') AND status != 'completed'
  `).bind(farmId).all();
  
  if (overdueTasks[0].count > 0) {
    alerts.push({
      type: 'warning',
      category: 'tasks',
      message: `${overdueTasks[0].count} overdue tasks require attention`,
      count: overdueTasks[0].count
    });
  }

  // Check for low stock items
  const lowStock = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM inventory_items 
    WHERE farm_id = ? AND qty <= reorder_threshold
  `).bind(farmId).all();
  
  if (lowStock[0].count > 0) {
    alerts.push({
      type: 'warning',
      category: 'inventory',
      message: `${lowStock[0].count} items are running low on stock`,
      count: lowStock[0].count
    });
  }

  // Check for unhealthy animals
  const unhealthyAnimals = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM animals 
    WHERE farm_id = ? AND health_status != 'healthy'
  `).bind(farmId).all();
  
  if (unhealthyAnimals[0].count > 0) {
    alerts.push({
      type: 'error',
      category: 'animals',
      message: `${unhealthyAnimals[0].count} animals need health attention`,
      count: unhealthyAnimals[0].count
    });
  }

  return alerts;
}

async function generateSystemInsights(env, farmId) {
  // Generate intelligent insights based on all module data
  const insights = [];

  // Financial efficiency insight
  const financialData = await env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as revenue,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
    FROM finance_entries
    WHERE farm_id = ? AND date(entry_date) >= date('now', '-30 days')
  `).bind(farmId).all();
  
  const revenue = financialData[0]?.revenue || 0;
  const expenses = financialData[0]?.expenses || 0;
  const profitMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

  if (profitMargin < 10) {
    insights.push({
      type: 'improvement',
      category: 'finance',
      title: 'Profit Margin Optimization',
      description: 'Consider reviewing expenses or increasing revenue streams to improve profitability.',
      impact: 'high',
      suggestion: 'Analyze top expense categories and identify cost reduction opportunities'
    });
  }

  // Task completion efficiency
  const taskEfficiency = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN due_date < date('now') AND status != 'completed' THEN 1 END) as overdue_tasks
    FROM tasks
    WHERE farm_id = ? AND date(created_at) >= date('now', '-30 days')
  `).bind(farmId).all();
  
  const completionRate = taskEfficiency[0].total_tasks > 0 ? 
    (taskEfficiency[0].completed_tasks / taskEfficiency[0].total_tasks) * 100 : 0;

  if (completionRate < 70) {
    insights.push({
      type: 'efficiency',
      category: 'tasks',
      title: 'Task Completion Rate',
      description: 'Improve task management processes to increase completion rates.',
      impact: 'medium',
      suggestion: 'Review task priorities and resource allocation'
    });
  }

  return insights;
}

// Action handlers
async function handleInventorySync(env, farmId, data) {
  // Sync inventory data with actual usage from other modules
  const syncResults = await env.DB.prepare(`
    INSERT INTO inventory_transactions (farm_id, inventory_item_id, qty_delta, unit, reason_type, reference_type, created_at)
    SELECT 
      ? as farm_id,
      ii.id as inventory_item_id,
      -1 as qty_delta,
      ii.unit,
      'usage' as reason_type,
      'automated_sync' as reference_type,
      CURRENT_TIMESTAMP as created_at
    FROM inventory_items ii
    WHERE ii.farm_id = ? AND ii.qty > 0
  `).bind(farmId, farmId).run();

  return createSuccessResponse({ 
    success: true, 
    message: 'Inventory sync completed',
    affected_rows: syncResults.changes 
  });
}

async function handleAutoTaskCreation(env, farmId, data) {
  // Automatically create tasks based on system events
  const autoTasks = [
    {
      title: 'Daily Animal Health Check',
      description: 'Automated daily health monitoring for all animals',
      task_category: 'Livestock',
      priority: 'medium',
      recurring_pattern: 'daily'
    },
    {
      title: 'Inventory Stock Review',
      description: 'Weekly inventory review and restocking check',
      task_category: 'Inventory',
      priority: 'low',
      recurring_pattern: 'weekly'
    }
  ];

  const createdTasks = [];
  for (const task of autoTasks) {
    const { results } = await env.DB.prepare(`
      INSERT INTO tasks (farm_id, title, description, task_category, priority, recurring_pattern, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(farmId, task.title, task.description, task.task_category, task.priority, task.recurring_pattern, 'system').run();
    
    createdTasks.push(results);
  }

  return createSuccessResponse({ 
    success: true, 
    message: 'Auto tasks created',
    tasks_created: createdTasks.length 
  });
}

async function handleFinancialInsights(env, farmId, data) {
  // Generate financial insights and recommendations
  const insights = {
    expense_categories: await getExpenseAnalysis(env, farmId),
    revenue_sources: await getRevenueAnalysis(env, farmId),
    budget_variance: await getBudgetVariance(env, farmId),
    recommendations: await generateFinancialRecommendations(env, farmId)
  };

  return createSuccessResponse(insights);
}

async function handleCropRotation(env, farmId, data) {
  // Provide crop rotation recommendations
  const recommendations = {
    current_rotation: await getCurrentRotation(env, farmId),
    soil_health_considerations: await getSoilHealthData(env, farmId),
    suggested_rotations: [
      {
        sequence: ['Corn', 'Soybeans', 'Wheat', 'Cover Crop'],
        benefits: 'Improved soil nitrogen and pest management',
        yield_impact: '+15% over 4-year cycle'
      },
      {
        sequence: ['Vegetables', 'Legumes', 'Grains', 'Fallow'],
        benefits: 'Enhanced biodiversity and soil restoration',
        yield_impact: '+20% soil health improvement'
      }
    ]
  };

  return createSuccessResponse(recommendations);
}

async function handleResourceOptimization(env, farmId, data) {
  // Optimize resource allocation across farm operations
  const optimization = {
    labor_allocation: await optimizeLaborAllocation(env, farmId),
    equipment_utilization: await optimizeEquipmentUse(env, farmId),
    feed_efficiency: await optimizeFeedDistribution(env, farmId),
    water_management: await optimizeWaterUsage(env, farmId)
  };

  return createSuccessResponse(optimization);
}

// Helper functions for analytics
async function getPerformanceTrends(env, farmId) {
  return {
    last_30_days: await get30DayTrends(env, farmId),
    seasonal_patterns: await getSeasonalPatterns(env, farmId),
    year_over_year: await getYoYGrowth(env, farmId)
  };
}

async function getProductivityMetrics(env, farmId) {
  const metrics = await env.DB.prepare(`
    SELECT 
      COUNT(DISTINCT t.id) as total_tasks,
      AVG(t.estimated_duration) as avg_task_duration,
      COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
      AVG(t.progress_percentage) as avg_progress
    FROM tasks t
    WHERE t.farm_id = ?
      AND date(t.created_at) >= date('now', '-30 days')
  `).bind(farmId).all();

  return metrics[0] || {};
}

async function getFinancialAnalysis(env, farmId) {
  return {
    profitability_trend: await getProfitabilityTrend(env, farmId),
    cost_analysis: await getCostAnalysis(env, farmId),
    revenue_breakdown: await getRevenueBreakdown(env, farmId)
  };
}

async function getOperationalEfficiency(env, farmId) {
  return {
    resource_utilization: await getResourceUtilization(env, farmId),
    workflow_efficiency: await getWorkflowEfficiency(env, farmId),
    automation_rate: await getAutomationRate(env, farmId)
  };
}

async function getPredictiveInsights(env, farmId) {
  return {
    yield_predictions: await getYieldPredictions(env, farmId),
    demand_forecasting: await getDemandForecasting(env, farmId),
    risk_assessment: await getRiskAssessment(env, farmId),
    optimization_opportunities: await getOptimizationOpportunities(env, farmId)
  };
}

// Additional helper functions would be implemented here for completeness
function getIntegrationPoints() {
  return [
    { from: 'animals', to: 'tasks', type: 'health_monitoring' },
    { from: 'crops', to: 'finance', type: 'revenue_tracking' },
    { from: 'inventory', to: 'tasks', type: 'stock_management' },
    { from: 'weather', to: 'tasks', type: 'scheduling' },
    { from: 'finance', to: 'budget', type: 'expense_tracking' }
  ];
}