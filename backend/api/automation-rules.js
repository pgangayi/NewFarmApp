import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";

export async function onRequest(context) {
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
      const farmId = url.searchParams.get("farm_id");
      const ruleId = url.searchParams.get("rule_id");
      const enabled = url.searchParams.get("enabled");

      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farmId))) {
        return createErrorResponse("Access denied", 403);
      }

      if (ruleId) {
        // Get specific automation rule
        const { results: ruleResults } = await env.DB.prepare(
          `
          SELECT 
            ar.*,
            fa.name as farm_name
          FROM automation_rules ar
          JOIN farms fa ON ar.farm_id = fa.id
          WHERE ar.id = ? AND ar.farm_id = ?
        `
        )
          .bind(ruleId, farmId)
          .all();

        if (ruleResults.length === 0) {
          return createErrorResponse("Automation rule not found", 404);
        }

        // Get rule execution history
        const { results: executionResults } = await env.DB.prepare(
          `
          SELECT 
            are.*,
            u.name as executed_by_name
          FROM automation_rule_executions are
          LEFT JOIN users u ON are.executed_by = u.id
          WHERE are.rule_id = ?
          ORDER BY are.executed_at DESC
          LIMIT 50
        `
        )
          .bind(ruleId)
          .all();

        const rule = ruleResults[0];
        rule.execution_history = executionResults;

        return createSuccessResponse(rule);
      } else {
        // Get all automation rules for the farm
        let query = `
          SELECT 
            ar.*,
            fa.name as farm_name,
            COUNT(are.id) as execution_count,
            MAX(are.executed_at) as last_execution
          FROM automation_rules ar
          JOIN farms fa ON ar.farm_id = fa.id
          LEFT JOIN automation_rule_executions are ON ar.id = are.rule_id
          WHERE ar.farm_id = ?
        `;
        const params = [farmId];

        if (enabled !== null && enabled !== undefined) {
          query += " AND ar.enabled = ?";
          params.push(enabled === "true" ? 1 : 0);
        }

        query += " GROUP BY ar.id ORDER BY ar.name ASC";

        const { results: rules } = await env.DB.prepare(query)
          .bind(...params)
          .all();

        return createSuccessResponse(rules || []);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const {
        farm_id,
        name,
        description,
        trigger_type,
        trigger_config,
        conditions,
        actions,
        priority,
        enabled,
      } = body;

      if (!farm_id || !name || !trigger_type || !actions || actions.length === 0) {
        return createErrorResponse(
          "Farm ID, name, trigger type, and at least one action are required",
          400
        );
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Access denied", 403);
      }

      const { results, error: insertError } = await env.DB.prepare(
        `
        INSERT INTO automation_rules (
          farm_id, name, description, trigger_type, trigger_config,
          conditions, actions, priority, enabled, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(
          farm_id,
          name,
          description || null,
          trigger_type,
          JSON.stringify(trigger_config || {}),
          JSON.stringify(conditions || []),
          JSON.stringify(actions),
          priority || "medium",
          enabled ? 1 : 0,
          user.id
        )
        .run();

      if (insertError) {
        console.error("Insert error:", insertError);
        return createErrorResponse("Failed to create automation rule", 500);
      }

      // Get the created rule
      const { results: ruleResults } = await env.DB.prepare(
        `
        SELECT 
          ar.*,
          fa.name as farm_name
        FROM automation_rules ar
        JOIN farms fa ON ar.farm_id = fa.id
        WHERE ar.rowid = last_insert_rowid()
      `
      ).all();

      return createSuccessResponse(ruleResults[0]);
    } else if (method === "PUT") {
      const body = await request.json();
      const {
        id,
        name,
        description,
        trigger_type,
        trigger_config,
        conditions,
        actions,
        priority,
        enabled,
      } = body;

      if (!id) {
        return createErrorResponse("Rule ID required", 400);
      }

      // Get the rule and check farm access
      const { results: existingRules } = await env.DB.prepare(
        `
        SELECT ar.farm_id, ar.name
        FROM automation_rules ar
        JOIN farms fa ON ar.farm_id = fa.id
        WHERE ar.id = ? AND fa.owner_id = ?
      `
      )
        .bind(id, user.id)
        .all();

      if (existingRules.length === 0) {
        return createErrorResponse(
          "Automation rule not found or access denied",
          404
        );
      }

      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(description);
      }
      if (trigger_type !== undefined) {
        updateFields.push("trigger_type = ?");
        updateValues.push(trigger_type);
      }
      if (trigger_config !== undefined) {
        updateFields.push("trigger_config = ?");
        updateValues.push(JSON.stringify(trigger_config));
      }
      if (conditions !== undefined) {
        updateFields.push("conditions = ?");
        updateValues.push(JSON.stringify(conditions));
      }
      if (actions !== undefined) {
        updateFields.push("actions = ?");
        updateValues.push(JSON.stringify(actions));
      }
      if (priority !== undefined) {
        updateFields.push("priority = ?");
        updateValues.push(priority);
      }
      if (enabled !== undefined) {
        updateFields.push("enabled = ?");
        updateValues.push(enabled ? 1 : 0);
      }

      if (updateFields.length === 0) {
        return createErrorResponse("No fields to update", 400);
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id);

      const { error: updateError } = await env.DB.prepare(
        `
        UPDATE automation_rules 
        SET ${updateFields.join(", ")}
        WHERE id = ?
      `
      )
        .bind(...updateValues)
        .run();

      if (updateError) {
        console.error("Update error:", updateError);
        return createErrorResponse("Failed to update automation rule", 500);
      }

      // Get updated rule
      const { results: ruleResults } = await env.DB.prepare(
        `
        SELECT 
          ar.*,
          fa.name as farm_name
        FROM automation_rules ar
        JOIN farms fa ON ar.farm_id = fa.id
        WHERE ar.id = ?
      `
      )
        .bind(id)
        .all();

      return createSuccessResponse(ruleResults[0]);
    } else if (method === "DELETE") {
      const ruleId = url.searchParams.get("rule_id") || request.params?.id;

      if (!ruleId) {
        return createErrorResponse("Rule ID required", 400);
      }

      // Get the rule and check farm access
      const { results: existingRules } = await env.DB.prepare(
        `
        SELECT ar.farm_id, ar.name
        FROM automation_rules ar
        JOIN farms fa ON ar.farm_id = fa.id
        WHERE ar.id = ? AND fa.owner_id = ?
      `
      )
        .bind(ruleId, user.id)
        .all();

      if (existingRules.length === 0) {
        return createErrorResponse(
          "Automation rule not found or access denied",
          404
        );
      }

      // Check for dependencies
      const { results: dependencies } = await env.DB.prepare(
        `
        SELECT 
          (SELECT COUNT(*) FROM automation_rule_executions WHERE rule_id = ?) as execution_count
      `
      )
        .bind(ruleId)
        .all();

      const dep = dependencies[0];
      if (dep.execution_count > 0) {
        return createErrorResponse(
          "Cannot delete rule with execution history. Please disable instead.",
          400
        );
      }

      const { error: deleteError } = await env.DB.prepare(
        `
        DELETE FROM automation_rules WHERE id = ?
      `
      )
        .bind(ruleId)
        .run();

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return createErrorResponse("Failed to delete automation rule", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Automation rules API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Automation Executions Management
export async function onRequestExecutions(context) {
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
      const farmId = url.searchParams.get("farm_id");
      const ruleId = url.searchParams.get("rule_id");
      const status = url.searchParams.get("status");
      const limit = parseInt(url.searchParams.get("limit") || "50");

      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farmId))) {
        return createErrorResponse("Access denied", 403);
      }

      let query = `
        SELECT 
          are.*,
          ar.name as rule_name,
          u.name as executed_by_name
        FROM automation_rule_executions are
        JOIN automation_rules ar ON are.rule_id = ar.id
        LEFT JOIN users u ON are.executed_by = u.id
        WHERE ar.farm_id = ?
      `;
      const params = [farmId];

      if (ruleId) {
        query += " AND are.rule_id = ?";
        params.push(ruleId);
      }
      if (status) {
        query += " AND are.status = ?";
        params.push(status);
      }

      query += " ORDER BY are.executed_at DESC LIMIT ?";
      params.push(limit);

      const { results, error } = await env.DB.prepare(query)
        .bind(...params)
        .all();

      if (error) {
        console.error("Executions error:", error);
        return createErrorResponse("Database error", 500);
      }

      return createSuccessResponse(results || []);
    } else if (method === "POST") {
      const body = await request.json();
      const { rule_id, manual_trigger, notes } = body;

      if (!rule_id) {
        return createErrorResponse("Rule ID required", 400);
      }

      // Get the rule and check farm access
      const { results: ruleResults } = await env.DB.prepare(
        `
        SELECT ar.farm_id, ar.name, ar.enabled, ar.trigger_config, ar.conditions, ar.actions
        FROM automation_rules ar
        JOIN farms fa ON ar.farm_id = fa.id
        WHERE ar.id = ? AND fa.owner_id = ?
      `
      )
        .bind(rule_id, user.id)
        .all();

      if (ruleResults.length === 0) {
        return createErrorResponse(
          "Automation rule not found or access denied",
          404
        );
      }

      const rule = ruleResults[0];
      if (!rule.enabled && !manual_trigger) {
        return createErrorResponse("Rule is not enabled", 400);
      }

      // Create execution record
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: executionError } = await env.DB.prepare(
        `
        INSERT INTO automation_rule_executions (
          id, rule_id, status, executed_at, executed_by, trigger_type, notes
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
      `
      )
        .bind(
          executionId,
          rule_id,
          "running",
          user.id,
          manual_trigger ? "manual" : "automatic",
          notes || null
        )
        .run();

      if (executionError) {
        console.error("Execution insert error:", executionError);
        return createErrorResponse("Failed to start execution", 500);
      }

      // Execute the automation rule (simplified for this example)
      try {
        const executionResult = await executeAutomationRule(
          env,
          rule,
          executionId,
          user.id
        );

        // Update execution record with result
        await env.DB.prepare(
          `
          UPDATE automation_rule_executions 
          SET status = ?, completed_at = CURRENT_TIMESTAMP, result = ?, error_message = ?
          WHERE id = ?
        `
        )
          .bind(
            executionResult.success ? "completed" : "failed",
            JSON.stringify(executionResult.result),
            executionResult.error || null,
            executionId
          )
          .run();

        return createSuccessResponse({
          execution_id: executionId,
          status: executionResult.success ? "completed" : "failed",
          result: executionResult.result,
          error: executionResult.error,
        });
      } catch (error) {
        console.error("Rule execution error:", error);
        
        // Update execution record with error
        await env.DB.prepare(
          `
          UPDATE automation_rule_executions 
          SET status = ?, completed_at = CURRENT_TIMESTAMP, error_message = ?
          WHERE id = ?
        `
        )
          .bind("failed", error.message, executionId)
          .run();

        return createErrorResponse("Rule execution failed", 500);
      }
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Automation executions API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Helper function to execute automation rules
async function executeAutomationRule(env, rule, executionId, userId) {
  try {
    const actions = JSON.parse(rule.actions);
    const results = [];

    for (const action of actions) {
      const actionResult = await executeAction(env, action, rule.farm_id, userId);
      results.push({
        action_type: action.type,
        result: actionResult,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      result: {
        actions_executed: results.length,
        execution_details: results,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper function to execute individual actions
async function executeAction(env, action, farmId, userId) {
  switch (action.type) {
    case "notification":
      // Create notification
      await env.DB.prepare(
        `
        INSERT INTO notifications (user_id, farm_id, type, title, message, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
        .bind(userId, farmId, "automation", action.title, action.message)
        .run();
      return { success: true, message: "Notification created" };

    case "task":
      // Create task
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await env.DB.prepare(
        `
        INSERT INTO tasks (
          id, farm_id, title, description, assigned_to, priority, status, created_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, ?)
        `
      )
        .bind(
          taskId,
          farmId,
          action.title,
          action.description,
          action.assigned_to || userId,
          action.priority || "medium",
          userId
        )
        .run();
      return { success: true, message: "Task created", task_id: taskId };

    case "email":
      // Send email (placeholder - would integrate with email service)
      console.log("Email action:", action);
      return { success: true, message: "Email queued for sending" };

    case "webhook":
      // Call webhook (placeholder - would make HTTP request)
      console.log("Webhook action:", action);
      return { success: true, message: "Webhook called" };

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}
