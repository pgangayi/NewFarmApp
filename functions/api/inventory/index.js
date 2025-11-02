import { AuthUtils, createUnauthorizedResponse, createErrorResponse, createSuccessResponse } from '../_auth.js';

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
      // List inventory items for user's farms
      const { results: inventoryItems, error } = await env.DB.prepare(`
        SELECT 
          ii.id,
          ii.name,
          ii.sku,
          ii.qty,
          ii.unit,
          ii.reorder_threshold,
          ii.created_at,
          ii.updated_at,
          fa.name as farm_name
        FROM inventory_items ii
        JOIN farm_members fm ON ii.farm_id = fm.farm_id
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE fm.user_id = ?
        ORDER BY ii.created_at DESC
      `).bind(user.id).all();

      if (error) {
        console.error('Database error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(inventoryItems || []);

    } else if (method === 'POST') {
      // Create inventory item
      const body = await request.json();
      const { farm_id, name, sku, qty, unit, reorder_threshold } = body;

      if (!farm_id || !name) {
        return createErrorResponse('Farm ID and name required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO inventory_items (farm_id, name, sku, qty, unit, reorder_threshold)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id, 
        name, 
        sku || null, 
        qty || 0, 
        unit || 'units', 
        reorder_threshold || 0
      ).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create inventory item', 500);
      }

      // Get the created item with farm name
      const { results: itemResults } = await env.DB.prepare(`
        SELECT 
          ii.id,
          ii.name,
          ii.sku,
          ii.qty,
          ii.unit,
          ii.reorder_threshold,
          ii.created_at,
          ii.updated_at,
          fa.name as farm_name
        FROM inventory_items ii
        JOIN farms fa ON ii.farm_id = fa.id
        WHERE ii.rowid = last_insert_rowid()
      `).all();

      const newItem = itemResults[0];

      return createSuccessResponse(newItem);

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Inventory API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}