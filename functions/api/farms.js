import { AuthUtils, createUnauthorizedResponse, createErrorResponse, createSuccessResponse } from './_auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Initialize AuthUtils
    const auth = new AuthUtils(env);
    
    // Get user from token
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Enhanced farms listing with analytics
    if (method === 'GET') {
      const farmId = url.searchParams.get('id');
      const stats = url.searchParams.get('stats');
      const operations = url.searchParams.get('operations');
      const analytics = url.searchParams.get('analytics');

      if (farmId) {
        // Get specific farm with comprehensive data
        const { results: farmResults, error } = await env.DB.prepare(`
          SELECT 
            f.*,
            COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
            COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
            COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
          FROM farms f
          WHERE f.id = ? AND f.owner_id = ?
        `).bind(farmId, user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        const farm = farmResults[0];
        if (!farm) {
          return createErrorResponse('Farm not found or access denied', 404);
        }

        // Check farm access
        if (!await auth.hasFarmAccess(user.id, farmId)) {
          return createErrorResponse('Access denied', 403);
        }

        // Get farm statistics if requested
        if (stats === 'true') {
          const { results: statsResults } = await env.DB.prepare(`
            SELECT * FROM farm_statistics 
            WHERE farm_id = ? 
            ORDER BY report_date DESC 
            LIMIT 12
          `).bind(farmId).all();
          
          farm.statistics = statsResults;
        }

        // Get recent farm operations if requested
        if (operations === 'true') {
          const { results: opsResults } = await env.DB.prepare(`
            SELECT * FROM farm_operations 
            WHERE farm_id = ? 
            ORDER BY operation_date DESC 
            LIMIT 50
          `).bind(farmId).all();
          
          farm.operations = opsResults;
        }

        return createSuccessResponse(farm);

      } else if (analytics === 'true') {
        // Get farms with analytics data
        const { results: farms, error } = await env.DB.prepare(`
          SELECT 
            f.*,
            COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
            COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
            COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks,
            COALESCE((SELECT SUM(amount) FROM finance_entries fe WHERE fe.farm_id = f.id AND fe.type = 'income'), 0) as total_revenue,
            COALESCE((SELECT SUM(amount) FROM finance_entries fe WHERE fe.farm_id = f.id AND fe.type = 'expense'), 0) as total_expenses,
            COALESCE((SELECT MAX(fs.productivity_score) FROM farm_statistics fs WHERE fs.farm_id = f.id), 0) as latest_productivity_score
          FROM farms f
          WHERE f.owner_id = ?
          ORDER BY f.created_at DESC
        `).bind(user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(farms || []);

      } else {
        // Standard farms list with enhanced data
        const { results: farms, error } = await env.DB.prepare(`
          SELECT 
            f.*,
            COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
            COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
            COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
          FROM farms f
          WHERE f.owner_id = ?
          ORDER BY f.created_at DESC
        `).bind(user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(farms || []);
      }

    } else if (method === 'POST') {
      // Create farm with enhanced data
      const body = await request.json();
      const { 
        name, 
        location, 
        area_hectares, 
        farm_type,
        certification_status,
        environmental_compliance,
        total_acres,
        operational_start_date,
        management_structure,
        seasonal_staff,
        annual_budget
      } = body;

      if (!name || !location) {
        return createErrorResponse('Name and location required', 400);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO farms (
          name, location, area_hectares, farm_type, certification_status,
          environmental_compliance, total_acres, operational_start_date,
          management_structure, seasonal_staff, annual_budget, owner_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        name, location, area_hectares || null, farm_type || null,
        certification_status || null, environmental_compliance || null,
        total_acres || null, operational_start_date || null,
        management_structure || null, seasonal_staff || null,
        annual_budget || null, user.id
      ).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create farm', 500);
      }

      // Get the created farm
      const { results: farmResults } = await env.DB.prepare(`
        SELECT * FROM farms 
        WHERE rowid = last_insert_rowid()
      `).all();

      const newFarm = farmResults[0];

      // Grant owner access to the creator
      await auth.grantFarmAccess(newFarm.id, user.id, 'owner');

      // Create initial farm statistics record
      await env.DB.prepare(`
        INSERT INTO farm_statistics (farm_id, report_date)
        VALUES (?, date('now'))
      `).bind(newFarm.id).run();

      return createSuccessResponse(newFarm);

    } else if (method === 'PUT') {
      // Update farm with enhanced data
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const updateFields = [];
      const updateValues = [];

      // Handle all possible update fields
      const allowedFields = [
        'name', 'location', 'area_hectares', 'farm_type', 'certification_status',
        'environmental_compliance', 'total_acres', 'operational_start_date',
        'management_structure', 'seasonal_staff', 'annual_budget'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(updateData[field]);
        }
      });

      if (updateFields.length === 0) {
        return createErrorResponse('No fields to update', 400);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      const { error: updateError } = await env.DB.prepare(`
        UPDATE farms 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...updateValues).run();

      if (updateError) {
        console.error('Update error:', updateError);
        return createErrorResponse('Failed to update farm', 500);
      }

      // Get updated farm with stats
      const { results: farmResults } = await env.DB.prepare(`
        SELECT 
          f.*,
          COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
          COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count
        FROM farms f
        WHERE f.id = ?
      `).bind(id).all();

      return createSuccessResponse(farmResults[0]);

    } else if (method === 'DELETE') {
      // Enhanced delete with cleanup
      const farmId = url.searchParams.get('id');

      if (!farmId) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      // Check for dependencies
      const { results: dependencies } = await env.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM animals WHERE farm_id = ?) as animal_count,
          (SELECT COUNT(*) FROM fields WHERE farm_id = ?) as field_count,
          (SELECT COUNT(*) FROM tasks WHERE farm_id = ?) as task_count
      `).bind(farmId, farmId, farmId).all();

      const dep = dependencies[0];
      if (dep.animal_count > 0 || dep.field_count > 0 || dep.task_count > 0) {
        return createErrorResponse(
          'Cannot delete farm with existing data. Please archive instead.', 
          400
        );
      }

      const { error: deleteError } = await env.DB.prepare(`
        DELETE FROM farms WHERE id = ?
      `).bind(farmId).run();

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return createErrorResponse('Failed to delete farm', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Farm API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Farm Statistics Management
export async function onRequestStats(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === 'GET') {
      const farmId = url.searchParams.get('farm_id');
      const period = url.searchParams.get('period') || '12months';

      if (!farmId) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse('Access denied', 403);
      }

      const limitClause = period === '6months' ? 'LIMIT 6' : 'LIMIT 12';
      
      const { results, error } = await env.DB.prepare(`
        SELECT * FROM farm_statistics 
        WHERE farm_id = ? 
        ORDER BY report_date DESC 
        ${limitClause}
      `).bind(farmId).all();

      if (error) {
        console.error('Stats error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(results);

    } else if (method === 'POST') {
      const body = await request.json();
      const { farm_id, ...statsData } = body;

      if (!farm_id) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Access denied', 403);
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO farm_statistics (
          farm_id, report_date, total_animals, total_acres_under_cultivation,
          annual_revenue, total_operational_cost, profit_margin, employee_count,
          productivity_score, sustainability_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        statsData.report_date || new Date().toISOString().split('T')[0],
        statsData.total_animals || 0,
        statsData.total_acres_under_cultivation || 0,
        statsData.annual_revenue || 0,
        statsData.total_operational_cost || 0,
        statsData.profit_margin || 0,
        statsData.employee_count || 0,
        statsData.productivity_score || 0,
        statsData.sustainability_score || 0
      ).run();

      if (error) {
        console.error('Stats insert error:', error);
        return createErrorResponse('Failed to create statistics', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Stats API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Farm Operations Management
export async function onRequestOperations(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === 'GET') {
      const farmId = url.searchParams.get('farm_id');
      const operationType = url.searchParams.get('type');
      const limit = url.searchParams.get('limit') || '50';

      if (!farmId) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse('Access denied', 403);
      }

      let query = `
        SELECT * FROM farm_operations 
        WHERE farm_id = ? 
      `;
      const params = [farmId];

      if (operationType) {
        query += ' AND operation_type = ?';
        params.push(operationType);
      }

      query += ' ORDER BY operation_date DESC LIMIT ?';
      params.push(parseInt(limit));

      const { results, error } = await env.DB.prepare(query).bind(...params).all();

      if (error) {
        console.error('Operations error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(results);

    } else if (method === 'POST') {
      const body = await request.json();
      const { farm_id, ...operationData } = body;

      if (!farm_id) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check access
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Access denied', 403);
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO farm_operations (
          farm_id, operation_type, operation_date, description,
          cost, revenue, staff_involved, success_rating, environmental_impact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        operationData.operation_type,
        operationData.operation_date || new Date().toISOString().split('T')[0],
        operationData.description || '',
        operationData.cost || 0,
        operationData.revenue || 0,
        operationData.staff_involved || '',
        operationData.success_rating || 0,
        operationData.environmental_impact || ''
      ).run();

      if (error) {
        console.error('Operation insert error:', error);
        return createErrorResponse('Failed to create operation', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Operations API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}