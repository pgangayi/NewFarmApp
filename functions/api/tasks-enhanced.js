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

    // Enhanced tasks listing with comprehensive data
    if (method === 'GET') {
      const taskId = url.searchParams.get('id');
      const analytics = url.searchParams.get('analytics');
      const timeLogs = url.searchParams.get('time_logs');
      const comments = url.searchParams.get('comments');
      const status = url.searchParams.get('status');
      const priority = url.searchParams.get('priority');
      const assignedTo = url.searchParams.get('assigned_to');
      const dueDateFrom = url.searchParams.get('due_date_from');
      const dueDateTo = url.searchParams.get('due_date_to');
      const category = url.searchParams.get('category');

      if (taskId) {
        // Get specific task with comprehensive data
        const { results: taskResults, error } = await env.DB.prepare(`
          SELECT 
            t.*,
            fa.name as farm_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name,
            COUNT(DISTINCT tl.id) as time_log_count,
            SUM(tl.total_hours) as total_logged_hours,
            COUNT(DISTINCT tc.id) as comment_count
          FROM tasks t
          JOIN farm_members fm ON t.farm_id = fm.farm_id
          JOIN farms fa ON t.farm_id = fa.id
          LEFT JOIN users creator ON t.created_by = creator.id
          LEFT JOIN users assignee ON t.assigned_to = assignee.id
          LEFT JOIN task_time_logs tl ON t.id = tl.task_id
          LEFT JOIN task_comments tc ON t.id = tc.task_id
          WHERE t.id = ? AND fm.user_id = ?
          GROUP BY t.id
        `).bind(taskId, user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        const task = taskResults[0];
        if (!task) {
          return createErrorResponse('Task not found or access denied', 404);
        }

        // Get time logs if requested
        if (timeLogs === 'true') {
          const { results: timeResults } = await env.DB.prepare(`
            SELECT 
              tl.*,
              u.name as user_name
            FROM task_time_logs tl
            JOIN users u ON tl.user_id = u.id
            WHERE tl.task_id = ?
            ORDER BY tl.start_time DESC
          `).bind(taskId).all();
          
          task.time_logs = timeResults;
        }

        // Get comments if requested
        if (comments === 'true') {
          const { results: commentResults } = await env.DB.prepare(`
            SELECT 
              tc.*,
              u.name as user_name
            FROM task_comments tc
            JOIN users u ON tc.user_id = u.id
            WHERE tc.task_id = ?
            ORDER BY tc.created_at DESC
          `).bind(taskId).all();
          
          task.comments = commentResults;
        }

        return createSuccessResponse(task);

      } else if (analytics === 'true') {
        // Get tasks with analytics data
        let query = `
          SELECT 
            t.*,
            fa.name as farm_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name,
            COUNT(DISTINCT tl.id) as time_log_count,
            SUM(tl.total_hours) as total_logged_hours,
            CASE 
              WHEN t.status = 'completed' AND t.due_date IS NOT NULL 
                   AND date(t.updated_at) <= date(t.due_date) 
              THEN 1 
              ELSE 0 
            END as on_time_completion,
            CASE 
              WHEN t.status = 'completed' THEN julianday(t.updated_at) - julianday(t.created_at)
              ELSE NULL 
            END as actual_completion_days
          FROM tasks t
          JOIN farm_members fm ON t.farm_id = fm.farm_id
          JOIN farms fa ON t.farm_id = fa.id
          LEFT JOIN users creator ON t.created_by = creator.id
          LEFT JOIN users assignee ON t.assigned_to = assignee.id
          LEFT JOIN task_time_logs tl ON t.id = tl.task_id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];

        // Add filters
        if (status) {
          query += ' AND t.status = ?';
          params.push(status);
        }
        if (priority) {
          query += ' AND t.priority = ?';
          params.push(priority);
        }
        if (category) {
          query += ' AND t.task_category = ?';
          params.push(category);
        }
        if (assignedTo) {
          query += ' AND t.assigned_to = ?';
          params.push(assignedTo);
        }
        if (dueDateFrom) {
          query += ' AND date(t.due_date) >= ?';
          params.push(dueDateFrom);
        }
        if (dueDateTo) {
          query += ' AND date(t.due_date) <= ?';
          params.push(dueDateTo);
        }

        query += ' GROUP BY t.id ORDER BY t.due_date ASC, t.created_at DESC';

        const { results: tasks, error } = await env.DB.prepare(query).bind(...params).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(tasks || []);

      } else {
        // Standard tasks list with enhanced data
        let query = `
          SELECT 
            t.*,
            fa.name as farm_name,
            creator.name as created_by_name,
            assignee.name as assigned_to_name
          FROM tasks t
          JOIN farm_members fm ON t.farm_id = fm.farm_id
          JOIN farms fa ON t.farm_id = fa.id
          LEFT JOIN users creator ON t.created_by = creator.id
          LEFT JOIN users assignee ON t.assigned_to = assignee.id
          WHERE fm.user_id = ?
        `;
        const params = [user.id];

        // Add filters
        if (status) {
          query += ' AND t.status = ?';
          params.push(status);
        }
        if (priority) {
          query += ' AND t.priority = ?';
          params.push(priority);
        }
        if (category) {
          query += ' AND t.task_category = ?';
          params.push(category);
        }

        query += ' ORDER BY t.due_date ASC, t.created_at DESC';

        const { results: tasks, error } = await env.DB.prepare(query).bind(...params).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(tasks || []);
      }

    } else if (method === 'POST') {
      // Create task with enhanced data
      const body = await request.json();
      const { 
        farm_id,
        title, 
        description,
        status,
        priority,
        due_date,
        assigned_to,
        priority_score,
        estimated_duration,
        actual_duration,
        dependencies,
        resource_requirements,
        task_category,
        recurring_pattern,
        completion_criteria,
        progress_percentage,
        tags,
        location
      } = body;

      if (!farm_id || !title) {
        return createErrorResponse('Farm ID and title are required', 400);
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
        INSERT INTO tasks (
          farm_id, title, description, status, priority, due_date, assigned_to,
          created_by, priority_score, estimated_duration, actual_duration,
          dependencies, resource_requirements, task_category, recurring_pattern,
          completion_criteria, progress_percentage, tags, location
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id, title, description || null, status || 'pending', 
        priority || 'medium', due_date || null, assigned_to || null,
        user.id, priority_score || null, estimated_duration || null,
        actual_duration || null, dependencies || null, resource_requirements || null,
        task_category || null, recurring_pattern || null, completion_criteria || null,
        progress_percentage || 0, tags || null, location || null
      ).run();

      if (insertError) {
        console.error('Insert error:', insertError);
        return createErrorResponse('Failed to create task', 500);
      }

      // Get the created task
      const { results: taskResults } = await env.DB.prepare(`
        SELECT 
          t.*,
          fa.name as farm_name,
          creator.name as created_by_name,
          assignee.name as assigned_to_name
        FROM tasks t
        JOIN farms fa ON t.farm_id = fa.id
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.rowid = last_insert_rowid()
      `).all();

      const newTask = taskResults[0];

      // Add creator as collaborator
      await env.DB.prepare(`
        INSERT INTO task_collaborators (task_id, user_id, role, invited_by)
        VALUES (?, ?, 'assignee', ?)
      `).bind(newTask.id, user.id, user.id).run();

      return createSuccessResponse(newTask);

    } else if (method === 'PUT') {
      // Update task with enhanced data
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse('Task ID required', 400);
      }

      // Get the task and check farm access
      const { results: existingTasks } = await env.DB.prepare(`
        SELECT t.farm_id, t.title
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        WHERE t.id = ? AND fm.user_id = ?
      `).bind(id, user.id).all();

      if (existingTasks.length === 0) {
        return createErrorResponse('Task not found or access denied', 404);
      }

      const updateFields = [];
      const updateValues = [];

      // Handle all possible update fields
      const allowedFields = [
        'title', 'description', 'status', 'priority', 'due_date', 'assigned_to',
        'priority_score', 'estimated_duration', 'actual_duration', 'dependencies',
        'resource_requirements', 'task_category', 'recurring_pattern', 'completion_criteria',
        'progress_percentage', 'tags', 'location'
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
        UPDATE tasks 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).bind(...updateValues).run();

      if (updateError) {
        console.error('Update error:', updateError);
        return createErrorResponse('Failed to update task', 500);
      }

      // Handle progress percentage change
      if (updateData.progress_percentage !== undefined) {
        const progress = updateData.progress_percentage;
        if (progress >= 100 && !updateData.status) {
          // Auto-complete task when progress reaches 100%
          await env.DB.prepare(`
            UPDATE tasks 
            SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).bind(id).run();
        }
      }

      // Get updated task
      const { results: taskResults } = await env.DB.prepare(`
        SELECT 
          t.*,
          fa.name as farm_name,
          creator.name as created_by_name,
          assignee.name as assigned_to_name
        FROM tasks t
        JOIN farms fa ON t.farm_id = fa.id
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.id = ?
      `).bind(id).all();

      return createSuccessResponse(taskResults[0]);

    } else if (method === 'DELETE') {
      // Enhanced delete with dependency checks
      const taskId = url.searchParams.get('id');

      if (!taskId) {
        return createErrorResponse('Task ID required', 400);
      }

      // Get the task and check farm access
      const { results: existingTasks } = await env.DB.prepare(`
        SELECT t.farm_id, t.title
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        WHERE t.id = ? AND fm.user_id = ?
      `).bind(taskId, user.id).all();

      if (existingTasks.length === 0) {
        return createErrorResponse('Task not found or access denied', 404);
      }

      // Check for dependencies (tasks that depend on this one)
      const { results: dependencies } = await env.DB.prepare(`
        SELECT COUNT(*) as dep_count FROM tasks 
        WHERE dependencies LIKE '%' || ? || '%'
      `).bind(taskId).all();

      if (dependencies[0].dep_count > 0) {
        return createErrorResponse(
          'Cannot delete task with dependent tasks. Please update dependencies first.', 
          400
        );
      }

      const { error: deleteError } = await env.DB.prepare(`
        DELETE FROM tasks WHERE id = ?
      `).bind(taskId).run();

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return createErrorResponse('Failed to delete task', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Tasks API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Task Templates Management
export async function onRequestTemplates(context) {
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
      const templateId = url.searchParams.get('id');

      if (templateId) {
        // Get specific template
        const { results, error } = await env.DB.prepare(`
          SELECT 
            tt.*,
            fa.name as farm_name,
            creator.name as created_by_name
          FROM task_templates tt
          JOIN farms fa ON tt.farm_id = fa.id
          LEFT JOIN users creator ON tt.created_by = creator.id
          WHERE tt.id = ? AND fa.owner_id = ?
        `).bind(templateId, user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        const template = results[0];
        if (!template) {
          return createErrorResponse('Template not found or access denied', 404);
        }

        return createSuccessResponse(template);

      } else {
        // Get templates list
        const { results, error } = await env.DB.prepare(`
          SELECT 
            tt.*,
            fa.name as farm_name,
            creator.name as created_by_name
          FROM task_templates tt
          JOIN farms fa ON tt.farm_id = fa.id
          LEFT JOIN users creator ON tt.created_by = creator.id
          WHERE fa.owner_id = ?
          ORDER BY tt.category, tt.template_name
        `).bind(user.id).all();

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Database error', 500);
        }

        return createSuccessResponse(results);
      }

    } else if (method === 'POST') {
      const body = await request.json();
      const { 
        farm_id,
        template_name,
        category,
        description,
        estimated_duration,
        required_resources,
        priority_level,
        dependencies,
        instructions
      } = body;

      if (!farm_id || !template_name || !category) {
        return createErrorResponse('Farm ID, template name, and category are required', 400);
      }

      // Check if user has access to this farm
      if (!await auth.hasFarmAccess(user.id, farm_id)) {
        return createErrorResponse('Farm not found or access denied', 404);
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO task_templates (
          farm_id, template_name, category, description, estimated_duration,
          required_resources, priority_level, dependencies, instructions, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        farm_id, template_name, category, description || null,
        estimated_duration || null, required_resources || null, priority_level || null,
        dependencies || null, instructions || null, user.id
      ).run();

      if (error) {
        console.error('Template insert error:', error);
        return createErrorResponse('Failed to create template', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Templates API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// Task Time Logging
export async function onRequestTimeLogs(context) {
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
      const taskId = url.searchParams.get('task_id');
      const dateFrom = url.searchParams.get('date_from');
      const dateTo = url.searchParams.get('date_to');

      if (!taskId) {
        return createErrorResponse('Task ID required', 400);
      }

      // Check access to the task
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT t.id
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        WHERE t.id = ? AND fm.user_id = ?
      `).bind(taskId, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      let query = `
        SELECT 
          tl.*,
          u.name as user_name
        FROM task_time_logs tl
        JOIN users u ON tl.user_id = u.id
        WHERE tl.task_id = ?
      `;
      const params = [taskId];

      if (dateFrom) {
        query += ' AND date(tl.start_time) >= ?';
        params.push(dateFrom);
      }
      if (dateTo) {
        query += ' AND date(tl.start_time) <= ?';
        params.push(dateTo);
      }

      query += ' ORDER BY tl.start_time DESC';

      const { results, error } = await env.DB.prepare(query).bind(...params).all();

      if (error) {
        console.error('Time logs error:', error);
        return createErrorResponse('Database error', 500);
      }

      return createSuccessResponse(results);

    } else if (method === 'POST') {
      const body = await request.json();
      const { task_id, start_time, end_time, break_time, work_notes, productivity_rating, interruptions_count } = body;

      if (!task_id) {
        return createErrorResponse('Task ID required', 400);
      }

      // Check access to the task
      const { results: accessCheck } = await env.DB.prepare(`
        SELECT t.id
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        WHERE t.id = ? AND fm.user_id = ?
      `).bind(task_id, user.id).all();

      if (accessCheck.length === 0) {
        return createErrorResponse('Access denied', 403);
      }

      // Calculate total hours
      let totalHours = 0;
      if (start_time && end_time) {
        const start = new Date(start_time);
        const end = new Date(end_time);
        totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert to hours
        totalHours = Math.max(0, totalHours - (break_time || 0));
      }

      const { error } = await env.DB.prepare(`
        INSERT INTO task_time_logs (
          task_id, user_id, start_time, end_time, break_time, total_hours,
          work_notes, productivity_rating, interruptions_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        task_id, user.id, start_time || null, end_time || null,
        break_time || 0, totalHours, work_notes || null,
        productivity_rating || null, interruptions_count || 0
      ).run();

      if (error) {
        console.error('Time log insert error:', error);
        return createErrorResponse('Failed to create time log', 500);
      }

      return createSuccessResponse({ success: true });

    } else {
      return createErrorResponse('Method not allowed', 405);
    }

  } catch (error) {
    console.error('Time logs API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}