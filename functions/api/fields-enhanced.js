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

    // Enhanced fields listing with analytics
    if (method === 'GET') {
      const fieldId = url.searchParams.get('id');
      const analytics = url.searchParams.get('analytics');
      const soil = url.searchParams.get('soil');
      const equipment = url.searchParams.get('equipment');
      const usage = url.searchParams.get('usage');

      if (fieldId) {
        // Get specific field with comprehensive data
        const { results: fieldResults, error } = await env.DB.prepare(`
          SELECT 
            f.*,
            fa.name as farm_name,
            fa.id as farm_id,
            COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count,
            COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = fa.id AND t.status != 'completed'), 0) as pending_tasks
          FROM fields f
          JOIN farm_members fm ON f.farm_id = fm.farm_id
          JOIN farms fa ON f.farm_id = fa.id
          WHERE f.id = ? AND fm.user_id = ?
        `).bind(fieldId, user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        const field = fieldResults[0];
        if (!field) {
          return createErrorResponse('Field not found or access denied', 404);
        }

        // Get soil analysis if requested
        if (soil === 'true') {
          const { results: soilResults } = await env.DB.prepare(`
            SELECT * FROM soil_analysis 
            WHERE field_id = ? 
            ORDER BY analysis_date DESC 
            LIMIT 10
          `).bind(fieldId).all();
          
          field.soil_analysis = soilResults;
        }

        // Get equipment if requested
        if (equipment === 'true') {
          const { results: equipmentResults } = await env.DB.prepare(`
            SELECT * FROM field_equipment 
            WHERE field_id = ? 
            ORDER BY equipment_type, equipment_name
          `).bind(fieldId).all();
          
          field.equipment = equipmentResults;
        }

        // Get usage history if requested
        if (usage === 'true') {
          const { results: usageResults } = await env.DB.prepare(`
            SELECT * FROM field_usage_history 
            WHERE field_id = ? 
            ORDER BY usage_period_start DESC 
            LIMIT 12
          `).bind(fieldId).all();
          
          field.usage_history = usageResults;
        }

        return createSuccessResponse(field);

      } else if (analytics === 'true') {
        // Get fields with analytics data
        const { results: fields, error } = await env.DB.prepare(`
          SELECT 
            f.*,
            fa.name as farm_name,
            fa.id as farm_id,
            COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count,
            COALESCE((SELECT AVG(fuh.profitability_score) FROM field_usage_history fuh WHERE fuh.field_id = f.id), 0) as avg_profitability,
            COALESCE((SELECT MAX(fuh.yield_per_hectare) FROM field_usage_history fuh WHERE fuh.field_id = f.id), 0) as best_yield_per_hectare,
            COALESCE((SELECT AVG(sa.ph_level) FROM soil_analysis sa WHERE sa.field_id = f.id), 0) as avg_ph_level
          FROM fields f
          JOIN farm_members fm ON f.farm_id = fm.farm_id
          JOIN farms fa ON f.farm_id = fa.id
          WHERE fm.user_id = ?
          ORDER BY f.created_at DESC
        `).bind(user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(fields || []);

      } else {
        // Standard fields list with enhanced data
        const { results: fields, error } = await env.DB.prepare(`
          SELECT 
            f.*,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count
          FROM fields f
          JOIN farm_members fm ON f.farm_id = fm.farm_id
          JOIN farms fa ON f.farm_id = fa.id
          WHERE fm.user_id = ?
          ORDER BY f.created_at DESC
        `).bind(user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(fields || []);
      }

    } else if (method === 'POST') {
      // Create field with enhanced data
      const body = await request.json();
      const { 
        farm_id,
        name, 
        area_hectares, 
        crop_type, 
        notes,
        soil_type,
        field_capacity,
        current_cover_crop,
        irrigation_system,
        drainage_quality,
        accessibility_score,
        environmental_factors,
        maintenance_schedule
      } = body;

      if (!farm_id || !name) {
        return createErrorResponse('Farm ID and name required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO fields (
          farm_id, name, area_hectares, crop_type, notes,
          soil_type, field_capacity, current_cover_crop, irrigation_system,
          drainage_quality, accessibility_score, environmental_factors,
          maintenance_schedule
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id, name, area_hectares || null, crop_type || null, notes || null,
        soil_type || null, field_capacity || null, current_cover_crop || null,
        irrigation_system || null, drainage_quality || null, 
        accessibility_score || null, environmental_factors || null,
        maintenance_schedule || null
      ).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create field', 500);
      }

      // Get the created field
      const { results: fieldResults } = await env.DB.prepare(`
        SELECT 
          f.*,
          fa.name as farm_name
        FROM fields f
        JOIN farms fa ON f.farm_id = fa.id
        WHERE f.rowid = last_insert_rowid()
      `).all();

      const newField = fieldResults[0];

      // Create initial soil analysis record
      await env.DB.prepare(`
        INSERT INTO soil_analysis (field_id, analysis_date)
        VALUES (?, date('now'))
      `).bind(newField.id).run();

      return createSuccessResponse(newField);

    } else if (method === 'PUT') {
      // Update field with enhanced data
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse('Field ID required', 400);
      }

      // Get the field and check farm access
      const { results: existingFields } = await env.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();

      if (existingFields.length === 0) {
        return createErrorResponse('Field not found or access denied', 404);
      }

      const updateFields = [];
      const updateValues = [];

      // Handle all possible update fields
      const allowedFields = [
        'name', 'area_hectares', 'crop_type', 'notes',
        'soil_type', 'field_capacity', 'current_cover_crop', 'irrigation_system',
        'drainage_quality', 'accessibility_score', 'environmental_factors', 'maintenance_schedule'
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
        UPDATE fields 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...updateValues).run();

      if (updateError) {
        console.error('Update error:', updateError);
        return createErrorResponse('Failed to update field', 500);
      }

      // Get updated field with stats
      const { results: fieldResults } = await env.DB.prepare(`
        SELECT 
          f.*,
          fa.name as farm_name,
          COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count
        FROM fields f
        JOIN farms fa ON f.farm_id = fa.id
        WHERE f.id = ?
      `).bind(id).all();

      return createSuccessResponse(fieldResults[0]);

    } else if (method === 'DELETE') {
      // Enhanced delete with dependencies check
      const fieldId = url.searchParams.get('id');

      if (!fieldId) {
        return createErrorResponse('Field ID required', 400);
      }

      // Get the field and check farm access
      const { results: existingFields } = await env.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(fieldId, user.id).all();

      if (existingFields.length === 0) {
        return createErrorResponse('Field not found or access denied', 404);
      }

      // Check for dependencies
      const { results: dependencies } = await env.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM crops WHERE field_id = ?) as crop_count,
          (SELECT COUNT(*) FROM soil_analysis WHERE field_id = ?) as soil_analysis_count,
          (SELECT COUNT(*) FROM field_equipment WHERE field_id = ?) as equipment_count,
          (SELECT COUNT(*) FROM field_usage_history WHERE field_id = ?) as usage_count
      `).bind(fieldId, fieldId, fieldId, fieldId).all();

      const dep = dependencies[0];
      if (dep.crop_count > 0) {
        return createErrorResponse(
          'Cannot delete field with active crops. Please remove crops first.', 
          400
        );
      }

      const { error: deleteError } = await env.DB.prepare(`
        DELETE FROM fields WHERE id = ?
      `).bind(fieldId).run();

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return createErrorResponse('Failed to delete field', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Field API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Soil Analysis Management
export async function onRequestSoilAnalysis(context) {
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
      const fieldId = url.searchParams.get('field_id');
      const limit = url.searchParams.get('limit') || '10';

      if (!fieldId) {
        return createErrorResponse('Field ID required', 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(fieldId, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      const { results, error } = await env.DB.prepare(`
        SELECT * FROM soil_analysis 
        WHERE field_id = ? 
        ORDER BY analysis_date DESC 
        LIMIT ?
      `).bind(fieldId, parseInt(limit)).all();

      if (error) {
        console.error('Soil analysis error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(results);

    } else if (method === 'POST') {
      const body = await request.json();
      const { field_id, ...analysisData } = body;

      if (!field_id) {
        return createErrorResponse('Field ID required', 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(field_id, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO soil_analysis (
          field_id, analysis_date, ph_level, nitrogen_content, phosphorus_content,
          potassium_content, organic_matter, soil_moisture, temperature, salinity, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        field_id,
        analysisData.analysis_date || new Date().toISOString().split('T')[0],
        analysisData.ph_level || 0,
        analysisData.nitrogen_content || 0,
        analysisData.phosphorus_content || 0,
        analysisData.potassium_content || 0,
        analysisData.organic_matter || 0,
        analysisData.soil_moisture || 0,
        analysisData.temperature || 0,
        analysisData.salinity || 0,
        analysisData.recommendations || ''
      ).run();

      if (error) {
        console.error('Soil analysis insert error:', error);
        return createErrorResponse('Failed to create soil analysis', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Soil analysis API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Equipment Management
export async function onRequestEquipment(context) {
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
      const fieldId = url.searchParams.get('field_id');

      if (!fieldId) {
        return createErrorResponse('Field ID required', 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(fieldId, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      const { results, error } = await env.DB.prepare(`
        SELECT * FROM field_equipment 
        WHERE field_id = ? 
        ORDER BY equipment_type, equipment_name
      `).bind(fieldId).all();

      if (error) {
        console.error('Equipment error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(results);

    } else if (method === 'POST') {
      const body = await request.json();
      const { field_id, ...equipmentData } = body;

      if (!field_id) {
        return createErrorResponse('Field ID required', 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `).bind(field_id, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO field_equipment (
          field_id, equipment_type, equipment_name, maintenance_schedule,
          last_maintenance, next_maintenance, performance_rating, cost_per_use
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        field_id,
        equipmentData.equipment_type,
        equipmentData.equipment_name || '',
        equipmentData.maintenance_schedule || '',
        equipmentData.last_maintenance || null,
        equipmentData.next_maintenance || null,
        equipmentData.performance_rating || 0,
        equipmentData.cost_per_use || 0
      ).run();

      if (error) {
        console.error('Equipment insert error:', error);
        return createErrorResponse('Failed to create equipment', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Equipment API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}