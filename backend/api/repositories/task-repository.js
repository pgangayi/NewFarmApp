/**
 * Task Repository - Handles all task-related database operations
 * Phase 5 Migration: Operational Systems - Task Management Enhancement
 * Provides comprehensive task management with audit trails, analytics, and dependencies
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "../_repositories.js";

/**
 * Task Repository - Handles all task-related database operations
 * Phase 5 Migration: Operational Systems Enhancement
 */
export class TaskRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "tasks");
  }

  /**
   * Get tasks for user's farms with enhanced filtering and data
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        t.*,
        fa.name as farm_name,
        creator.name as created_by_name,
        assignee.name as assigned_to_name,
        COUNT(DISTINCT tl.id) as time_log_count,
        COALESCE(SUM(tl.total_hours), 0) as total_logged_hours,
        COUNT(DISTINCT tc.id) as comment_count,
        CASE 
          WHEN t.status = 'completed' AND t.due_date IS NOT NULL 
               AND date(t.updated_at) <= date(t.due_date) 
          THEN 1 
          ELSE 0 
        END as on_time_completion,
        CASE 
          WHEN t.status = 'completed' THEN 
            julianday(t.updated_at) - julianday(t.created_at)
          ELSE NULL 
        END as actual_completion_days
      FROM tasks t
      JOIN farm_members fm ON t.farm_id = fm.farm_id
      JOIN farms fa ON t.farm_id = fa.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN task_time_logs tl ON t.id = tl.task_id
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters with security validation
    if (filters.status) {
      query += " AND t.status = ?";
      params.push(filters.status);
    }
    if (filters.priority) {
      query += " AND t.priority = ?";
      params.push(filters.priority);
    }
    if (filters.task_category) {
      query += " AND t.task_category = ?";
      params.push(filters.task_category);
    }
    if (filters.assigned_to) {
      query += " AND t.assigned_to = ?";
      params.push(filters.assigned_to);
    }
    if (filters.farm_id) {
      query += " AND t.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.due_date_from) {
      query += " AND date(t.due_date) >= ?";
      params.push(filters.due_date_from);
    }
    if (filters.due_date_to) {
      query += " AND date(t.due_date) <= ?";
      params.push(filters.due_date_to);
    }
    if (filters.search) {
      query += " AND (t.title LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)";
      params.push(
        `%${filters.search}%`,
        `%${filters.search}%`,
        `%${filters.search}%`
      );
    }

    // Group by to avoid duplicates
    query += " GROUP BY t.id";

    // Add sorting
    if (options.sortBy) {
      query += ` ORDER BY t.${options.sortBy} ${
        options.sortDirection?.toUpperCase() || "DESC"
      }`;
    } else {
      query += " ORDER BY t.due_date ASC, t.created_at DESC";
    }

    // Add pagination
    if (options.limit) {
      const limit = Math.min(options.limit, 1000);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "tasks",
      context: {
        findByUserAccess: true,
        userId,
        filters,
        options,
        security_level: "enhanced",
      },
    });

    if (error) {
      throw new Error(
        `Database error in TaskRepository.findByUserAccess: ${error.message}`
      );
    }

    return results;
  }

  /**
   * Count tasks for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM tasks t
      JOIN farm_members fm ON t.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];

    if (filters.status) {
      query += " AND t.status = ?";
      params.push(filters.status);
    }
    if (filters.priority) {
      query += " AND t.priority = ?";
      params.push(filters.priority);
    }
    if (filters.assigned_to) {
      query += " AND t.assigned_to = ?";
      params.push(filters.assigned_to);
    }
    if (filters.farm_id) {
      query += " AND t.farm_id = ?";
      params.push(filters.farm_id);
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "tasks",
      context: { countByUserAccess: true, userId, filters },
    });

    if (error) {
      throw new Error(
        `Database error in TaskRepository.countByUserAccess: ${error.message}`
      );
    }

    return results[0]?.total || 0;
  }

  /**
   * Create task with comprehensive validation and setup
   */
  async createTask(taskData, userId) {
    // Validate required fields
    if (!taskData.farm_id || !taskData.title) {
      throw new Error("Farm ID and title are required");
    }

    // Validate task data
    if (
      taskData.priority &&
      !["low", "medium", "high", "urgent"].includes(taskData.priority)
    ) {
      throw new Error("Priority must be low, medium, high, or urgent");
    }

    if (
      taskData.status &&
      !["pending", "in_progress", "completed", "cancelled", "on_hold"].includes(
        taskData.status
      )
    ) {
      throw new Error("Invalid status value");
    }

    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(taskData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }

    // If assigning to someone, verify they have access to the farm
    if (taskData.assigned_to) {
      const assigneeHasAccess = await farmRepo.hasUserAccess(
        taskData.farm_id,
        taskData.assigned_to
      );
      if (!assigneeHasAccess) {
        throw new Error("Assigned user does not have access to this farm");
      }
    }

    // Prepare task data with defaults
    const taskRecord = {
      farm_id: taskData.farm_id,
      title: taskData.title.trim(),
      description: taskData.description || null,
      status: taskData.status || "pending",
      priority: taskData.priority || "medium",
      due_date: taskData.due_date || null,
      assigned_to: taskData.assigned_to || null,
      created_by: userId,
      priority_score: taskData.priority_score || null,
      estimated_duration: taskData.estimated_duration || null,
      actual_duration: taskData.actual_duration || null,
      dependencies: taskData.dependencies || null,
      resource_requirements: taskData.resource_requirements || null,
      task_category: taskData.task_category || null,
      recurring_pattern: taskData.recurring_pattern || null,
      completion_criteria: taskData.completion_criteria || null,
      progress_percentage: taskData.progress_percentage || 0,
      tags: taskData.tags || null,
      location: taskData.location || null,
    };

    const transaction = [
      {
        query: `
          INSERT INTO tasks (
            farm_id, title, description, status, priority, due_date, assigned_to,
            created_by, priority_score, estimated_duration, actual_duration,
            dependencies, resource_requirements, task_category, recurring_pattern,
            completion_criteria, progress_percentage, tags, location
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: Object.values(taskRecord),
        operation: "run",
        table: "tasks",
        context: {
          createTask: true,
          audit_level: "comprehensive",
          data_integrity: "enforced",
        },
      },
    ];

    try {
      const result = await this.db.executeTransaction(transaction);
      const newTaskId = result.results[0].lastRowId;

      // Handle costs if provided
      if (
        taskData.costs &&
        Array.isArray(taskData.costs) &&
        taskData.costs.length > 0
      ) {
        const costTransaction = taskData.costs.map((cost) => ({
          query: `
            INSERT INTO finance_entries (
              farm_id, entry_date, type, amount, currency, description, 
              reference_type, reference_id, created_by
            ) VALUES (?, date('now'), 'expense', ?, ?, ?, 'task', ?, ?)
          `,
          params: [
            taskData.farm_id,
            cost.amount,
            cost.currency || "USD",
            cost.description,
            newTaskId,
            userId,
          ],
          operation: "run",
          table: "finance_entries",
        }));

        if (costTransaction.length > 0) {
          await this.db.executeTransaction(costTransaction);
        }
      }

      // Log task creation in audit trail
      await this.logTaskOperation("create", newTaskId, taskRecord, userId);

      return await this.findByIdWithDetails(newTaskId, userId);
    } catch (error) {
      throw new Error(`Task creation failed: ${error.message}`);
    }
  }

  /**
   * Update task with validation and audit trail
   */
  async updateTask(id, updateData, userId) {
    // Validate record access
    const existing = await this.findByIdWithDetails(id);
    if (!existing) {
      throw new Error("Task not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToTask(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this task");
    }

    // Validate update data
    if (
      updateData.priority &&
      !["low", "medium", "high", "urgent"].includes(updateData.priority)
    ) {
      throw new Error("Priority must be low, medium, high, or urgent");
    }

    if (
      updateData.status &&
      !["pending", "in_progress", "completed", "cancelled", "on_hold"].includes(
        updateData.status
      )
    ) {
      throw new Error("Invalid status value");
    }

    if (updateData.progress_percentage !== undefined) {
      const progress = parseFloat(updateData.progress_percentage);
      if (isNaN(progress) || progress < 0 || progress > 100) {
        throw new Error("Progress percentage must be between 0 and 100");
      }
      updateData.progress_percentage = progress;
    }

    // Handle auto-completion when progress reaches 100%
    if (updateData.progress_percentage === 100 && !updateData.status) {
      updateData.status = "completed";
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Handle costs if provided (Replace All strategy)
    if (updateData.costs && Array.isArray(updateData.costs)) {
      // 1. Delete existing costs linked to this task
      await this.db.executeQuery(
        "DELETE FROM finance_entries WHERE reference_type = 'task' AND reference_id = ?",
        [id],
        { operation: "run", table: "finance_entries" }
      );

      // 2. Insert new costs
      if (updateData.costs.length > 0) {
        const costTransaction = updateData.costs.map((cost) => ({
          query: `
            INSERT INTO finance_entries (
              farm_id, entry_date, type, amount, currency, description, 
              reference_type, reference_id, created_by
            ) VALUES (?, date('now'), 'expense', ?, ?, ?, 'task', ?, ?)
          `,
          params: [
            existing.farm_id,
            cost.amount,
            cost.currency || "USD",
            cost.description,
            id,
            userId,
          ],
          operation: "run",
          table: "finance_entries",
        }));

        if (costTransaction.length > 0) {
          await this.db.executeTransaction(costTransaction);
        }
      }

      // Remove costs from updateData to avoid updating non-existent column in tasks table
      delete updateData.costs;
    }

    // Perform update
    const updated = await this.updateById(id, updateData);

    // Log update in audit trail
    await this.logTaskOperation(
      "update",
      id,
      {
        before: existing,
        after: updated,
        changes: updateData,
      },
      userId
    );

    return await this.findByIdWithDetails(id, userId);
  }

  /**
   * Delete task with dependency checking
   */
  async deleteTask(id, userId) {
    // Validate record access
    const existing = await this.findByIdWithDetails(id);
    if (!existing) {
      throw new Error("Task not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToTask(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this task");
    }

    // Check for dependencies (tasks that depend on this one)
    const dependencies = await this.checkTaskDependencies(id);
    if (dependencies.hasReferences) {
      throw new Error(
        "Cannot delete task with dependent tasks. Please update dependencies first."
      );
    }

    // Perform deletion
    await this.deleteById(id);

    // Log deletion in audit trail
    await this.logTaskOperation(
      "delete",
      id,
      {
        deleted_record: existing,
      },
      userId
    );

    return { success: true, deletedId: id };
  }

  /**
   * Get task with comprehensive details
   */
  async findByIdWithDetails(taskId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT DISTINCT
        t.*,
        fa.name as farm_name,
        creator.name as created_by_name,
        assignee.name as assigned_to_name,
        COUNT(DISTINCT tl.id) as time_log_count,
        COALESCE(SUM(tl.total_hours), 0) as total_logged_hours,
        COUNT(DISTINCT tc.id) as comment_count,
        COUNT(DISTINCT tcol.id) as collaborator_count
      FROM tasks t
      JOIN farm_members fm ON t.farm_id = fm.farm_id
      JOIN farms fa ON t.farm_id = fa.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN task_time_logs tl ON t.id = tl.task_id
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      LEFT JOIN task_collaborators tcol ON t.id = tcol.task_id
      WHERE t.id = ? AND fm.user_id = ?
      GROUP BY t.id
    `,
      [taskId, userId],
      {
        operation: "query",
        table: "tasks",
        context: { findByIdWithDetails: true, taskId, userId },
      }
    );

    if (results.length === 0) {
      return null;
    }

    const task = results[0];

    // Get task costs (finance entries)
    const { results: costResults } = await this.db.executeQuery(
      `
      SELECT id, description, amount, currency, type, entry_date
      FROM finance_entries
      WHERE reference_type = 'task' AND reference_id = ?
      ORDER BY entry_date DESC
      `,
      [taskId],
      {
        operation: "query",
        table: "finance_entries",
        context: { getTaskCosts: true, taskId },
      }
    );
    task.costs = costResults || [];

    // Get task dependencies if any
    if (task.dependencies) {
      const dependencyIds = task.dependencies
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (dependencyIds.length > 0) {
        const { results: dependencyResults } = await this.db.executeQuery(
          `
          SELECT t.id, t.title, t.status, t.due_date
          FROM tasks t
          WHERE t.id IN (${dependencyIds.map(() => "?").join(",")})
          AND t.farm_id = ?
        `,
          [...dependencyIds, task.farm_id],
          {
            operation: "query",
            table: "tasks",
            context: { getDependencies: true, taskId },
          }
        );
        task.dependencies_list = dependencyResults;
      }
    }

    return task;
  }

  /**
   * Get overdue tasks for notification
   */
  async getOverdueTasks(farmId, userId) {
    // Verify access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    const { results } = await this.db.executeQuery(
      `
      SELECT 
        t.*,
        fa.name as farm_name,
        assignee.name as assigned_to_name
      FROM tasks t
      JOIN farms fa ON t.farm_id = fa.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.farm_id = ?
        AND t.due_date < date('now')
        AND t.status != 'completed'
      ORDER BY t.due_date ASC
    `,
      [farmId],
      {
        operation: "query",
        table: "tasks",
        context: { getOverdueTasks: true, farmId },
      }
    );

    return results;
  }

  /**
   * Get task analytics and performance metrics
   */
  async getTaskAnalytics(farmId, userId, dateFrom, dateTo) {
    // Verify access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    const dateFilter =
      dateFrom && dateTo
        ? `AND date(t.created_at) >= date('${dateFrom}') AND date(t.created_at) <= date('${dateTo}')`
        : "";

    const { results } = await this.db.executeQuery(
      `
      SELECT
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as active_tasks,
        COUNT(CASE WHEN t.due_date < date('now') AND t.status != 'completed' THEN 1 END) as overdue_tasks,
        AVG(CASE WHEN t.estimated_duration IS NOT NULL AND t.actual_duration IS NOT NULL
             THEN (t.actual_duration / t.estimated_duration) * 100 ELSE NULL END) as avg_completion_ratio,
        COUNT(CASE WHEN t.progress_percentage = 100 THEN 1 END) as fully_completed_tasks,
        SUM(CASE WHEN t.priority = 'high' AND t.status != 'completed' THEN 1 ELSE 0 END) as high_priority_pending,
        AVG(t.progress_percentage) as avg_progress
      FROM tasks t
      WHERE t.farm_id = ? ${dateFilter}
    `,
      [farmId],
      {
        operation: "query",
        table: "tasks",
        context: { getTaskAnalytics: true, farmId, dateFrom, dateTo },
      }
    );

    return results[0] || {};
  }

  /**
   * Bulk create tasks with template support
   */
  async bulkCreateTasks(tasksData, userId, templateId = null) {
    if (!Array.isArray(tasksData) || tasksData.length === 0) {
      throw new Error("Tasks array is required");
    }

    const tasks = [];
    const auditLogs = [];

    // Process each task
    for (let i = 0; i < tasksData.length; i++) {
      const taskData = tasksData[i];

      try {
        const task = await this.createTask(taskData, userId);
        tasks.push(task);
      } catch (error) {
        throw new Error(
          `Bulk create failed at task ${i + 1}: ${error.message}`
        );
      }
    }

    // Log bulk operation
    await this.logTaskOperation(
      "bulk_create",
      null,
      {
        total_tasks: tasksData.length,
        created_ids: tasks.map((t) => t.id),
        template_id: templateId,
      },
      userId
    );

    return {
      success: true,
      created_count: tasks.length,
      tasks: tasks,
    };
  }

  /**
   * Create task from template
   */
  async createFromTemplate(templateId, customData, userId) {
    // Get template
    const { results: templates } = await this.db.executeQuery(
      `
      SELECT tt.*, fa.name as farm_name
      FROM task_templates tt
      JOIN farms fa ON tt.farm_id = fa.id
      WHERE tt.id = ? AND fa.owner_id = ?
    `,
      [templateId, userId],
      {
        operation: "query",
        table: "task_templates",
        context: { getTemplate: true, templateId, userId },
      }
    );

    if (templates.length === 0) {
      throw new Error("Template not found or access denied");
    }

    const template = templates[0];

    // Merge template data with custom data
    const taskData = {
      farm_id: template.farm_id,
      title: customData.title || template.template_name,
      description: customData.description || template.description,
      priority: customData.priority || template.priority_level || "medium",
      estimated_duration:
        customData.estimated_duration || template.estimated_duration,
      dependencies: customData.dependencies || template.dependencies,
      task_category: template.category,
      ...customData,
    };

    return await this.createTask(taskData, userId);
  }

  // === PRIVATE HELPER METHODS ===

  async hasUserAccessToTask(taskId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM tasks t
      JOIN farm_members fm ON t.farm_id = fm.farm_id
      WHERE t.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [taskId, userId],
      {
        operation: "query",
        table: "tasks",
        context: { hasUserAccessToTask: true },
      }
    );

    return results.length > 0;
  }

  async checkTaskDependencies(taskId) {
    // Check if task is referenced by other tasks as dependency
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        COUNT(*) as dependent_count
      FROM tasks 
      WHERE dependencies LIKE '%' || ? || '%'
    `,
      [taskId.toString()],
      {
        operation: "query",
        table: "tasks",
        context: { checkTaskDependencies: true },
      }
    );

    const deps = results[0];
    return {
      hasReferences: deps.dependent_count > 0,
      dependent_count: deps.dependent_count,
    };
  }

  async logTaskOperation(operation, taskId, data, userId) {
    try {
      await this.db.executeQuery(
        `
        INSERT INTO audit_logs (
          user_id, action, table_name, record_id, old_values, new_values, 
          timestamp, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          `task.${operation}`,
          "tasks",
          taskId,
          data.before ? JSON.stringify(data.before) : null,
          data.after || data.created || JSON.stringify(data),
          new Date().toISOString(),
          "system",
          "TaskRepository",
        ],
        {
          operation: "run",
          table: "audit_logs",
          context: { logTaskOperation: true },
        }
      );
    } catch (error) {
      console.error("Failed to log task operation:", error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }
}
