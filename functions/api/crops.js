import { AuthUtils, createUnauthorizedResponse, createErrorResponse, createSuccessResponse } from './_auth.js';

// Forward requests to the main crops functionality
export async function onRequest(context) {
  const { request, env } = context;
  
  // Import the main crops functionality
  const { onRequest: mainCropsHandler } = await import('./crops-main.js');
  return mainCropsHandler(context);
}

// Additional endpoint routing for crops sub-resources
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Route to specific functionality based on action parameter
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'overview':
        return handleCropOverview(body, env, user, auth);
      case 'health':
        return handleCropHealth(body, env, user, auth);
      case 'yield_prediction':
        return handleYieldPrediction(body, env, user, auth);
      default:
        return createErrorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Crops action handler error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

async function handleCropOverview(body, env, user, auth) {
  const { farm_id } = body;

  if (!farm_id) {
    return createErrorResponse('Farm ID required', 400);
  }

  try {
    // Check access to farm
    if (!await auth.hasFarmAccess(user.id, farm_id)) {
      return createErrorResponse('Farm access denied', 403);
    }

    const { results, error } = await env.DB.prepare(`
      SELECT 
        COUNT(*) as active_crops,
        COALESCE((SELECT COUNT(*) FROM crops WHERE farm_id = ? AND health_status = 'excellent'), 0) as healthy_crops,
        COALESCE((SELECT COUNT(*) FROM irrigation_schedules WHERE farm_id = ? AND is_active = 1), 0) as irrigation_systems,
        COALESCE((SELECT COUNT(*) FROM crop_pest_issues WHERE farm_id = ? AND status = 'active'), 0) as active_pest_issues,
        COALESCE((SELECT AVG(soil_health_score) FROM soil_analysis WHERE field_id IN 
          (SELECT id FROM fields WHERE farm_id = ?)), 0) as soil_health_score
      FROM crops
      WHERE farm_id = ? AND status = 'active'
    `).bind(farm_id, farm_id, farm_id, farm_id, farm_id).all();

    if (error) {
      console.error('Database error:', error);
      return createErrorResponse('Database error', 500);
    }

    const overview = results[0] || {};
    
    // Get recent activity
    const { results: recentActivity } = await env.DB.prepare(`
      SELECT 
        ca.*,
        c.crop_type,
        f.name as field_name
      FROM crop_activities ca
      JOIN crops c ON ca.crop_id = c.id
      JOIN fields f ON c.field_id = f.id
      WHERE c.farm_id = ?
      ORDER BY ca.activity_date DESC
      LIMIT 5
    `).bind(farm_id).all();

    // Get upcoming tasks
    const { results: upcomingTasks } = await env.DB.prepare(`
      SELECT 
        t.*,
        c.crop_type,
        f.name as field_name
      FROM tasks t
      LEFT JOIN crops c ON t.target_id = CAST(c.id AS TEXT) AND t.target_type = 'crop'
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE t.farm_id = ? AND t.status = 'pending' AND t.due_date <= date('now', '+30 days')
      ORDER BY t.due_date ASC
      LIMIT 5
    `).bind(farm_id).all();

    return createSuccessResponse({
      ...overview,
      recent_activity: recentActivity || [],
      upcoming_tasks: upcomingTasks || []
    });
  } catch (error) {
    console.error('Crop overview error:', error);
    return createErrorResponse('Failed to get crop overview', 500);
  }
}

