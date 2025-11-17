// Pest & Disease Management API
// Manages pest issues, disease outbreaks, and prevention strategies

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
        case 'list_pests':
          return await listPestIssues(env, userId, body);
        case 'list_diseases':
          return await listDiseaseOutbreaks(env, userId, body);
        case 'create_issue':
          return await createIssue(env, userId, body);
        case 'update_issue':
          return await updateIssue(env, userId, body);
        case 'delete_issue':
          return await deleteIssue(env, userId, body.id);
        case 'prevention_calendar':
          return await getPreventionCalendar(env, userId, body.farm_id);
        case 'pest_predictions':
          return await getPestPredictions(env, userId, body.farm_id);
        case 'disease_risk_assessment':
          return await getDiseaseRiskAssessment(env, userId, body.farm_id);
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
    console.error('Pest & Disease API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function listPestIssues(env, userId, { farm_id, severity, status }) {
  // Check user access to farm
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env.DB.prepare(accessQuery)
    .bind(farm_id, userId)
    .all();

  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Build query with filters
  let query = `
    SELECT pi.*, f.name as field_name, c.crop_type
    FROM pest_issues pi
    JOIN fields f ON pi.field_id = f.id
    LEFT JOIN crops c ON pi.field_id = c.field_id AND c.status = 'active'
    WHERE pi.farm_id = ?
  `;
  const queryParams = [farm_id];

  if (severity) {
    query += ' AND pi.severity = ?';
    queryParams.push(severity);
  }

  if (status) {
    query += ' AND pi.status = ?';
    queryParams.push(status);
  }

  query += ' ORDER BY pi.discovery_date DESC';

  const { results: pestIssues } = await env.DB.prepare(query)
    .bind(...queryParams)
    .all();

  return new Response(JSON.stringify(pestIssues), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function listDiseaseOutbreaks(env, userId, { farm_id }) {
  // Check user access to farm
  const accessQuery = `
    SELECT id FROM farm_members
    WHERE farm_id = ? AND user_id = ?
  `;
  const { results: farmAccess } = await env.DB.prepare(accessQuery)
    .bind(farm_id, userId)
    .all();

  if (!farmAccess || farmAccess.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get disease outbreaks
  const query = `
    SELECT do.*, f.name as field_name, c.crop_type
    FROM disease_outbreaks do
    JOIN fields f ON do.field_id = f.id
    LEFT JOIN crops c ON do.field_id = c.field_id AND c.status = 'active'
    WHERE do.farm_id = ?
    ORDER BY do.outbreak_date DESC
  `;
  const { results: diseaseOutbreaks } = await env.DB.prepare(query)
    .bind(farm_id)
    .all();

  return new Response(JSON.stringify(diseaseOutbreaks), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function createIssue(env, userId, data) {
  const { farm_id, field_id, issue_type, ...issueData } = data;

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

  let insertQuery, insertParams;

  if (issue_type === 'pest') {
    insertQuery = `
      INSERT INTO pest_issues (
        farm_id, field_id, crop_type, pest_name, severity, affected_area_percent,
        discovery_date, status, description, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    insertParams = [
      farm_id,
      field_id,
      issueData.crop_type,
      issueData.pest_name,
      issueData.severity,
      issueData.affected_area_percent,
      issueData.discovery_date || new Date().toISOString(),
      issueData.status || 'active',
      issueData.description,
      userId
    ];
  } else {
    insertQuery = `
      INSERT INTO disease_outbreaks (
        farm_id, field_id, crop_type, disease_name, severity, affected_area_percent,
        outbreak_date, status, growth_stage, description, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    insertParams = [
      farm_id,
      field_id,
      issueData.crop_type,
      issueData.disease_name,
      issueData.severity,
      issueData.affected_area_percent,
      issueData.outbreak_date || new Date().toISOString(),
      issueData.status || 'monitoring',
      issueData.growth_stage,
      issueData.description,
      userId
    ];
  }

  const result = await env.DB.prepare(insertQuery)
    .bind(...insertParams)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to create issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Log the activity
  await logPestDiseaseActivity(env, result.meta.last_row_id, 'issue_created', {
    issue_type,
    ...issueData
  });

  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updateIssue(env, userId, data) {
  const { id, farm_id, issue_type, ...updates } = data;

  // Verify user access
  const tableName = issue_type === 'pest' ? 'pest_issues' : 'disease_outbreaks';
  const accessQuery = `
    SELECT pi.id FROM ${tableName} pi
    JOIN farm_members fm ON pi.farm_id = fm.farm_id
    WHERE pi.id = ? AND fm.user_id = ? AND pi.farm_id = ?
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

  // Update issue
  const updateFields = [];
  const updateValues = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && key !== 'id' && key !== 'farm_id' && key !== 'issue_type') {
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
    UPDATE ${tableName} 
    SET ${updateFields.join(', ')}, updated_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(...updateValues)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to update issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Log the activity
  await logPestDiseaseActivity(env, id, 'issue_updated', updates);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function deleteIssue(env, userId, issueId) {
  // Verify user access for pest issues
  const pestAccessQuery = `
    SELECT pi.id FROM pest_issues pi
    JOIN farm_members fm ON pi.farm_id = fm.farm_id
    WHERE pi.id = ? AND fm.user_id = ?
  `;
  const { results: pestAccess } = await env.DB.prepare(pestAccessQuery)
    .bind(issueId, userId)
    .all();

  // Verify user access for disease outbreaks
  const diseaseAccessQuery = `
    SELECT do.id FROM disease_outbreaks do
    JOIN farm_members fm ON do.farm_id = fm.farm_id
    WHERE do.id = ? AND fm.user_id = ?
  `;
  const { results: diseaseAccess } = await env.DB.prepare(diseaseAccessQuery)
    .bind(issueId, userId)
    .all();

  if ((!pestAccess || pestAccess.length === 0) && (!diseaseAccess || diseaseAccess.length === 0)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Determine which table to update
  const tableName = pestAccess && pestAccess.length > 0 ? 'pest_issues' : 'disease_outbreaks';

  // Soft delete by setting status to resolved/contained
  const statusField = tableName === 'pest_issues' ? 'status' : 'status';
  const newStatus = tableName === 'pest_issues' ? 'resolved' : 'contained';

  const updateQuery = `
    UPDATE ${tableName} 
    SET ${statusField} = ?, is_resolved = 1, updated_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(newStatus, issueId)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to delete issue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getPreventionCalendar(env, userId, farmId) {
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

  // Get upcoming prevention tasks
  const tasksQuery = `
    SELECT ppt.*, f.name as field_name
    FROM prevention_tasks ppt
    JOIN fields f ON ppt.field_id = f.id
    WHERE ppt.farm_id = ? AND ppt.scheduled_date >= date('now')
    ORDER BY ppt.scheduled_date ASC
    LIMIT 20
  `;
  const { results: upcoming } = await env.DB.prepare(tasksQuery)
    .bind(farmId)
    .all();

  // Generate seasonal prevention recommendations
  const currentMonth = new Date().getMonth();
  const seasonalRecommendations = generateSeasonalRecommendations(currentMonth);

  return new Response(JSON.stringify({
    upcoming: upcoming || [],
    seasonal_recommendations: seasonalRecommendations
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getPestPredictions(env, userId, farmId) {
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

  // Get current crop information
  const cropsQuery = `
    SELECT c.crop_type, f.name as field_name, c.growth_stage
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    WHERE c.farm_id = ? AND c.status = 'active'
  `;
  const { results: crops } = await env.DB.prepare(cropsQuery)
    .bind(farmId)
    .all();

  // Generate pest predictions based on crops and seasonal patterns
  const predictions = generatePestPredictions(crops);

  return new Response(JSON.stringify({
    predictions,
    risk_factors: analyzeRiskFactors(crops)
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getDiseaseRiskAssessment(env, userId, farmId) {
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

  // Get recent weather data for risk assessment
  const weatherQuery = `
    SELECT temperature_avg, humidity, precipitation_sum
    FROM weather_data wd
    JOIN farms f ON wd.farm_id = f.id
    WHERE f.id = ?
    ORDER BY wd.data_date DESC
    LIMIT 7
  `;
  const { results: weather } = await env.DB.prepare(weatherQuery)
    .bind(farmId)
    .all();

  // Get current crops for disease risk assessment
  const cropsQuery = `
    SELECT c.crop_type, f.name as field_name, c.planting_date
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    WHERE c.farm_id = ? AND c.status = 'active'
  `;
  const { results: crops } = await env.DB.prepare(cropsQuery)
    .bind(farmId)
    .all();

  // Generate disease risk assessment
  const riskAssessment = assessDiseaseRisk(weather, crops);

  return new Response(JSON.stringify({
    risk_assessment: riskAssessment,
    recommendations: generateDiseaseRecommendations(riskAssessment)
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions

async function logPestDiseaseActivity(env, issueId, action, details) {
  try {
    const insertQuery = `
      INSERT INTO pest_disease_logs (
        issue_id, action, details, logged_at
      ) VALUES (?, ?, ?, datetime('now'))
    `;

    await env.DB.prepare(insertQuery)
      .bind(issueId, action, JSON.stringify(details))
      .run();
  } catch (error) {
    console.warn('Failed to log pest disease activity:', error);
  }
}

function generateSeasonalRecommendations(month) {
  const recommendations = [];

  if (month >= 2 && month <= 4) { // Spring
    recommendations.push({
      task: 'Monitor for early season pests',
      timing: 'Weekly inspections',
      crops: ['All crops'],
      priority: 'medium'
    });
    recommendations.push({
      task: 'Apply preventive treatments',
      timing: 'Before flowering',
      crops: ['Fruit trees', 'Brassicas'],
      priority: 'high'
    });
  } else if (month >= 5 && month <= 7) { // Summer
    recommendations.push({
      task: 'Intensive pest monitoring',
      timing: 'Daily inspections',
      crops: ['All crops'],
      priority: 'high'
    });
    recommendations.push({
      task: 'Heat stress management',
      timing: 'Morning inspections',
      crops: ['Leafy greens', 'Lettuce'],
      priority: 'medium'
    });
  } else if (month >= 8 && month <= 10) { // Fall
    recommendations.push({
      task: 'Fall cleanup and prevention',
      timing: 'Before first frost',
      crops: ['All crops'],
      priority: 'high'
    });
  }

  return recommendations;
}

function generatePestPredictions(crops) {
  const predictions = [];

  crops.forEach(crop => {
    const pestRisks = getPestRisksForCrop(crop.crop_type);
    
    pestRisks.forEach(risk => {
      predictions.push({
        crop_type: crop.crop_type,
        field_name: crop.field_name,
        pest_name: risk.pest,
        risk_level: risk.risk_level,
        peak_period: risk.peak_period,
        prevention_actions: risk.prevention_actions
      });
    });
  });

  return predictions;
}

function getPestRisksForCrop(cropType) {
  const pestDatabase = {
    'tomato': [
      { pest: 'Aphids', risk_level: 'medium', peak_period: 'Spring-Summer', prevention_actions: ['Monitor new growth', 'Use beneficial insects'] },
      { pest: 'Hornworms', risk_level: 'high', peak_period: 'Summer', prevention_actions: ['Hand picking', 'BT spray'] },
      { pest: 'Whiteflies', risk_level: 'medium', peak_period: 'Summer-Fall', prevention_actions: ['Yellow sticky traps', 'Neem oil'] }
    ],
    'corn': [
      { pest: 'Corn borers', risk_level: 'high', peak_period: 'Summer', prevention_actions: ['Plant early varieties', 'Crop rotation'] },
      { pest: 'Aphids', risk_level: 'medium', peak_period: 'Spring-Summer', prevention_actions: ['Natural predators', 'Insecticidal soap'] }
    ],
    'beans': [
      { pest: 'Bean beetles', risk_level: 'high', peak_period: 'Summer', prevention_actions: ['Row covers', 'Early planting'] },
      { pest: 'Aphids', risk_level: 'low', peak_period: 'All season', prevention_actions: ['Monitor colonies', 'Beneficial insects'] }
    ],
    'cabbage': [
      { pest: 'Cabbage worms', risk_level: 'high', peak_period: 'Spring-Fall', prevention_actions: ['Floating row covers', 'BT spray'] },
      { pest: 'Aphids', risk_level: 'medium', peak_period: 'Summer', prevention_actions: ['Ladybugs', 'Water spray'] }
    ]
  };

  return pestDatabase[cropType.toLowerCase()] || [];
}

function analyzeRiskFactors(crops) {
  const riskFactors = [];

  // Check for high-risk crop combinations
  const cropTypes = [...new Set(crops.map(c => c.crop_type.toLowerCase()))];
  
  if (cropTypes.includes('tomato') && cropTypes.includes('cabbage')) {
    riskFactors.push({
      factor: 'Crop rotation gap',
      description: 'Both tomatoes and brassicas detected - consider rotation break',
      severity: 'medium'
    });
  }

  // Check growth stage vulnerabilities
  crops.forEach(crop => {
    if (crop.growth_stage === 'flowering') {
      riskFactors.push({
        factor: 'Flowering stage vulnerability',
        description: `${crop.crop_type} in flowering stage - high pest attraction`,
        severity: 'high',
        crop: crop.crop_type
      });
    }
  });

  return riskFactors;
}

function assessDiseaseRisk(weather, crops) {
  const riskFactors = [];
  let overallRisk = 'low';

  // Weather-based risk factors
  if (weather && weather.length > 0) {
    const avgTemp = weather.reduce((sum, w) => sum + (w.temperature_avg || 0), 0) / weather.length;
    const avgHumidity = weather.reduce((sum, w) => sum + (w.humidity || 0), 0) / weather.length;
    const totalPrecip = weather.reduce((sum, w) => sum + (w.precipitation_sum || 0), 0);

    if (avgTemp >= 18 && avgTemp <= 25 && avgHumidity > 80) {
      riskFactors.push('Optimal conditions for fungal diseases');
      overallRisk = 'high';
    } else if (avgTemp >= 20 && avgTemp <= 30 && avgHumidity > 70) {
      riskFactors.push('Moderate conditions for bacterial diseases');
      overallRisk = overallRisk === 'high' ? 'high' : 'medium';
    }

    if (totalPrecip > 50) {
      riskFactors.push('High rainfall - increased disease risk');
      overallRisk = 'medium';
    }
  }

  // Crop-based risk factors
  crops.forEach(crop => {
    const daysSincePlanting = crop.planting_date ? 
      Math.floor((Date.now() - new Date(crop.planting_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    if (daysSincePlanting > 30 && crop.crop_type.toLowerCase() === 'tomato') {
      riskFactors.push('Late season tomato disease risk (30+ days)');
      overallRisk = overallRisk === 'high' ? 'high' : 'medium';
    }
  });

  return {
    overall_risk: overallRisk,
    risk_factors: riskFactors,
    weather_conditions: weather ? {
      avg_temperature: Math.round((weather.reduce((sum, w) => sum + (w.temperature_avg || 0), 0) / weather.length) * 10) / 10,
      avg_humidity: Math.round((weather.reduce((sum, w) => sum + (w.humidity || 0), 0) / weather.length) * 10) / 10,
      total_precipitation: Math.round(weather.reduce((sum, w) => sum + (w.precipitation_sum || 0), 0) * 10) / 10
    } : null
  };
}

function generateDiseaseRecommendations(riskAssessment) {
  const recommendations = [];

  if (riskAssessment.overall_risk === 'high') {
    recommendations.push('Implement daily crop monitoring');
    recommendations.push('Apply preventive fungicide treatments');
    recommendations.push('Improve air circulation in crop areas');
    recommendations.push('Remove any diseased plant material immediately');
  } else if (riskAssessment.overall_risk === 'medium') {
    recommendations.push('Increase monitoring frequency to 2-3 times per week');
    recommendations.push('Ensure proper spacing between plants');
    recommendations.push('Avoid overhead watering');
  }

  if (riskAssessment.risk_factors.some(factor => factor.includes('rainfall'))) {
    recommendations.push('Consider switching to drip irrigation');
    recommendations.push('Improve field drainage');
  }

  recommendations.push('Use disease-resistant varieties for future plantings');
  recommendations.push('Practice crop rotation to break disease cycles');

  return recommendations;
}