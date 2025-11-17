// Crop Rotation Planning API
// Manages crop rotation plans, health checks, and recommendations

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
          return await listRotationPlans(env, userId, body.farm_id);
        case 'create':
          return await createRotationPlan(env, userId, body);
        case 'update':
          return await updateRotationPlan(env, userId, body);
        case 'delete':
          return await deleteRotationPlan(env, userId, body.id);
        case 'recommendations':
          return await getRotationRecommendations(env, userId, body.farm_id);
        case 'health_check':
          return await performRotationHealthCheck(env, userId, body.rotation_id);
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
    console.error('Crop rotation API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function listRotationPlans(env, userId, farmId) {
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

  // Get rotation plans
  const query = `
    SELECT crp.*, f.name as field_name
    FROM crop_rotation_plans crp
    JOIN fields f ON crp.field_id = f.id
    WHERE crp.farm_id = ?
    ORDER BY crp.created_at DESC
  `;
  const { results: plans } = await env.DB.prepare(query)
    .bind(farmId)
    .all();

  // Parse crop sequences
  const plansWithSequences = plans.map(plan => ({
    ...plan,
    crop_sequence: JSON.parse(plan.crop_sequence)
  }));

  return new Response(JSON.stringify(plansWithSequences), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function createRotationPlan(env, userId, data) {
  const { farm_id, field_id, crop_sequence } = data;

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

  // Check if rotation plan already exists for this field
  const existingQuery = `
    SELECT id FROM crop_rotation_plans 
    WHERE field_id = ? AND is_active = 1
  `;
  const { results: existing } = await env.DB.prepare(existingQuery)
    .bind(field_id)
    .all();

  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ error: 'Rotation plan already exists for this field' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate crop sequence
  const validationResult = validateCropSequence(crop_sequence);
  if (!validationResult.isValid) {
    return new Response(JSON.stringify({ 
      error: 'Invalid crop sequence',
      issues: validationResult.issues 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create rotation plan
  const insertQuery = `
    INSERT INTO crop_rotation_plans (
      farm_id, field_id, crop_sequence, notes, is_active, created_by, created_at
    ) VALUES (?, ?, ?, ?, 1, ?, datetime('now'))
  `;

  const result = await env.DB.prepare(insertQuery)
    .bind(
      farm_id,
      field_id,
      JSON.stringify(crop_sequence),
      data.notes || null,
      userId
    )
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to create rotation plan' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Perform initial health check
  const healthCheck = performRotationHealthCheckSync(crop_sequence);

  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id,
    health_check: healthCheck
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updateRotationPlan(env, userId, data) {
  const { id, farm_id, crop_sequence, notes, status } = data;

  // Verify user access
  const accessQuery = `
    SELECT crp.id FROM crop_rotation_plans crp
    JOIN farm_members fm ON crp.farm_id = fm.farm_id
    WHERE crp.id = ? AND fm.user_id = ? AND crp.farm_id = ?
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

  // Update rotation plan
  const updateQuery = `
    UPDATE crop_rotation_plans 
    SET crop_sequence = ?, notes = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(JSON.stringify(crop_sequence), notes, status, id)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to update rotation plan' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function deleteRotationPlan(env, userId, planId) {
  // Verify user access
  const accessQuery = `
    SELECT crp.id FROM crop_rotation_plans crp
    JOIN farm_members fm ON crp.farm_id = fm.farm_id
    WHERE crp.id = ? AND fm.user_id = ?
  `;
  const { results: access } = await env.DB.prepare(accessQuery)
    .bind(planId, userId)
    .all();

  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Deactivate rotation plan (soft delete)
  const updateQuery = `
    UPDATE crop_rotation_plans 
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(planId)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to delete rotation plan' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getRotationRecommendations(env, userId, farmId) {
  // Get crop types grown on the farm
  const cropQuery = `
    SELECT DISTINCT crop_type, field_id, f.name as field_name
    FROM crops c
    JOIN fields f ON c.field_id = f.id
    WHERE c.farm_id = ?
    ORDER BY c.planting_date DESC
  `;
  const { results: farmCrops } = await env.DB.prepare(cropQuery)
    .bind(farmId)
    .all();

  // Generate recommendations based on current crops
  const recommendations = generateRotationRecommendations(farmCrops);

  return new Response(JSON.stringify({
    current_crops: farmCrops,
    recommendations: recommendations
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function performRotationHealthCheck(env, userId, rotationId) {
  // Get rotation plan
  const planQuery = `
    SELECT crp.*, f.name as field_name
    FROM crop_rotation_plans crp
    JOIN fields f ON crp.field_id = f.id
    WHERE crp.id = ?
  `;
  const { results: plans } = await env.DB.prepare(planQuery)
    .bind(rotationId)
    .all();

  if (!plans || plans.length === 0) {
    return new Response(JSON.stringify({ error: 'Rotation plan not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const plan = plans[0];
  const cropSequence = JSON.parse(plan.crop_sequence);
  const healthCheck = performRotationHealthCheckSync(cropSequence);

  return new Response(JSON.stringify(healthCheck), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions

function validateCropSequence(cropSequence) {
  const issues = [];
  
  if (!Array.isArray(cropSequence) || cropSequence.length === 0) {
    issues.push('Crop sequence must be a non-empty array');
    return { isValid: false, issues };
  }

  // Check for missing required fields
  for (let i = 0; i < cropSequence.length; i++) {
    const crop = cropSequence[i];
    if (!crop.year || !crop.crop_type) {
      issues.push(`Crop ${i + 1}: Missing required fields (year, crop_type)`);
    }
    if (crop.planting_date && crop.harvest_date) {
      if (new Date(crop.harvest_date) <= new Date(crop.planting_date)) {
        issues.push(`Crop ${i + 1}: Harvest date must be after planting date`);
      }
    }
  }

  return { isValid: issues.length === 0, issues };
}

function performRotationHealthCheckSync(cropSequence) {
  const issues = [];
  const recommendations = [];
  const score = { soilHealth: 0, diseasePrevention: 0, nutrientBalance: 0, overall: 0 };

  // Get crop families
  const cropFamilies = cropSequence.map(crop => getCropFamily(crop.crop_type));
  const familyCounts = cropFamilies.reduce((acc, family) => {
    acc[family] = (acc[family] || 0) + 1;
    return acc;
  }, {});

  // Check for disease prevention (no family repetition within 3 years)
  let diseaseScore = 100;
  for (const [family, count] of Object.entries(familyCounts)) {
    if (count > 1 && family !== 'Other') {
      const years = cropSequence.length;
      if (years <= 3 && count > 1) {
        issues.push(`${family} crops repeated within ${years}-year rotation (recommended: 3+ years)`);
        diseaseScore -= 30;
      } else if (count > 2) {
        issues.push(`Excessive ${family} crops in rotation`);
        diseaseScore -= 15;
      }
    }
  }

  // Check for nitrogen balance
  const legumeYears = cropSequence.filter(crop => getCropFamily(crop.crop_type) === 'Legumes').length;
  const totalYears = cropSequence.length;
  const legumeRatio = legumeYears / totalYears;

  if (legumeRatio < 0.2) {
    issues.push('Low nitrogen-fixing crops in rotation (recommended: 20-30%)');
    recommendations.push('Include more legumes (beans, peas, lentils) to improve soil nitrogen');
    score.soilHealth -= 20;
  } else if (legumeRatio > 0.5) {
    recommendations.push('Consider reducing legume percentage to balance with other crop types');
    score.soilHealth -= 10;
  } else {
    score.soilHealth += 30; // Good nitrogen balance
  }

  // Check for crop diversity
  const uniqueFamilies = new Set(cropFamilies).size;
  const diversityRatio = uniqueFamilies / totalYears;
  
  if (diversityRatio < 0.5) {
    issues.push('Low crop diversity in rotation');
    recommendations.push('Include more diverse crop families for better soil health');
    score.soilHealth -= 15;
  } else {
    score.soilHealth += 20; // Good diversity
  }

  // Check for grain inclusion
  const grainYears = cropSequence.filter(crop => getCropFamily(crop.crop_type) === 'Grains').length;
  const grainRatio = grainYears / totalYears;
  
  if (grainRatio === 0) {
    recommendations.push('Consider including grains to break disease cycles and build soil structure');
    score.diseasePrevention -= 10;
  } else {
    score.diseasePrevention += 15;
  }

  // Root crop check
  const rootYears = cropSequence.filter(crop => getCropFamily(crop.crop_type) === 'Root Crops').length;
  if (rootYears > 1 && rootYears / totalYears > 0.4) {
    recommendations.push('Consider alternating root crops with other types for better soil structure');
    score.soilHealth -= 10;
  }

  // Calculate overall score
  score.diseasePrevention = Math.max(0, diseaseScore);
  score.overall = Math.round((score.soilHealth + score.diseasePrevention + score.nutrientBalance) / 3);

  if (score.overall >= 80) {
    recommendations.push('Excellent rotation plan! This will maintain excellent soil health.');
  } else if (score.overall >= 60) {
    recommendations.push('Good rotation plan with minor improvements needed.');
  } else {
    recommendations.push('Rotation plan needs improvement for optimal soil health.');
  }

  return {
    score,
    issues,
    recommendations,
    cropFamilies: familyCounts,
    summary: {
      totalYears,
      legumeRatio: Math.round(legumeRatio * 100),
      diversityRatio: Math.round(diversityRatio * 100),
      grainRatio: Math.round(grainRatio * 100)
    }
  };
}

function generateRotationRecommendations(farmCrops) {
  const recommendations = [];
  
  if (farmCrops.length === 0) {
    recommendations.push({
      type: 'first_rotation',
      message: 'No crops found on farm. Consider starting with a basic 3-year rotation: Corn → Beans → Wheat',
      crops: ['corn', 'beans', 'wheat']
    });
    return recommendations;
  }

  const currentCrops = farmCrops.map(crop => crop.crop_type);
  const cropFamilies = [...new Set(currentCrops.map(crop => getCropFamily(crop)))];
  
  // Check for continuous cropping
  if (cropFamilies.length === 1) {
    recommendations.push({
      type: 'monoculture_risk',
      message: `Warning: Only ${cropFamilies[0]} crops detected. Consider diversifying to prevent disease buildup.`,
      suggestion: 'Add legumes and grains to your rotation'
    });
  }

  // Suggest improvements based on current crops
  if (!cropFamilies.includes('Legumes')) {
    recommendations.push({
      type: 'nitrogen_boost',
      message: 'Consider adding nitrogen-fixing crops to improve soil fertility',
      crops: ['beans', 'peas', 'lentils'],
      benefit: 'Natural nitrogen enrichment for following crops'
    });
  }

  if (!cropFamilies.includes('Grains')) {
    recommendations.push({
      type: 'disease_break',
      message: 'Include grains to break disease cycles and improve soil structure',
      crops: ['wheat', 'corn', 'barley'],
      benefit: 'Reduced disease pressure and improved soil aggregation'
    });
  }

  return recommendations;
}

function getCropFamily(cropType) {
  const families = {
    'Brassicas': ['cabbage', 'broccoli', 'cauliflower', 'kale', 'brussels_sprouts'],
    'Solanaceae': ['tomato', 'pepper', 'eggplant', 'potato'],
    'Legumes': ['beans', 'peas', 'lentils', 'chickpeas', 'soybeans'],
    'Grains': ['corn', 'wheat', 'rice', 'barley', 'oats'],
    'Root Crops': ['carrot', 'beet', 'radish', 'turnip', 'rutabaga'],
    'Leafy Greens': ['lettuce', 'spinach', 'arugula', 'kale'],
    'Cucurbits': ['cucumber', 'squash', 'pumpkin', 'melon', 'zucchini']
  };

  const cropLower = cropType.toLowerCase();
  for (const [family, crops] of Object.entries(families)) {
    if (crops.includes(cropLower)) {
      return family;
    }
  }
  return 'Other';
}