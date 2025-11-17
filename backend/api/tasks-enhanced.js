/**
 * Enhanced Tasks API - Comprehensive Task Management
 * Phase 5: Repository Pattern Migration
 *
 * DEPRECATION NOTICE: This endpoint has been migrated to use the TaskRepository pattern
 * for enhanced security, performance, and audit capabilities.
 *
 * Migration Date: November 13, 2025
 * Status: Legacy - Redirecting to TaskRepository-based implementation
 *
 * This file maintains backward compatibility while redirecting to the new implementation.
 * It will be removed in the next major version.
 */

import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { TaskRepository } from "./repositories/index.js";
import { DatabaseOperations } from "./_database.js";

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

    // Initialize repository with DatabaseOperations
    const dbOps = new DatabaseOperations(env);
    const taskRepository = new TaskRepository(dbOps);

    // Enhanced tasks listing with comprehensive data
    if (method === "GET") {
      const taskId = url.searchParams.get("id");
      const analytics = url.searchParams.get("analytics");
      const timeLogs = url.searchParams.get("time_logs");
      const comments = url.searchParams.get("comments");
      const status = url.searchParams.get("status");
      const priority = url.searchParams.get("priority");
      const assignedTo = url.searchParams.get("assigned_to");
      const dueDateFrom = url.searchParams.get("due_date_from");
      const dueDateTo = url.searchParams.get("due_date_to");
      const category = url.searchParams.get("category");
      const farmId = url.searchParams.get("farm_id");
      const search = url.searchParams.get("search");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(
        parseInt(url.searchParams.get("limit") || "100"),
        1000
      );

      if (taskId) {
        // Get specific task with comprehensive data using TaskRepository
        const task = await taskRepository.findByIdWithDetails(taskId, user.id);
        if (!task) {
          return createErrorResponse("Task not found or access denied", 404);
        }

        // Get time logs if requested (placeholder for now - would need TimeLogRepository)
        if (timeLogs === "true") {
          // TODO: Implement time logs with TimeLogRepository
          task.time_logs = [];
        }

        // Get comments if requested (placeholder for now - would need CommentRepository)
        if (comments === "true") {
          // TODO: Implement comments with CommentRepository
          task.comments = [];
        }

        return createSuccessResponse(task);
      } else {
        // List tasks using TaskRepository
        const filters = {
          status,
          priority,
          task_category: category,
          assigned_to: assignedTo,
          farm_id: farmId,
          due_date_from: dueDateFrom,
          due_date_to: dueDateTo,
          search,
        };

        // Remove null values from filters
        Object.keys(filters).forEach((key) => {
          if (filters[key] === null) {
            delete filters[key];
          }
        });

        const options = {
          sortBy: "due_date",
          sortDirection: "ASC",
          page,
          limit,
        };

        const tasks = await taskRepository.findByUserAccess(
          user.id,
          filters,
          options
        );

        // If analytics is requested, enhance with analytics data
        if (analytics === "true" && farmId) {
          const dateFrom = url.searchParams.get("date_from");
          const dateTo = url.searchParams.get("date_to");
          const analyticsData = await taskRepository.getTaskAnalytics(
            farmId,
            user.id,
            dateFrom,
            dateTo
          );

          return createSuccessResponse({
            tasks,
            analytics: analyticsData,
            enhanced: true,
          });
        }

        return createSuccessResponse(tasks || []);
      }
    } else if (method === "POST") {
      // Create task with enhanced data using TaskRepository
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
        location,
      } = body;

      if (!farm_id || !title) {
        return createErrorResponse("Farm ID and title are required", 400);
      }

      const taskData = {
        farm_id,
        title,
        description,
        status: status || "pending",
        priority: priority || "medium",
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
        location,
      };

      const newTask = await taskRepository.createTask(taskData, user.id);

      return createSuccessResponse(newTask);
    } else if (method === "PUT") {
      // Update task with enhanced data using TaskRepository
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse("Task ID required", 400);
      }

      const updatedTask = await taskRepository.updateTask(
        id,
        updateData,
        user.id
      );

      return createSuccessResponse(updatedTask);
    } else if (method === "DELETE") {
      // Enhanced delete with dependency checks using TaskRepository
      const taskId = url.searchParams.get("id");

      if (!taskId) {
        return createErrorResponse("Task ID required", 400);
      }

      const result = await taskRepository.deleteTask(taskId, user.id);

      return createSuccessResponse(result);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Enhanced Tasks API error:", error);

    // Handle specific TaskRepository errors
    if (error.message.includes("Farm not found or access denied")) {
      return createErrorResponse("Farm not found or access denied", 404);
    }

    if (error.message.includes("Assigned user does not have access")) {
      return createErrorResponse(
        "Assigned user does not have access to this farm",
        400
      );
    }

    if (error.message.includes("Task not found")) {
      return createErrorResponse("Task not found or access denied", 404);
    }

    if (error.message.includes("Cannot delete task with dependent tasks")) {
      return createErrorResponse(
        "Cannot delete task with dependent tasks. Please update dependencies first.",
        400
      );
    }

    return createErrorResponse("Internal server error", 500);
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

    if (method === "GET") {
      const templateId = url.searchParams.get("id");

      if (templateId) {
        // Get specific template
        const { results, error } = await env.DB.prepare(
          `
          SELECT 
            tt.*,
            fa.name as farm_name,
            creator.name as created_by_name
          FROM task_templates tt
          JOIN farms fa ON tt.farm_id = fa.id
          LEFT JOIN users creator ON tt.created_by = creator.id
          WHERE tt.id = ? AND fa.owner_id = ?
        `
        )
          .bind(templateId, user.id)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        const template = results[0];
        if (!template) {
          return createErrorResponse(
            "Template not found or access denied",
            404
          );
        }

        return createSuccessResponse(template);
      } else {
        // Get templates list
        const { results, error } = await env.DB.prepare(
          `
          SELECT 
            tt.*,
            fa.name as farm_name,
            creator.name as created_by_name
          FROM task_templates tt
          JOIN farms fa ON tt.farm_id = fa.id
          LEFT JOIN users creator ON tt.created_by = creator.id
          WHERE fa.owner_id = ?
          ORDER BY tt.category, tt.template_name
        `
        )
          .bind(user.id)
          .all();

        if (error) {
          console.error("Database error:", error);
          return createErrorResponse("Database error", 500);
        }

        return createSuccessResponse(results);
      }
    } else if (method === "POST") {
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
        instructions,
      } = body;

      if (!farm_id || !template_name || !category) {
        return createErrorResponse(
          "Farm ID, template name, and category are required",
          400
        );
      }

      // Check if user has access to this farm
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Farm not found or access denied", 404);
      }

      const { error } = await env.DB.prepare(
        `
        INSERT INTO task_templates (
          farm_id, template_name, category, description, estimated_duration,
          required_resources, priority_level, dependencies, instructions, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          farm_id,
          template_name,
          category,
          description || null,
          estimated_duration || null,
          required_resources || null,
          priority_level || null,
          dependencies || null,
          instructions || null,
          user.id
        )
        .run();

      if (error) {
        console.error("Template insert error:", error);
        return createErrorResponse("Failed to create template", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Templates API error:", error);
    return createErrorResponse("Internal server error", 500);
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

    if (method === "GET") {
      const taskId = url.searchParams.get("task_id");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");

      if (!taskId) {
        return createErrorResponse("Task ID required", 400);
      }

      // Check access to the task
      const { results: accessCheck } = await env.DB.prepare(
        `
        SELECT t.id
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        WHERE t.id = ? AND fm.user_id = ?
      `
      )
        .bind(taskId, user.id)
        .all();

      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
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
        query += " AND date(tl.start_time) >= ?";
        params.push(dateFrom);
      }
      if (dateTo) {
        query += " AND date(tl.start_time) <= ?";
        params.push(dateTo);
      }

      query += " ORDER BY tl.start_time DESC";

      const { results, error } = await env.DB.prepare(query)
        .bind(...params)
        .all();

      if (error) {
        console.error("Time logs error:", error);
        return createErrorResponse("Database error", 500);
      }

      return createSuccessResponse(results);
    } else if (method === "POST") {
      const body = await request.json();
      const {
        task_id,
        start_time,
        end_time,
        break_time,
        work_notes,
        productivity_rating,
        interruptions_count,
      } = body;

      if (!task_id) {
        return createErrorResponse("Task ID required", 400);
      }

      // Check access to the task
      const { results: accessCheck } = await env.DB.prepare(
        `
        SELECT t.id
        FROM tasks t
        JOIN farm_members fm ON t.farm_id = fm.farm_id
        WHERE t.id = ? AND fm.user_id = ?
      `
      )
        .bind(task_id, user.id)
        .all();

      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }

      // Calculate total hours
      let totalHours = 0;
      if (start_time && end_time) {
        const start = new Date(start_time);
        const end = new Date(end_time);
        totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert to hours
        totalHours = Math.max(0, totalHours - (break_time || 0));
      }

      const result = await env.DB.prepare(
        `
        INSERT INTO task_time_logs (
          task_id, user_id, start_time, end_time, break_time, total_hours,
          work_notes, productivity_rating, interruptions_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          task_id,
          user.id,
          start_time || null,
          end_time || null,
          break_time || 0,
          totalHours,
          work_notes || null,
          productivity_rating || null,
          interruptions_count || 0
        )
        .run();

      if (result && result.error) {
        console.error("Time log insert error:", result.error);
        return createErrorResponse("Failed to create time log", 500);
      }

      // Try to return the inserted id in a few common property name variants
      const insertedId =
        (result && (result.lastInsertRowId || result.lastInsertRowid || result.lastInsertId)) ||
        null;

      return createSuccessResponse({ success: true, id: insertedId }, 201);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Time logs API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
