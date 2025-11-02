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

    if (method === 'GET') {
      // List fields for user's farms
      const { results: fields, error } = await env.DB.prepare(`
        SELECT 
          f.id,
          f.name,
          f.area_hectares,
          f.crop_type,
          f.notes,
          f.created_at,
          f.updated_at,
          fa.name as farm_name
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

    } else if (method === 'POST') {
      // Create field
      const body = await request.json();
      const { farm_id, name, area_hectares, crop_type, notes } = body;

      if (!farm_id || !name) {
        return createErrorResponse('Farm ID and name required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO fields (farm_id, name, area_hectares, crop_type, notes)
        VALUES (?, ?, ?, ?, ?)
      `).bind(farm_id, name, area_hectares || null, crop_type || null, notes || null).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create field', 500);
      }

      // Get the created field with farm name
      const { results: fieldResults } = await env.DB.prepare(`
        SELECT 
          f.id,
          f.name,
          f.area_hectares,
          f.crop_type,
          f.notes,
          f.created_at,
          f.updated_at,
          fa.name as farm_name
        FROM fields f
        JOIN farms fa ON f.farm_id = fa.id
        WHERE f.rowid = last_insert_rowid()
      `).all();

      const newField = fieldResults[0];

      return createSuccessResponse(newField);

    } else if (method === 'PUT') {
      // Update field
      const body = await request.json();
      const { id, name, area_hectares, crop_type, notes } = body;

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

      const farm_id = existingFields[0].farm_id;

      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (area_hectares !== undefined) {
        updateFields.push('area_hectares = ?');
        updateValues.push(area_hectares);
      }
      if (crop_type !== undefined) {
        updateFields.push('crop_type = ?');
        updateValues.push(crop_type);
      }
      if (notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
      }

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

      // Get updated field
      const { results: fieldResults } = await env.DB.prepare(`
        SELECT 
          f.id,
          f.name,
          f.area_hectares,
          f.crop_type,
          f.notes,
          f.created_at,
          f.updated_at,
          fa.name as farm_name
        FROM fields f
        JOIN farms fa ON f.farm_id = fa.id
        WHERE f.id = ?
      `).bind(id).all();

      return createSuccessResponse(fieldResults[0]);

    } else if (method === 'DELETE') {
      // Delete field
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
    console.error('Fields API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}