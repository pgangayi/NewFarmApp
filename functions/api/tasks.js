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
      // List tasks for user's farms
      const { results: tasks, error } = await env.DB.prepare(`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date,
          t.created_at,
          t.updated_at,
          fa.name as farm_name,
          assignee.name as assigned_to_name
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        JOIN farms fa ON t.farm_id = fa.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE fm.user_id = ?
        ORDER BY t.due_date ASC, t.created_at DESC
      `).bind(user.id).all();

      if (error) {
        console.error('Database error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(tasks || []);

    } else if (method === 'POST') {
      // Create task
      const body = await request.json();
      const { farm_id, title, description, status, priority, due_date, assigned_to } = body;

      if (!farm_id || !title) {
        return createErrorResponse('Farm ID and title required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      // If assigning to someone, verify they have access to the farm
      if (assigned_to && !await auth.hasFarmAccess(assigned_to, farm_id)) {
        return createErrorResponse('Assigned user does not have access to this farm', 400);
      }

      const { results, error: insertError } = await env.DB.prepare(`
        INSERT INTO tasks (farm_id, title, description, status, priority, due_date, assigned_to, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id,
        title,
        description || null,
        status || 'pending',
        priority || 'medium',
        due_date || null,
        assigned_to || null,
        user.id
      ).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create task', 500);
      }

      // Get the created task with farm name and assignee name
      const { results: taskResults } = await env.DB.prepare(`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.due_date,
          t.created_at,
          t.updated_at,
          fa.name as farm_name,
          assignee.name as assigned_to_name
        FROM tasks t
        JOIN farms fa ON t.farm_id = fa.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.rowid = last_insert_rowid()
      `).all();

      const newTask = taskResults[0];

      return createSuccessResponse(newTask);

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Tasks API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}