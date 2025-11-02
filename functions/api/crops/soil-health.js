// Soil Health Monitoring API
// Manages soil test results, health analytics, and recommendations

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
        case 'list_tests':
          return await listSoilTests(env, userId, body);
        case 'create_test':
          return await createSoilTest(env, userId, body);
        case 'update_test':
          return await updateSoilTest(env, userId, body);
        case 'delete_test':
          return await deleteSoilTest(env, userId, body.id);
        case 'metrics':
          return await getSoilHealthMetrics(env, userId, body.farm_id);
        case 'export_report':
          return await exportSoilReport(env, userId, body.farm_id);
        case 'recommendations':
          return await getSoilRecommendations(env, userId, body.farm_id);
        case 'trends_analysis':
          return await getSoilTrendsAnalysis(env, userId, body.farm_id);
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
    console.error('Soil Health API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function listSoilTests(env, userId, { farm_id, field_id }) {
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

  // Build query with optional field filter
  let query = `
    SELECT str.*, f.name as field_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    WHERE str.farm_id = ?
  `;
  const queryParams = [farm_id];

  if (field_id) {
    query += ' AND str.field_id = ?';
    queryParams.push(field_id);
  }

  query += ' ORDER BY str.test_date DESC';

  const { results: tests } = await env.DB.prepare(query)
    .bind(...queryParams)
    .all();

  // Parse recommendations if stored as JSON
  const testsWithRecommendations = tests.map(test => ({
    ...test,
    recommendations: test.recommendations ? JSON.parse(test.recommendations) : []
  }));

  return new Response(JSON.stringify(testsWithRecommendations), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function createSoilTest(env, userId, data) {
  const { farm_id, field_id, test_type, ...testData } = data;

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

  // Generate recommendations based on test results
  const recommendations = generateSoilRecommendations({
    ph_level: testData.ph_level,
    organic_matter_percent: testData.organic_matter_percent,
    nitrogen_ppm: testData.nitrogen_ppm,
    phosphorus_ppm: testData.phosphorus_ppm,
    potassium_ppm: testData.potassium_ppm,
    soil_type: testData.soil_type
  });

  // Create soil test
  const insertQuery = `
    INSERT INTO soil_test_results (
      farm_id, field_id, test_date, test_type, ph_level, organic_matter_percent,
      nitrogen_ppm, phosphorus_ppm, potassium_ppm, soil_type, texture, notes,
      recommendations, lab_name, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  const result = await env.DB.prepare(insertQuery)
    .bind(
      farm_id,
      field_id,
      testData.test_date || new Date().toISOString(),
      test_type || 'lab',
      testData.ph_level,
      testData.organic_matter_percent,
      testData.nitrogen_ppm,
      testData.phosphorus_ppm,
      testData.potassium_ppm,
      testData.soil_type,
      testData.texture || null,
      testData.notes || null,
      JSON.stringify(recommendations),
      testData.lab_name || null,
      userId
    )
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to create soil test' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Log the test creation
  await logSoilActivity(env, result.meta.last_row_id, 'test_created', {
    test_type,
    ph_level: testData.ph_level,
    field_id
  });

  return new Response(JSON.stringify({
    success: true,
    id: result.meta.last_row_id,
    recommendations
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updateSoilTest(env, userId, data) {
  const { id, farm_id, ...updates } = data;

  // Verify user access
  const accessQuery = `
    SELECT str.id FROM soil_test_results str
    JOIN farm_members fm ON str.farm_id = fm.farm_id
    WHERE str.id = ? AND fm.user_id = ? AND str.farm_id = ?
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

  // Update soil test
  const updateFields = [];
  const updateValues = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && key !== 'id' && key !== 'farm_id') {
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

  // Regenerate recommendations if test results changed
  const phChanged = 'ph_level' in updates;
  const nutrientsChanged = ['nitrogen_ppm', 'phosphorus_ppm', 'potassium_ppm', 'organic_matter_percent'].some(key => key in updates);

  if (phChanged || nutrientsChanged) {
    const newTestData = { ...updates };
    if (phChanged) newTestData.ph_level = updates.ph_level;
    if (nutrientsChanged) {
      newTestData.nitrogen_ppm = updates.nitrogen_ppm;
      newTestData.phosphorus_ppm = updates.phosphorus_ppm;
      newTestData.potassium_ppm = updates.potassium_ppm;
      newTestData.organic_matter_percent = updates.organic_matter_percent;
    }
    const newRecommendations = generateSoilRecommendations(newTestData);
    updateFields.push('recommendations = ?');
    updateValues.push(JSON.stringify(newRecommendations));
  }

  updateValues.push(id);
  const updateQuery = `
    UPDATE soil_test_results 
    SET ${updateFields.join(', ')}, updated_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(...updateValues)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to update soil test' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function deleteSoilTest(env, userId, testId) {
  // Verify user access
  const accessQuery = `
    SELECT str.id FROM soil_test_results str
    JOIN farm_members fm ON str.farm_id = fm.farm_id
    WHERE str.id = ? AND fm.user_id = ?
  `;
  const { results: access } = await env.DB.prepare(accessQuery)
    .bind(testId, userId)
    .all();

  if (!access || access.length === 0) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Soft delete by marking as inactive
  const updateQuery = `
    UPDATE soil_test_results 
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `;

  const result = await env.DB.prepare(updateQuery)
    .bind(testId)
    .run();

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Failed to delete soil test' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getSoilHealthMetrics(env, userId, farmId) {
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

  // Get latest test results
  const latestTestsQuery = `
    SELECT str.*, f.name as field_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    WHERE str.farm_id = ? AND str.is_active = 1
      AND str.test_date = (
        SELECT MAX(test_date) 
        FROM soil_test_results str2 
        WHERE str2.farm_id = str.farm_id AND str2.field_id = str.field_id AND str2.is_active = 1
      )
    ORDER BY str.test_date DESC
  `;
  const { results: latestTests } = await env.DB.prepare(latestTestsQuery)
    .bind(farmId)
    .all();

  if (!latestTests || latestTests.length === 0) {
    return new Response(JSON.stringify({
      overall_health_score: 0,
      ph_balance: 'neutral',
      nutrient_status: 'adequate',
      organic_matter_status: 'moderate',
      last_test_date: null,
      next_test_recommended: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      trends: { ph_trend: 'stable', organic_matter_trend: 'stable', nutrient_trend: 'stable' }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Calculate overall health score
  const healthScore = calculateOverallHealthScore(latestTests);

  // Determine pH balance
  const avgPH = latestTests.reduce((sum, test) => sum + test.ph_level, 0) / latestTests.length;
  const phBalance = avgPH < 6.0 ? 'acidic' : avgPH > 7.5 ? 'alkaline' : 'neutral';

  // Determine nutrient status
  const avgNitrogen = latestTests.reduce((sum, test) => sum + test.nitrogen_ppm, 0) / latestTests.length;
  const avgPhosphorus = latestTests.reduce((sum, test) => sum + test.phosphorus_ppm, 0) / latestTests.length;
  const avgPotassium = latestTests.reduce((sum, test) => sum + test.potassium_ppm, 0) / latestTests.length;

  let nutrientStatus = 'adequate';
  const deficiencies = [];
  if (avgNitrogen < 20) deficiencies.push('nitrogen');
  if (avgPhosphorus < 25) deficiencies.push('phosphorus');
  if (avgPotassium < 100) deficiencies.push('potassium');

  if (deficiencies.length > 1) nutrientStatus = 'deficient';
  else if (deficiencies.length === 0 && (avgNitrogen > 50 || avgPhosphorus > 50 || avgPotassium > 200)) {
    nutrientStatus = 'excessive';
  }

  // Determine organic matter status
  const avgOrganicMatter = latestTests.reduce((sum, test) => sum + test.organic_matter_percent, 0) / latestTests.length;
  const organicMatterStatus = avgOrganicMatter < 2 ? 'low' : avgOrganicMatter > 5 ? 'high' : 'moderate';

  // Get last test date
  const lastTestDate = new Date(Math.max(...latestTests.map(test => new Date(test.test_date).getTime())));

  // Calculate next test recommendation (1-2 years based on health)
  const daysUntilNextTest = healthScore >= 80 ? 730 : healthScore >= 60 ? 540 : 365;
  const nextTestRecommended = new Date(lastTestDate.getTime() + daysUntilNextTest * 24 * 60 * 60 * 1000);

  // Get trends (would need historical data for accurate trends)
  const trends = calculateSoilTrends(latestTests);

  return new Response(JSON.stringify({
    overall_health_score: healthScore,
    ph_balance: phBalance,
    nutrient_status: nutrientStatus,
    organic_matter_status: organicMatterStatus,
    last_test_date: lastTestDate.toISOString(),
    next_test_recommended: nextTestRecommended.toISOString(),
    trends
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function exportSoilReport(env, userId, farmId) {
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

  // Get all soil tests with field information
  const testsQuery = `
    SELECT str.*, f.name as field_name, fm.name as farm_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    JOIN farms fm ON str.farm_id = fm.id
    WHERE str.farm_id = ? AND str.is_active = 1
    ORDER BY str.test_date DESC, str.field_id
  `;
  const { results: tests } = await env.DB.prepare(testsQuery)
    .bind(farmId)
    .all();

  // Generate CSV report
  const csvHeaders = [
    'Field Name',
    'Test Date',
    'pH Level',
    'Organic Matter (%)',
    'Nitrogen (ppm)',
    'Phosphorus (ppm)',
    'Potassium (ppm)',
    'Soil Type',
    'Texture',
    'Test Type',
    'Lab Name',
    'Notes'
  ];

  let csvContent = csvHeaders.join(',') + '\n';
  
  tests.forEach(test => {
    const row = [
      test.field_name,
      test.test_date,
      test.ph_level,
      test.organic_matter_percent,
      test.nitrogen_ppm,
      test.phosphorus_ppm,
      test.potassium_ppm,
      test.soil_type,
      test.texture || '',
      test.test_type,
      test.lab_name || '',
      (test.notes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
    ];
    csvContent += row.join(',') + '\n';
  });

  return new Response(JSON.stringify({
    report: csvContent,
    filename: `soil-health-report-${new Date().toISOString().split('T')[0]}.csv`
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getSoilRecommendations(env, userId, farmId) {
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

  // Get latest test results by field
  const latestTestsQuery = `
    SELECT str.*, f.name as field_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    WHERE str.farm_id = ? AND str.is_active = 1
      AND str.test_date = (
        SELECT MAX(test_date) 
        FROM soil_test_results str2 
        WHERE str2.farm_id = str.farm_id AND str2.field_id = str.field_id AND str2.is_active = 1
      )
  `;
  const { results: tests } = await env.DB.prepare(latestTestsQuery)
    .bind(farmId)
    .all();

  const recommendations = [];

  tests.forEach(test => {
    const fieldRecommendations = generateFieldSpecificRecommendations(test);
    if (fieldRecommendations.length > 0) {
      recommendations.push({
        field_id: test.field_id,
        field_name: test.field_name,
        test_date: test.test_date,
        recommendations: fieldRecommendations
      });
    }
  });

  // Add general recommendations
  const generalRecommendations = generateGeneralRecommendations(tests);
  recommendations.push({
    field_name: 'General',
    recommendations: generalRecommendations
  });

  return new Response(JSON.stringify({ recommendations }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getSoilTrendsAnalysis(env, userId, farmId) {
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

  // Get historical soil test data
  const historyQuery = `
    SELECT str.*, f.name as field_name
    FROM soil_test_results str
    JOIN fields f ON str.field_id = f.id
    WHERE str.farm_id = ? AND str.is_active = 1
    ORDER BY str.test_date ASC, str.field_id
  `;
  const { results: history } = await env.DB.prepare(historyQuery)
    .bind(farmId)
    .all();

  // Group by field and analyze trends
  const fieldTrends = {};
  history.forEach(test => {
    if (!fieldTrends[test.field_id]) {
      fieldTrends[test.field_id] = {
        field_name: test.field_name,
        tests: []
      };
    }
    fieldTrends[test.field_id].tests.push(test);
  });

  const trendAnalysis = [];
  for (const [fieldId, data] of Object.entries(fieldTrends)) {
    const tests = data.tests;
    if (tests.length < 2) continue;

    // Calculate trends for each parameter
    const phTrend = calculateTrend(tests.map(t => ({ date: t.test_date, value: t.ph_level })));
    const organicMatterTrend = calculateTrend(tests.map(t => ({ date: t.test_date, value: t.organic_matter_percent })));
    const nitrogenTrend = calculateTrend(tests.map(t => ({ date: t.test_date, value: t.nitrogen_ppm })));

    trendAnalysis.push({
      field_id: fieldId,
      field_name: data.field_name,
      test_count: tests.length,
      date_range: {
        first: tests[0].test_date,
        last: tests[tests.length - 1].test_date
      },
      trends: {
        ph: phTrend,
        organic_matter: organicMatterTrend,
        nitrogen: nitrogenTrend
      }
    });
  }

  return new Response(JSON.stringify({ trend_analysis: trendAnalysis }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions

async function logSoilActivity(env, testId, action, details) {
  try {
    const insertQuery = `
      INSERT INTO soil_health_logs (
        test_id, action, details, logged_at
      ) VALUES (?, ?, ?, datetime('now'))
    `;

    await env.DB.prepare(insertQuery)
      .bind(testId, action, JSON.stringify(details))
      .run();
  } catch (error) {
    console.warn('Failed to log soil activity:', error);
  }
}

function generateSoilRecommendations(testData) {
  const recommendations = [];

  // pH recommendations
  if (testData.ph_level < 6.0) {
    recommendations.push('Apply lime to increase soil pH to optimal range (6.0-7.0)');
    recommendations.push('Consider using dolomitic lime if soil is also low in magnesium');
  } else if (testData.ph_level > 7.5) {
    recommendations.push('Apply elemental sulfur to decrease soil pH');
    recommendations.push('Use acidic fertilizers and organic matter to lower pH naturally');
  }

  // Organic matter recommendations
  if (testData.organic_matter_percent < 2) {
    recommendations.push('Add 2-4 inches of compost or aged manure');
    recommendations.push('Plant cover crops to increase organic matter');
    recommendations.push('Avoid over-tilling to preserve soil structure');
  } else if (testData.organic_matter_percent > 6) {
    recommendations.push('Organic matter levels are optimal');
    recommendations.push('Continue current organic matter management practices');
  }

  // Nutrient recommendations
  if (testData.nitrogen_ppm < 20) {
    recommendations.push('Apply nitrogen-rich fertilizers (10-0-0) or compost');
    recommendations.push('Plant nitrogen-fixing legumes to naturally enrich soil');
  }

  if (testData.phosphorus_ppm < 25) {
    recommendations.push('Apply bone meal or rock phosphate for phosphorus');
    recommendations.push('Maintain soil pH in optimal range for phosphorus availability');
  }

  if (testData.potassium_ppm < 100) {
    recommendations.push('Apply potassium sulfate or wood ash for potassium');
    recommendations.push('Avoid over-liming which can reduce potassium availability');
  }

  // Soil type specific recommendations
  if (testData.soil_type === 'clay') {
    recommendations.push('Improve drainage by adding organic matter and sand');
    recommendations.push('Avoid working soil when wet to prevent compaction');
  } else if (testData.soil_type === 'sandy') {
    recommendations.push('Add organic matter to improve water and nutrient retention');
    recommendations.push('Consider more frequent, smaller fertilizer applications');
  }

  return recommendations;
}

function calculateOverallHealthScore(tests) {
  let totalScore = 0;
  let factorCount = 0;

  tests.forEach(test => {
    // pH score (25% weight)
    const phScore = Math.max(0, 100 - Math.abs(test.ph_level - 6.5) * 20);
    totalScore += phScore * 0.25;
    factorCount += 0.25;

    // Organic matter score (25% weight)
    const omScore = Math.min(100, test.organic_matter_percent * 20);
    totalScore += omScore * 0.25;
    factorCount += 0.25;

    // Nutrient balance score (25% weight)
    const nitrogenScore = Math.min(100, Math.max(0, (test.nitrogen_ppm / 30) * 100));
    const phosphorusScore = Math.min(100, Math.max(0, (test.phosphorus_ppm / 35) * 100));
    const potassiumScore = Math.min(100, Math.max(0, (test.potassium_ppm / 150) * 100));
    const nutrientScore = (nitrogenScore + phosphorusScore + potassiumScore) / 3;
    totalScore += nutrientScore * 0.25;
    factorCount += 0.25;

    // Soil type suitability score (25% weight)
    const soilTypeScore = getSoilTypeHealthScore(test.soil_type);
    totalScore += soilTypeScore * 0.25;
    factorCount += 0.25;
  });

  return Math.round(totalScore / factorCount);
}

function getSoilTypeHealthScore(soilType) {
  const scores = {
    'loam': 90,
    'silt': 80,
    'sandy': 70,
    'clay': 75,
    'peat': 60
  };
  return scores[soilType] || 70;
}

function calculateSoilTrends(tests) {
  // Simple trend calculation - would need more sophisticated analysis for production
  if (tests.length < 2) {
    return {
      ph_trend: 'stable',
      organic_matter_trend: 'stable',
      nutrient_trend: 'stable'
    };
  }

  const sortedTests = tests.sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
  const firstTest = sortedTests[0];
  const lastTest = sortedTests[sortedTests.length - 1];

  // Calculate changes
  const phChange = lastTest.ph_level - firstTest.ph_level;
  const omChange = lastTest.organic_matter_percent - firstTest.organic_matter_percent;
  const nutrientChange = (lastTest.nitrogen_ppm + lastTest.phosphorus_ppm + lastTest.potassium_ppm) - 
                        (firstTest.nitrogen_ppm + firstTest.phosphorus_ppm + firstTest.potassium_ppm);

  return {
    ph_trend: phChange > 0.5 ? 'improving' : phChange < -0.5 ? 'declining' : 'stable',
    organic_matter_trend: omChange > 0.5 ? 'improving' : omChange < -0.5 ? 'declining' : 'stable',
    nutrient_trend: nutrientChange > 10 ? 'improving' : nutrientChange < -10 ? 'declining' : 'stable'
  };
}

function generateFieldSpecificRecommendations(test) {
  const recommendations = [];

  // pH-specific recommendations
  if (test.ph_level < 6.0) {
    recommendations.push({
      type: 'pH_correction',
      priority: 'high',
      description: `Soil pH (${test.ph_level.toFixed(1)}) is too acidic for optimal crop growth`,
      action: 'Apply lime to raise pH to 6.0-7.0 range',
      timeline: 'Apply 6 months before planting'
    });
  } else if (test.ph_level > 7.5) {
    recommendations.push({
      type: 'pH_correction',
      priority: 'medium',
      description: `Soil pH (${test.ph_level.toFixed(1)}) is too alkaline`,
      action: 'Apply elemental sulfur to lower pH',
      timeline: 'Apply 6 months before planting'
    });
  }

  // Organic matter recommendations
  if (test.organic_matter_percent < 2) {
    recommendations.push({
      type: 'organic_matter',
      priority: 'high',
      description: `Low organic matter (${test.organic_matter_percent.toFixed(1)}%)`,
      action: 'Add 2-4 inches of compost or aged manure annually',
      timeline: 'Apply before planting season'
    });
  }

  // Nutrient-specific recommendations
  if (test.nitrogen_ppm < 20) {
    recommendations.push({
      type: 'nitrogen',
      priority: 'medium',
      description: `Low nitrogen (${test.nitrogen_ppm} ppm)`,
      action: 'Apply nitrogen-rich fertilizer or compost',
      timeline: 'Apply at planting and mid-season'
    });
  }

  return recommendations;
}

function generateGeneralRecommendations(tests) {
  const recommendations = [];

  // Testing frequency recommendations
  const oldestTest = Math.min(...tests.map(t => new Date(t.test_date).getTime()));
  const daysSinceLastTest = (Date.now() - oldestTest) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastTest > 730) {
    recommendations.push({
      type: 'testing_frequency',
      priority: 'high',
      description: 'Soil tests are over 2 years old',
      action: 'Conduct new soil tests for accurate recommendations',
      timeline: 'Schedule testing before next growing season'
    });
  }

  // Overall farm recommendations
  const avgHealthScore = tests.length > 0 ? tests.reduce((sum, test) => 
    sum + calculateOverallHealthScore([test]), 0) / tests.length : 0;

  if (avgHealthScore < 60) {
    recommendations.push({
      type: 'overall_improvement',
      priority: 'high',
      description: `Overall soil health score is ${avgHealthScore}/100`,
      action: 'Implement comprehensive soil improvement program',
      timeline: 'Start immediately, ongoing improvement'
    });
  }

  return recommendations;
}

function calculateTrend(dataPoints) {
  if (dataPoints.length < 2) return { direction: 'stable', magnitude: 0 };

  const sortedPoints = dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstValue = sortedPoints[0].value;
  const lastValue = sortedPoints[sortedPoints.length - 1].value;
  
  const change = lastValue - firstValue;
  const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
  
  if (Math.abs(changePercent) < 5) {
    return { direction: 'stable', magnitude: 0 };
  } else if (changePercent > 0) {
    return { direction: 'improving', magnitude: Math.round(changePercent) };
  } else {
    return { direction: 'declining', magnitude: Math.round(Math.abs(changePercent)) };
  }
}