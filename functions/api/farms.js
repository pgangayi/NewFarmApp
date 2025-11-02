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
      console.error('User not authenticated');
      return createUnauthorizedResponse();
    }

    console.log('Farms endpoint - user:', user.id, 'method:', method);

    if (method === 'GET') {
      // List farms for user
      console.log('Querying farms for user:', user.id);
      
      try {
        const query = `
          SELECT 
            id, 
            name, 
            location, 
            area_hectares, 
            created_at,
            updated_at
          FROM farms 
          WHERE owner_id = ?
          ORDER BY created_at DESC
        `;
        
        const { results: farms, error } = await env.DB.prepare(query).bind(user.id).all();

        console.log('Query results:', { farms, error });

        if (error) {
          console.error('Database error:', error);
          return new Response(JSON.stringify({ 
            error: 'Database error', 
            details: error,
            query: query
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        console.log('Returning farms:', farms ? farms.length : 0);
        return createSuccessResponse(farms || []);
      } catch (err) {
        console.error('GET farms exception:', err.message);
        return new Response(JSON.stringify({ 
          error: 'Exception in GET farms',
          message: err.message,
          stack: err.stack
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } else if (method === 'POST') {
      // Create farm
      const body = await request.json();
      const { name, location, area_hectares } = body;

      if (!name || !location) {
        return createErrorResponse('Name and location required', 400);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO farms (name, location, area_hectares, owner_id)
        VALUES (?, ?, ?, ?)
      `).bind(name, location, area_hectares || null, user.id).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create farm', 500);
      }

      // Get the created farm
      const { results: farmResults } = await env.DB.prepare(`
        SELECT id, name, location, area_hectares, created_at, updated_at
        FROM farms 
        WHERE rowid = last_insert_rowid()
      `).all();

      const newFarm = farmResults[0];

      // Grant owner access to the creator
      await auth.grantFarmAccess(newFarm.id, user.id, 'owner');

      return createSuccessResponse(newFarm);

    } else if (method === 'PUT') {
      // Update farm (if needed)
      const body = await request.json();
      const { id, name, location, area_hectares } = body;

      if (!id) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (location !== undefined) {
        updateFields.push('location = ?');
        updateValues.push(location);
      }
      if (area_hectares !== undefined) {
        updateFields.push('area_hectares = ?');
        updateValues.push(area_hectares);
      }

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

      // Get updated farm
      const { results: farmResults } = await env.DB.prepare(`
        SELECT id, name, location, area_hectares, created_at, updated_at
        FROM farms 
        WHERE id = ?
      `).bind(id).all();

      return createSuccessResponse(farmResults[0]);

    } else if (method === 'DELETE') {
      // Delete farm
      const url = new URL(request.url);
      const farmId = url.searchParams.get('id');

      if (!farmId) {
        return createErrorResponse('Farm ID required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farmId)) {
        return createErrorResponse('Farm not found or access denied', 404);
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
    console.error('Farm API error:', error.message, error.stack);
    return createErrorResponse('Internal server error: ' + error.message, 500);
  }
}