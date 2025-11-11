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

    // Enhanced crops listing with comprehensive data
    if (method === 'GET') {
      const cropId = url.searchParams.get('id');
      const analytics = url.searchParams.get('analytics');
      const varieties = url.searchParams.get('varieties');
      const activities = url.searchParams.get('activities');
      const observations = url.searchParams.get('observations');
      const yields = url.searchParams.get('yields');
      const fieldId = url.searchParams.get('field_id');
      const status = url.searchParams.get('status');

      if (cropId) {
        // Get specific crop with comprehensive data
        const { results: cropResults, error } = await env.DB.prepare(`
          SELECT 
            c.*,
            f.name as field_name,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM crop_activities ca WHERE ca.crop_id = c.id), 0) as activity_count,
            COALESCE((SELECT COUNT(*) FROM crop_observations co WHERE co.crop_id = c.id), 0) as observation_count,
            COALESCE((SELECT COUNT(*) FROM irrigation_schedules isc WHERE isc.crop_id = c.id AND isc.is_active = 1), 0) as irrigation_schedules
          FROM crops c
          JOIN farm_members fm ON c.farm_id = fm.farm_id
          JOIN farms fa ON c.farm_id = fa.id
          LEFT JOIN fields f ON c.field_id = f.id
          WHERE c.id = ? AND fm.user_id = ?
        `).bind(cropId, user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        const crop = cropResults[0];
        if (!crop) {
          return createErrorResponse('Crop not found or access denied', 404);
        }

        // Get crop activities if requested
        if (activities === 'true') {
          const { results: activitiesResults } = await env.DB.prepare(`
            SELECT * FROM crop_activities 
            WHERE crop_id = ? 
            ORDER BY activity_date DESC 
            LIMIT 20
          `).bind(cropId).all();
          
          crop.activities = activitiesResults;
        }

        // Get crop observations if requested
        if (observations === 'true') {
          const { results: observationsResults } = await env.DB.prepare(`
            SELECT * FROM crop_observations 
            WHERE crop_id = ? 
            ORDER BY observation_date DESC 
            LIMIT 10
          `).bind(cropId).all();
          
          crop.observations = observationsResults;
        }

        // Get yield records if requested
        if (yields === 'true') {
          const { results: yieldsResults } = await env.DB.prepare(`
            SELECT * FROM crop_yield_records 
            WHERE crop_id = ? 
            ORDER BY harvest_date DESC 
          `).bind(cropId).all();
          
          crop.yield_records = yieldsResults;
        }

        return createSuccessResponse(crop);

      } else if (varieties === 'true') {
        // Get crop varieties
        const { results: varietiesResults, error } = await env.DB.prepare(`
          SELECT * FROM crop_varieties 
          ORDER BY crop_type, name
        `).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(varietiesResults);

      } else if (analytics === 'true') {
        // Get crops with analytics data
        let query = `
          SELECT 
            c.*,
            f.name as field_name,
            fa.name as farm_name,
            COALESCE((SELECT COUNT(*) FROM crop_activities ca WHERE ca.crop_id = c.id), 0) as activity_count,
            COALESCE((SELECT COUNT(*) FROM crop_observations co WHERE co.crop_id = c.id), 0) as observation_count,
            COALESCE((SELECT MAX(cyr.total_yield) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as best_yield,
            COALESCE((SELECT AVG(cyr.yield_per_hectare) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as avg_yield_per_hectare,
            COALESCE((SELECT AVG(cyr.revenue) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as avg_revenue
          FROM crops c
          JOIN farm_members fm ON c.farm_id = fm.farm_id
          JOIN farms fa ON c.farm_id = fa.id
          LEFT JOIN fields f ON c.field_id = f.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];

        // Add filters
        if (fieldId) {
          query += ' AND c.field_id = ?';
          params.push(fieldId);
        }
        if (status) {
          query += ' AND c.status = ?';
          params.push(status);
        }

        query += ' ORDER BY c.planting_date DESC';

        const { results: crops, error } = await env.DB.prepare(query).bind(...params).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(crops || []);

      } else {
        // Standard crops list with enhanced data
        let query = `
          SELECT 
            c.*,
            f.name as field_name,
            fa.name as farm_name
          FROM crops c
          JOIN farm_members fm ON c.farm_id = fm.farm_id
          JOIN farms fa ON c.farm_id = fa.id
          LEFT JOIN fields f ON c.field_id = f.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];

        if (fieldId) {
          query += ' AND c.field_id = ?';
          params.push(fieldId);
        }

        query += ' ORDER BY c.created_at DESC';

        const { results: crops, error } = await env.DB.prepare(query).bind(...params).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(crops || []);
      }

    } else if (method === 'POST') {
      // Create crop with enhanced data
      const body = await request.json();
      const { 
        farm_id,
        field_id,
        crop_type, 
        crop_variety,
        planting_date,
        expected_yield,
        seeds_used,
        fertilizer_type,
        irrigation_schedule,
        pest_control_schedule,
        soil_preparation,
        weather_requirements,
        target_weight,
        notes
      } = body;

      if (!farm_id || !crop_type) {
        return createErrorResponse('Farm ID and crop type are required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO crops (
          farm_id, field_id, crop_type, crop_variety, planting_date,
          expected_yield, seeds_used, fertilizer_type, irrigation_schedule,
          pest_control_schedule, soil_preparation, weather_requirements,
          target_weight, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id, field_id || null, crop_type, crop_variety || null, planting_date || null,
        expected_yield || null, seeds_used || null, fertilizer_type || null,
        irrigation_schedule || null, pest_control_schedule || null,
        soil_preparation || null, weather_requirements || null,
        target_weight || null, notes || null
      ).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create crop', 500);
      }

      // Get the created crop
      const { results: cropResults } = await env.DB.prepare(`
        SELECT 
          c.*,
          f.name as field_name,
          fa.name as farm_name
        FROM crops c
        JOIN farms fa ON c.farm_id = fa.id
        LEFT JOIN fields f ON c.field_id = f.id
        WHERE c.rowid = last_insert_rowid()
      `).all();

      const newCrop = cropResults[0];

      // Create initial activity record
      await env.DB.prepare(`
        INSERT INTO crop_activities (crop_id, activity_type, activity_date, description)
        VALUES (?, 'planted', ?, ?)
      `).bind(newCrop.id, new Date().toISOString().split('T')[0], `Planted ${crop_type}${crop_variety ? ' (' + crop_variety + ')' : ''}`).run();

  return createSuccessResponse(newCrop, 201);

    } else if (method === 'PUT') {
      // Update crop with enhanced data
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse('Crop ID required', 400);
      }

      // Get the crop and check farm access
      const { results: existingCrops } = await env.DB.prepare(`
        SELECT c.farm_id, c.status
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();

      if (existingCrops.length === 0) {
        return createErrorResponse('Crop not found or access denied', 404);
      }

      const existingCrop = existingCrops[0];

      const updateFields = [];
      const updateValues = [];

      // Handle all possible update fields
      const allowedFields = [
        'field_id', 'crop_type', 'crop_variety', 'planting_date', 'harvest_date',
        'expected_yield', 'actual_yield', 'seeds_used', 'fertilizer_type',
        'irrigation_schedule', 'pest_control_schedule', 'soil_preparation',
        'weather_requirements', 'growth_stage', 'status', 'current_weight',
        'target_weight', 'health_status', 'last_inspection_date', 'notes'
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
        UPDATE crops 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...updateValues).run();

      if (updateError) {
        console.error('Update error:', updateError);
        return createErrorResponse('Failed to update crop', 500);
      }

      // Log activity for status changes
      if (updateData.status && updateData.status !== existingCrop.status) {
        await env.DB.prepare(`
          INSERT INTO crop_activities (crop_id, activity_type, activity_date, description)
          VALUES (?, ?, ?, ?)
        `).bind(id, 'status_changed', new Date().toISOString().split('T')[0], `Status changed to ${updateData.status}`).run();
      }

      // Get updated crop
      const { results: cropResults } = await env.DB.prepare(`
        SELECT 
          c.*,
          f.name as field_name,
          fa.name as farm_name
        FROM crops c
        JOIN farms fa ON c.farm_id = fa.id
        LEFT JOIN fields f ON c.field_id = f.id
        WHERE c.id = ?
      `).bind(id).all();

      return createSuccessResponse(cropResults[0]);

    } else if (method === 'DELETE') {
      // Enhanced delete with dependency checks
      const cropId = url.searchParams.get('id');

      if (!cropId) {
        return createErrorResponse('Crop ID required', 400);
      }

      // Get the crop and check farm access
      const { results: existingCrops } = await env.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(cropId, user.id).all();

      if (existingCrops.length === 0) {
        return createErrorResponse('Crop not found or access denied', 404);
      }

      // Check for dependencies
      const { results: dependencies } = await env.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM irrigation_schedules WHERE crop_id = ?) as irrigation_schedules,
          (SELECT COUNT(*) FROM crop_yield_records WHERE crop_id = ?) as yield_records
      `).bind(cropId, cropId).all();

      const dep = dependencies[0];
      if (dep.irrigation_schedules > 0 || dep.yield_records > 0) {
        return createErrorResponse(
          'Cannot delete crop with existing schedules or yield records. Please archive instead.', 
          400
        );
      }

      const { error: deleteError } = await env.DB.prepare(`
        DELETE FROM crops WHERE id = ?
      `).bind(cropId).run();

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return createErrorResponse('Failed to delete crop', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Crops API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Crop Activities Management
export async function onRequestActivities(context) {
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
      const cropId = url.searchParams.get('crop_id');
      const limit = url.searchParams.get('limit') || '20';

      if (!cropId) {
        return createErrorResponse('Crop ID required', 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(cropId, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      const { results, error } = await env.DB.prepare(`
        SELECT * FROM crop_activities 
        WHERE crop_id = ? 
        ORDER BY activity_date DESC 
        LIMIT ?
      `).bind(cropId, parseInt(limit)).all();

      if (error) {
        console.error('Activities error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(results);

    } else if (method === 'POST') {
      const body = await request.json();
      const { crop_id, activity_type, activity_date, description, cost, weather_conditions } = body;

      if (!crop_id || !activity_type || !activity_date) {
        return createErrorResponse('Crop ID, activity type, and date required', 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(crop_id, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO crop_activities (
          crop_id, activity_type, activity_date, description,
          cost, worker_id, weather_conditions
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crop_id,
        activity_type,
        activity_date,
        description || '',
        cost || 0,
        user.id,
        weather_conditions || ''
      ).run();

      if (error) {
        console.error('Activity insert error:', error);
        return createErrorResponse('Failed to create activity', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Activities API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Crop Observations Management
export async function onRequestObservations(context) {
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
      const cropId = url.searchParams.get('crop_id');
      const limit = url.searchParams.get('limit') || '10';

      if (!cropId) {
        return createErrorResponse('Crop ID required', 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(cropId, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      const { results, error } = await env.DB.prepare(`
        SELECT * FROM crop_observations 
        WHERE crop_id = ? 
        ORDER BY observation_date DESC 
        LIMIT ?
      `).bind(cropId, parseInt(limit)).all();

      if (error) {
        console.error('Observations error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(results);

    } else if (method === 'POST') {
      const body = await request.json();
      const { 
        crop_id, 
        observation_date, 
        growth_stage, 
        health_status, 
        height_cm, 
        leaf_count,
        pest_presence, 
        disease_signs, 
        soil_moisture, 
        photos, 
        notes 
      } = body;

      if (!crop_id || !observation_date) {
        return createErrorResponse('Crop ID and observation date required', 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT c.farm_id 
        FROM crops c
        JOIN farm_members fm ON c.farm_id = fm.farm_id
        WHERE c.id = ? AND fm.user_id = ?
      `).bind(crop_id, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO crop_observations (
          crop_id, observation_date, growth_stage, health_status,
          height_cm, leaf_count, pest_presence, disease_signs,
          soil_moisture, photos, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crop_id,
        observation_date,
        growth_stage || null,
        health_status || null,
        height_cm || null,
        leaf_count || null,
        pest_presence ? 1 : 0,
        disease_signs || null,
        soil_moisture || null,
        photos || null,
        notes || null
      ).run();

      if (error) {
        console.error('Observation insert error:', error);
        return createErrorResponse('Failed to create observation', 500);
      }

      // Update crop health status and last inspection date
      if (health_status) {
        await env.DB.prepare(`
          UPDATE crops 
          SET health_status = ?, last_inspection_date = ?
          WHERE id = ?
        `).bind(health_status, observation_date, crop_id).run();
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Observations API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}