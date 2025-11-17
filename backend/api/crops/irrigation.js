// Irrigation Optimization API
// Manages irrigation schedules, analytics, and water usage optimization

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  try {
    // Validate JWT authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify and extract user from token
    const { AuthUtils } = await import('../_auth.js');
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;

    if (method === 'POST') {
      const body = await request.json();
      const { action } = body;

      switch (action) {
        case 'list':
          return await listIrrigationSchedules(env, userId, body.farm_id);
        case 'create':
          return await createIrrigationSchedule(env, userId, body);
        case 'update':
          return await updateIrrigationSchedule(env, userId, body);
        case 'delete':
          return await deleteIrrigationSchedule(env, userId, body.id);
        case 'optimize':
          return await optimizeIrrigationSchedule(env, userId, body);
        case 'analytics':
          return await getIrrigationAnalytics(env, userId, body.farm_id);
        case 'recommendations':
          return await getIrrigationRecommendations(env, userId, body.farm_id);
        default:
          return new Response(JSON.stringify({ error: 'Invalid action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Irrigation API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function listIrrigationSchedules(env, userId, farmId) {
  // Check user access to farm
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env.DB.prepare(accessQuery)
    .bind(farmId, userId)
    .all();

  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get irrigation schedules
  const query = `
    SELECT irs.*, f.name as field_name, c.crop_type
    FROM irrigation_schedules irs
    JOIN fields f ON irs.field_id = f.id
    LEFT JOIN crops c ON irs.field_id = c.field_id AND c.status = 'active'
    WHERE irs.farm_id = ? AND irs.is_active = 1
    ORDER BY irs.next_watering_date ASC
  `;
  const { results: schedules } = await env.DB.prepare(query)
    .bind(farmId)
    .all();

  return new Response(JSON.stringify(schedules), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function createIrrigationSchedule(env, userId, data) {
  const { 
    farm_id, 
    field_id, 
    crop_type, 
    irrigation_type, 
    frequency_days, 
    duration_minutes,
    water_amount_liters,
    priority = 'medium',
    start_date 
  } = data;

  // Verify user access to farm and field
  const accessQuery = `
    SELECT fm.id FROM farm_members fm
    JOIN fields f ON fm.farm_id = f.farm_id
    WHERE fm.user_id = ? AND f.id = ? AND fm.farm_id = ?
  `;
  const { results: access } = await env.DB.prepare(accessQuery)
    .bind(userId, field_id, farm_id)
    .all();

  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Calculate next watering date
  const nextWateringDate = new Date(start_date || Date.now());
  nextWateringDate.setDate(nextWateringDate.getDate() + frequency_days);

  // Create irrigation schedule
  const insertQuery = `
    INSERT INTO irrigation_schedules (
      farm_id, field_id, crop_type, irrigation_type, frequency_days,
      duration_minutes, water_amount_liters, priority, next_watering_date,
      status, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'))
  `;

  const result = await env.DB.prepare(insertQuery)
    .bind(
      farm_id,
      field_id,
      crop_type,
      irrigation_type,
      frequency_days,
      duration_minutes,
      water_amount_liters,
      priority,
      nextWateringDate.toISOString(),
      userId
    )
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to create irrigation schedule' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Log the creation activity
  await logIrrigationActivity(env, result.meta.last_row_id, 'schedule_created', {
    crop_type,
    irrigation_type,
    frequency_days
  });

  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updateIrrigationSchedule(env, userId, data) {
  const { id, farm_id, ...updates } = data;

  // Verify user access
  const accessQuery = `
    SELECT irs.id FROM irrigation_schedules irs
    JOIN farm_members fm ON irs.farm_id = fm.farm_id
    WHERE irs.id = ? AND fm.user_id = ? AND irs.farm_id = ?
  `;
  const { results: access } = await env.DB.prepare(accessQuery)
    .bind(id, userId, farm_id)
    .all();

  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Update irrigation schedule
  const updateFields = [];
  const updateValues = [];
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(updates[key]);
    }
  });

  if (updateFields.length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  updateValues.push(id);
  const updateQuery = `
    UPDATE irrigation_schedules 
    SET ${updateFields.join(', ')}, updated_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(...updateValues)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to update irrigation schedule' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Log the update activity
  await logIrrigationActivity(env, id, 'schedule_updated', updates);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function deleteIrrigationSchedule(env, userId, scheduleId) {
  // Verify user access
  const accessQuery = `
    SELECT irs.id FROM irrigation_schedules irs
    JOIN farm_members fm ON irs.farm_id = fm.farm_id
    WHERE irs.id = ? AND fm.user_id = ?
  `;
  const { results: access } = await env.DB.prepare(accessQuery)
    .bind(scheduleId, userId)
    .all();

  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Deactivate irrigation schedule (soft delete)
  const updateQuery = `
    UPDATE irrigation_schedules 
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(scheduleId)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to delete irrigation schedule' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function optimizeIrrigationSchedule(env, userId, data) {
  const { schedule_id, farm_id, weather_data } = data;

  // Get the schedule
  const scheduleQuery = `
    SELECT irs.*, f.area_hectares, f.name as field_name
    FROM irrigation_schedules irs
    JOIN fields f ON irs.field_id = f.id
    WHERE irs.id = ? AND irs.farm_id = ?
  `;
  const { results: schedules } = await env.DB.prepare(scheduleQuery)
    .bind(schedule_id, farm_id)
    .all();

  if (!schedules || schedules.length === 0) {
    return new Response(JSON.stringify({ error: 'Schedule not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const schedule = schedules[0];

  // Calculate optimized parameters
  const optimizations = calculateOptimizations(schedule, weather_data);

  // Update the schedule with optimized values
  const updateQuery = `
    UPDATE irrigation_schedules 
    SET frequency_days = ?, duration_minutes = ?, water_amount_liters = ?,
        priority = ?, optimized_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(
      optimizations.frequency_days,
      optimizations.duration_minutes,
      optimizations.water_amount_liters,
      optimizations.priority,
      schedule_id
    )
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to optimize schedule' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Log the optimization activity
  await logIrrigationActivity(env, schedule_id, 'schedule_optimized', {
    optimizations,
    weather_impact: weather_data ? 'considered' : 'not_available'
  });

  return new Response(JSON.stringify({
    success: true,
    optimizations,
    savings: optimizations.savings
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getIrrigationAnalytics(env, userId, farmId) {
  // Check user access
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env.DB.prepare(accessQuery)
    .bind(farmId, userId)
    .all();

  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get current month water usage
  const waterUsageQuery = `
    SELECT 
      SUM(water_amount_liters) as total_water,
      AVG(water_amount_liters) as avg_water,
      COUNT(*) as total_schedules
    FROM irrigation_logs il
    JOIN irrigation_schedules irs ON il.schedule_id = irs.id
    WHERE irs.farm_id = ? AND il.log_date >= date('now', 'start of month')
  `;
  const { results: waterUsage } = await env.DB.prepare(waterUsageQuery)
    .bind(farmId)
    .all();

  // Calculate efficiency score
  const efficiencyQuery = `
    SELECT 
      AVG(CASE 
        WHEN irs.irrigation_type = 'drip' THEN 95
        WHEN irs.irrigation_type = 'sprinkler' THEN 80
        WHEN irs.irrigation_type = 'manual' THEN 70
        WHEN irs.irrigation_type = 'flood' THEN 60
        ELSE 75
      END) as avg_efficiency
    FROM irrigation_schedules irs
    WHERE irs.farm_id = ? AND irs.is_active = 1
  `;
  const { results: efficiency } = await env.DB.prepare(efficiencyQuery)
    .bind(farmId)
    .all();

  // Get upcoming schedules (next 7 days)
  const upcomingQuery = `
    SELECT irs.*, f.name as field_name, c.crop_type
    FROM irrigation_schedules irs
    JOIN fields f ON irs.field_id = f.id
    LEFT JOIN crops c ON irs.field_id = c.field_id AND c.status = 'active'
    WHERE irs.farm_id = ? AND irs.next_watering_date <= date('now', '+7 days')
      AND irs.is_active = 1 AND irs.status = 'active'
    ORDER BY irs.next_watering_date ASC
    LIMIT 10
  `;
  const { results: upcomingSchedules } = await env.DB.prepare(upcomingQuery)
    .bind(farmId)
    .all();

  // Calculate cost savings (estimated)
  const totalWater = waterUsage[0]?.total_water || 0;
  const avgEfficiency = efficiency[0]?.avg_efficiency || 75;
  const costSavings = Math.round((totalWater * (95 - avgEfficiency) / 100) * 0.002); // $0.002 per liter saved

  // Generate recommendations
  const recommendations = generateIrrigationRecommendations(waterUsage[0], efficiency[0]);

  const analytics = {
    total_water_usage: Math.round(totalWater || 0),
    efficiency_score: Math.round(avgEfficiency || 0),
    cost_savings: costSavings,
    next_schedules: upcomingSchedules || [],
    recommendations
  };

  return new Response(JSON.stringify(analytics), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getIrrigationRecommendations(env, userId, farmId) {
  // Get current irrigation setup
  const currentSetupQuery = `
    SELECT irs.irrigation_type, COUNT(*) as count, AVG(irs.frequency_days) as avg_frequency
    FROM irrigation_schedules irs
    WHERE irs.farm_id = ? AND irs.is_active = 1
    GROUP BY irs.irrigation_type
  `;
  const { results: setup } = await env.DB.prepare(currentSetupQuery)
    .bind(farmId)
    .all();

  // Get weather data for the farm location (if available)
  const weatherQuery = `
    SELECT wd.precipitation_sum, wd.temperature_avg
    FROM weather_data wd
    JOIN farms f ON wd.farm_id = f.id
    WHERE f.id = ?
    ORDER BY wd.data_date DESC
    LIMIT 7
  `;
  const { results: weather } = await env.DB.prepare(weatherQuery)
    .bind(farmId)
    .all();

  const recommendations = [];

  // Irrigation type recommendations
  const dripCount = setup.find(s => s.irrigation_type === 'drip')?.count || 0;
  const totalSchedules = setup.reduce((sum, s) => sum + s.count, 0);
  
  if (dripCount / totalSchedules < 0.3) {
    recommendations.push({
      type: 'efficiency',
      priority: 'high',
      message: 'Consider installing more drip irrigation systems (current: ' + Math.round(dripCount/totalSchedules*100) + '%)',
      benefit: 'Save 20-30% water usage',
      action: 'Upgrade to drip irrigation for high-value crops'
    });
  }

  // Frequency recommendations
  const avgFrequency = setup.reduce((sum, s) => sum + (s.avg_frequency * s.count), 0) / totalSchedules;
  if (avgFrequency < 2) {
    recommendations.push({
      type: 'frequency',
      priority: 'medium',
      message: 'Consider reducing irrigation frequency for water conservation',
      benefit: 'Reduce water usage while maintaining crop health',
      action: 'Implement soil moisture monitoring'
    });
  }

  // Weather-based recommendations
  if (weather && weather.length > 0) {
    const recentRain = weather.reduce((sum, w) => sum + (w.precipitation_sum || 0), 0);
    if (recentRain > 20) { // More than 20mm in last week
      recommendations.push({
        type: 'weather',
        priority: 'high',
        message: 'Recent rainfall detected - consider delaying irrigation',
        benefit: 'Save water and prevent over-watering',
        action: 'Reduce watering schedule for next 3-5 days'
      });
    }
  }

  // Seasonal recommendations
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 5 && currentMonth <= 8) { // Growing season
    recommendations.push({
      type: 'seasonal',
      priority: 'medium',
      message: 'Peak growing season - monitor water needs closely',
      benefit: 'Optimize crop yield during critical growth period',
      action: 'Increase monitoring frequency, adjust schedules as needed'
    });
  }

  return new Response(JSON.stringify({ recommendations }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions

function calculateOptimizations(schedule, weatherData) {
  const optimizations = {
    frequency_days: schedule.frequency_days,
    duration_minutes: schedule.duration_minutes,
    water_amount_liters: schedule.water_amount_liters,
    priority: schedule.priority,
    savings: { water: 0, cost: 0 }
  };

  // Weather-based optimization
  if (weatherData && weatherData.precipitation) {
    if (weatherData.precipitation > 15) {
      // Recent rain - delay irrigation
      optimizations.frequency_days = Math.ceil(schedule.frequency_days * 1.5);
      optimizations.savings.water = schedule.water_amount_liters * 0.3;
      optimizations.priority = 'low';
    } else if (weatherData.precipitation > 5) {
      // Some rain - slightly delay
      optimizations.frequency_days = Math.ceil(schedule.frequency_days * 1.2);
      optimizations.savings.water = schedule.water_amount_liters * 0.15;
    } else {
      // Dry conditions - maintain schedule
    }
  }

  // Crop-specific optimization
  const cropMultiplier = getCropWaterMultiplier(schedule.crop_type);
  optimizations.water_amount_liters = Math.round(schedule.water_amount_liters * cropMultiplier);

  // Calculate cost savings
  optimizations.savings.cost = Math.round(optimizations.savings.water * 0.002); // $0.002 per liter

  return optimizations;
}

function getCropWaterMultiplier(cropType) {
  const multipliers = {
    'corn': 1.2,
    'wheat': 0.9,
    'soybeans': 1.1,
    'tomato': 1.3,
    'potato': 1.0,
    'lettuce': 0.8,
    'cabbage': 1.0
  };

  return multipliers[cropType] || 1.0;
}

async function logIrrigationActivity(env, scheduleId, action, details) {
  try {
    const insertQuery = `
      INSERT INTO irrigation_logs (
        schedule_id, action, details, logged_at
      ) VALUES (?, ?, ?, datetime('now'))
    `;

    await env.DB.prepare(insertQuery)
      .bind(scheduleId, action, JSON.stringify(details))
      .run();
  } catch (error) {
    console.warn('Failed to log irrigation activity:', error);
  }
}

function generateIrrigationRecommendations(waterUsage, efficiency) {
  const recommendations = [];

  if (!waterUsage || waterUsage.total_schedules === 0) {
    recommendations.push('No irrigation data available. Consider setting up irrigation schedules.');
    return recommendations;
  }

  if (efficiency && efficiency.avg_efficiency < 70) {
    recommendations.push('System efficiency is below optimal. Consider upgrading to drip irrigation.');
  }

  if (waterUsage.avg_water > 500) {
    recommendations.push('High water usage detected. Review irrigation schedules for optimization opportunities.');
  }

  if (waterUsage.total_schedules > 20) {
    recommendations.push('Multiple irrigation schedules detected. Consider consolidating for better efficiency.');
  }

  recommendations.push('Monitor soil moisture before each irrigation cycle.');
  recommendations.push('Consider installing weather-based automatic adjustments.');
  recommendations.push('Use mulch to reduce evaporation and water requirements.');

  return recommendations;
}