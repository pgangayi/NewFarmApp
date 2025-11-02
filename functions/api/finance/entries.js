import { AuthUtils, createUnauthorizedResponse, createErrorResponse, createSuccessResponse } from '../_auth.js';

export async function onRequest(context) {
  const { request, env } = context;
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
      // List finance entries for user's farms
      const { results: financeEntries, error } = await env.DB.prepare(`
        SELECT 
          fe.id,
          fe.entry_date,
          fe.type,
          fe.amount,
          fe.currency,
          fe.account,
          fe.description,
          fe.reference_type,
          fe.reference_id,
          fe.created_at,
          fa.name as farm_name
        FROM finance_entries fe
        JOIN farm_members fm ON fe.farm_id = fm.farm_id
        JOIN farms fa ON fe.farm_id = fa.id
        WHERE fm.user_id = ?
        ORDER BY fe.entry_date DESC, fe.created_at DESC
      `).bind(user.id).all();

      if (error) {
        console.error('Database error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(financeEntries || []);

    } else if (method === 'POST') {
      // Create finance entry
      const body = await request.json();
      const { farm_id, entry_date, type, amount, currency, account, description, reference_type, reference_id } = body;

      if (!farm_id || !type || !amount) {
        return createErrorResponse('Farm ID, type, and amount required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO finance_entries (farm_id, entry_date, type, amount, currency, account, description, reference_type, reference_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        entry_date || new Date().toISOString().split('T')[0], // Default to today's date
        type,
        amount,
        currency || 'USD',
        account || null,
        description || null,
        reference_type || null,
        reference_id || null,
        user.id
      ).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create finance entry', 500);
      }

      // Get the created entry with farm name
      const { results: entryResults } = await env.DB.prepare(`
        SELECT 
          fe.id,
          fe.entry_date,
          fe.type,
          fe.amount,
          fe.currency,
          fe.account,
          fe.description,
          fe.reference_type,
          fe.reference_id,
          fe.created_at,
          fa.name as farm_name
        FROM finance_entries fe
        JOIN farms fa ON fe.farm_id = fa.id
        WHERE fe.rowid = last_insert_rowid()
      `).all();

      const newEntry = entryResults[0];

      return createSuccessResponse(newEntry);

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Finance entries API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}