async function handleCropHealth(body, env, user, auth) {
  const { farm_id } = body;

  if (!farm_id) {
    return createErrorResponse('Farm ID required', 400);
  }

  try {
    if (!await auth.hasFarmAccess(user.id, farm_id)) {
      return createErrorResponse('Farm access denied', 403);
    }

    // Get detailed health status
    const { results: healthData } = await env.DB.prepare(`
      SELECT 
        c.id,
        c.crop_type,
        c.crop_variety,
        c.health_status,
        c.last_inspection_date,
        f.name as field_name,
        COALESCE((SELECT COUNT(*) FROM crop_observations 
          WHERE crop_id = c.id AND DATE(observation_date) >= DATE('now', '-7 days')), 0) as recent_observations
      FROM crops c
      JOIN fields f ON c.field_id = f.id
      WHERE c.farm_id = ?
      ORDER BY c.health_status DESC, c.last_inspection_date DESC
    `).bind(farm_id).all();

    // Generate alerts for crops needing attention
    const alerts = [];
    healthData.forEach(crop => {
      if (crop.health_status === 'poor') {
        alerts.push({
          type: 'health_issue',
          crop: crop.crop_type,
          message: `${crop.crop_type} in ${crop.field_name} requires immediate attention`,
          priority: 'high'
        });
      }
      
      if (!crop.last_inspection_date || 
          (new Date() - new Date(crop.last_inspection_date)) / (1000 * 60 * 60 * 24) > 14) {
        alerts.push({
          type: 'inspection_due',
          crop: crop.crop_type,
          message: `${crop.crop_type} inspection overdue`,
          priority: 'medium'
        });
      }
    });

    return createSuccessResponse({
      crops: healthData,
      alerts
    });
  } catch (error) {
    console.error('Crop health error:', error);
    return createErrorResponse('Failed to get crop health data', 500);
  }
}

async function handleYieldPrediction(body, env, user, auth) {
  const { farm_id } = body;

  if (!farm_id) {
    return createErrorResponse('Farm ID required', 400);
  }

  try {
    if (!await auth.hasFarmAccess(user.id, farm_id)) {
      return createErrorResponse('Farm access denied', 403);
    }

    // Get crops with yield data for prediction
    const { results: crops } = await env.DB.prepare(`
      SELECT 
        c.id,
        c.crop_type,
        c.planting_date,
        c.expected_yield,
        c.actual_yield,
        f.name as field_name,
        f.area_hectares,
        COALESCE((SELECT AVG(yield_per_hectare) FROM crop_yield_records 
          WHERE crop_id = c.id), 0) as historical_avg_yield
      FROM crops c
      JOIN fields f ON c.field_id = f.id
      WHERE c.farm_id = ? AND c.status = 'active'
    `).bind(farm_id).all();

    // Generate yield predictions based on historical data and growth stage
    const predictions = crops.map(crop => {
      const plantingDate = new Date(crop.planting_date);
      const daysSincePlanting = (new Date() - plantingDate) / (1000 * 60 * 60 * 24);
      const growthStage = getGrowthStage(crop.crop_type, daysSincePlanting);
      
      let predictionConfidence = 0.7; // Base confidence
      let predictedYield = crop.expected_yield;
      
      // Adjust based on historical performance
      if (crop.historical_avg_yield > 0) {
        const performanceRatio = crop.actual_yield / crop.historical_avg_yield;
        predictedYield = crop.expected_yield * performanceRatio;
        predictionConfidence = Math.min(0.9, 0.5 + (performanceRatio * 0.4));
      }

      return {
        ...crop,
        growth_stage: growthStage,
        predicted_yield: Math.round(predictedYield),
        prediction_confidence: Math.round(predictionConfidence * 100),
        harvest_ready_days: Math.max(0, 90 - daysSincePlanting) // Rough estimate
      };
    });

    return createSuccessResponse({ predictions });
  } catch (error) {
    console.error('Yield prediction error:', error);
    return createErrorResponse('Failed to generate yield predictions', 500);
  }
}

function getGrowthStage(cropType, daysSincePlanting) {
  const cropTypeLower = cropType.toLowerCase();
  
  if (cropTypeLower.includes('corn') || cropTypeLower.includes('maize')) {
    if (daysSincePlanting < 21) return 'germination';
    if (daysSincePlanting < 45) return 'seedling';
    if (daysSincePlanting < 70) return 'vegetative';
    if (daysSincePlanting < 90) return 'flowering';
    return 'mature';
  } else if (cropTypeLower.includes('tomato')) {
    if (daysSincePlanting < 14) return 'germination';
    if (daysSincePlanting < 35) return 'seedling';
    if (daysSincePlanting < 60) return 'flowering';
    return 'fruiting';
  } else {
    // Default growth stages
    if (daysSincePlanting < 30) return 'germination';
    if (daysSincePlanting < 60) return 'growing';
    if (daysSincePlanting < 90) return 'flowering';
    return 'mature';
  }
}