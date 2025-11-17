import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { DatabaseOperations } from "./_database.js";
import { FinanceRepository } from "./repositories/finance-repository.js";
import { InventoryRepository } from "./repositories/inventory-repository.js";

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

    // Only allow authenticated users with proper permissions
    if (method === "GET") {
      const action = url.searchParams.get("action") || "status";
      const farmId = url.searchParams.get("farm_id");
      const operationId = url.searchParams.get("operation_id");

      if (action === "status") {
        return await getBulkOperationStatus(env, user.id, farmId, operationId);
      } else if (action === "history") {
        return await getBulkOperationHistory(env, user.id, farmId);
      } else if (action === "templates") {
        return await getBulkOperationTemplates(env, user.id);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const { action } = body;

      if (action === "execute_bulk_operation") {
        return await executeBulkOperation(env, user.id, body);
      } else if (action === "validate_operation") {
        return await validateBulkOperation(env, user.id, body);
      } else if (action === "cancel_operation") {
        return await cancelBulkOperation(env, user.id, body.operation_id);
      } else if (action === "export_template") {
        return await exportBulkOperationTemplate(env, user.id, body);
      } else if (action === "import_operations") {
        return await importBulkOperations(env, user.id, body);
      }
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Bulk operations error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

async function getBulkOperationStatus(env, userId, farmId, operationId) {
  try {
    let query = `
      SELECT 
        bo.*,
        f.name as farm_name
      FROM bulk_operations bo
      LEFT JOIN farms f ON bo.farm_id = f.id
      WHERE bo.user_id = ?
    `;

    const params = [userId];

    if (farmId) {
      query += ` AND bo.farm_id = ?`;
      params.push(farmId);
    }

    if (operationId) {
      query += ` AND bo.id = ?`;
      params.push(operationId);
    }

    query += ` ORDER BY bo.created_at DESC LIMIT 50`;

    const result = await env.DB.prepare(query)
      .bind(...params)
      .all();
    return createSuccessResponse({ operations: result });
  } catch (error) {
    console.error("Get bulk operation status error:", error);
    throw error;
  }
}

async function getBulkOperationHistory(env, userId, farmId) {
  try {
    let query = `
      SELECT 
        bo.id,
        bo.operation_type,
        bo.status,
        bo.progress,
        bo.total_items,
        bo.processed_items,
        bo.success_count,
        bo.error_count,
        bo.created_at,
        bo.completed_at,
        f.name as farm_name
      FROM bulk_operations bo
      LEFT JOIN farms f ON bo.farm_id = f.id
      WHERE bo.user_id = ?
    `;

    const params = [userId];

    if (farmId) {
      query += ` AND bo.farm_id = ?`;
      params.push(farmId);
    }

    query += ` ORDER BY bo.created_at DESC LIMIT 100`;

    const result = await env.DB.prepare(query)
      .bind(...params)
      .all();
    return createSuccessResponse({ history: result });
  } catch (error) {
    console.error("Get bulk operation history error:", error);
    throw error;
  }
}

async function getBulkOperationTemplates(env, userId) {
  try {
    const templates = [
      {
        id: "bulk_task_creation",
        name: "Bulk Task Creation",
        description: "Create multiple tasks from a template",
        category: "tasks",
        required_fields: ["title", "description", "task_category", "priority"],
        optional_fields: ["due_date", "assigned_to", "estimated_duration"],
        sample_data: [
          {
            title: "Daily Animal Check",
            description: "Check all animals for health issues",
            task_category: "Livestock",
            priority: "medium",
            due_date: "2025-11-11",
          },
          {
            title: "Inventory Count",
            description: "Count all inventory items",
            task_category: "Inventory",
            priority: "low",
            due_date: "2025-11-12",
          },
        ],
      },
      {
        id: "bulk_inventory_update",
        name: "Bulk Inventory Update",
        description: "Update multiple inventory items",
        category: "inventory",
        required_fields: ["item_name", "action", "quantity"],
        optional_fields: ["unit_cost", "supplier", "category"],
        sample_data: [
          {
            item_name: "Fertilizer A",
            action: "add",
            quantity: 100,
            unit_cost: 25.5,
          },
          {
            item_name: "Feed B",
            action: "subtract",
            quantity: 50,
            unit_cost: 15.75,
          },
        ],
      },
      {
        id: "bulk_animal_health_update",
        name: "Bulk Animal Health Update",
        description: "Update health status for multiple animals",
        category: "animals",
        required_fields: ["animal_id", "health_status"],
        optional_fields: ["weight", "notes", "next_check_date"],
        sample_data: [
          {
            animal_id: "1",
            health_status: "healthy",
            weight: 150,
            notes: "Routine check completed",
          },
          {
            animal_id: "2",
            health_status: "sick",
            weight: 145,
            notes: "Requires veterinary attention",
          },
        ],
      },
      {
        id: "bulk_financial_entry",
        name: "Bulk Financial Entry",
        description: "Create multiple financial entries",
        category: "finance",
        required_fields: ["type", "amount", "description", "category"],
        optional_fields: ["entry_date", "reference_id", "notes"],
        sample_data: [
          {
            type: "income",
            amount: 1000,
            description: "Crop sales",
            category: "Revenue",
          },
          {
            type: "expense",
            amount: 250,
            description: "Feed purchase",
            category: "Feed",
          },
        ],
      },
      {
        id: "bulk_report_generation",
        name: "Bulk Report Generation",
        description: "Generate multiple reports at once",
        category: "reports",
        required_fields: ["report_type", "time_range"],
        optional_fields: ["include_charts", "format", "email_recipients"],
        sample_data: [
          {
            report_type: "financial",
            time_range: "30d",
            include_charts: true,
            format: "pdf",
          },
          {
            report_type: "inventory",
            time_range: "7d",
            include_charts: false,
            format: "csv",
          },
        ],
      },
    ];

    return createSuccessResponse({ templates });
  } catch (error) {
    console.error("Get bulk operation templates error:", error);
    throw error;
  }
}

async function executeBulkOperation(env, userId, body) {
  const { operation_type, farm_id, data, options = {}, template_id } = body;

  try {
    // Validate operation
    if (!operation_type || !data || !Array.isArray(data)) {
      return createErrorResponse("Invalid operation parameters", 400);
    }

    // Check farm access
    if (farm_id && !(await auth.hasFarmAccess(userId, farm_id))) {
      return createErrorResponse("Access denied to farm", 403);
    }

    // Create bulk operation record
    const operationResult = await env.DB.prepare(
      `
      INSERT INTO bulk_operations (
        user_id, farm_id, operation_type, status, total_items, 
        created_at, options, template_id
      ) VALUES (?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP, ?, ?)
    `
    )
      .bind(
        userId,
        farm_id,
        operation_type,
        data.length,
        JSON.stringify(options),
        template_id
      )
      .run();

    const operationId = operationResult.lastInsertRowid;

    // Process operation asynchronously
    processBulkOperationAsync(
      env,
      operationId,
      operation_type,
      data,
      farm_id,
      userId,
      options
    );

    return createSuccessResponse({
      operation_id: operationId,
      status: "pending",
      message: "Bulk operation started successfully",
    });
  } catch (error) {
    console.error("Execute bulk operation error:", error);
    throw error;
  }
}

async function processBulkOperationAsync(
  env,
  operationId,
  operationType,
  data,
  farmId,
  userId,
  options
) {
  try {
    // Update status to processing
    await env.DB.prepare(
      `
      UPDATE bulk_operations 
      SET status = 'processing', started_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    )
      .bind(operationId)
      .run();

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each item based on operation type
    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      try {
        await processItem(env, operationType, item, farmId, userId);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          item_index: i,
          item_data: item,
          error: error.message,
        });
      }

      // Update progress
      const progress = Math.round(((i + 1) / data.length) * 100);
      await env.DB.prepare(
        `
        UPDATE bulk_operations 
        SET progress = ?, processed_items = ?, success_count = ?, error_count = ?
        WHERE id = ?
      `
      )
        .bind(progress, i + 1, successCount, errorCount, operationId)
        .run();
    }

    // Complete operation
    const finalStatus =
      errorCount === 0
        ? "completed"
        : successCount === 0
        ? "failed"
        : "completed_with_errors";

    await env.DB.prepare(
      `
      UPDATE bulk_operations 
      SET status = ?, completed_at = CURRENT_TIMESTAMP, 
          success_count = ?, error_count = ?, error_details = ?
      WHERE id = ?
    `
    )
      .bind(
        finalStatus,
        successCount,
        errorCount,
        errors.length > 0 ? JSON.stringify(errors) : null,
        operationId
      )
      .run();

    // Create notification for completion
    await createCompletionNotification(
      env,
      userId,
      operationId,
      operationType,
      successCount,
      errorCount
    );
  } catch (error) {
    console.error("Process bulk operation async error:", error);

    // Mark operation as failed
    await env.DB.prepare(
      `
      UPDATE bulk_operations 
      SET status = 'failed', completed_at = CURRENT_TIMESTAMP, 
          error_details = ?
      WHERE id = ?
    `
    )
      .bind(JSON.stringify([{ error: error.message }]), operationId)
      .run();
  }
}

async function processItem(env, operationType, item, farmId, userId) {
  switch (operationType) {
    case "bulk_task_creation":
      return await createTaskBulk(env, item, farmId, userId);

    case "bulk_inventory_update":
      return await updateInventoryBulk(env, item, farmId, userId);

    case "bulk_animal_health_update":
      return await updateAnimalHealthBulk(env, item, farmId, userId);

    case "bulk_financial_entry":
      return await createFinancialEntryBulk(env, item, farmId, userId);

    case "bulk_report_generation":
      return await generateReportBulk(env, item, farmId, userId);

    default:
      throw new Error(`Unknown operation type: ${operationType}`);
  }
}

async function createTaskBulk(env, taskData, farmId, userId) {
  const {
    title,
    description,
    task_category,
    priority,
    due_date,
    assigned_to,
    estimated_duration,
  } = taskData;

  if (!title || !description || !task_category) {
    throw new Error(
      "Required fields missing: title, description, task_category"
    );
  }

  const result = await env.DB.prepare(
    `
    INSERT INTO tasks (
      farm_id, title, description, task_category, priority,
      due_date, assigned_to, estimated_duration, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `
  )
    .bind(
      farmId,
      title,
      description,
      task_category,
      priority || "medium",
      due_date,
      assigned_to,
      estimated_duration,
      userId
    )
    .run();

  return result.lastInsertRowid;
}

async function updateInventoryBulk(env, inventoryData, farmId, userId) {
  const { item_name, action, quantity, unit_cost, supplier, category } =
    inventoryData;

  if (!item_name || !action || !quantity) {
    throw new Error("Required fields missing: item_name, action, quantity");
  }

  // Use InventoryRepository
  const db = new DatabaseOperations(env);
  const inventoryRepo = new InventoryRepository(db);

  // Find existing item
  const existingItems = await inventoryRepo.findByUserAccess(userId, {
    farm_id: farmId,
    search: item_name,
  });

  const existingItem = existingItems.find((item) => item.name === item_name);

  if (action === "add") {
    if (existingItem) {
      // Update existing item stock
      await inventoryRepo.updateStock(
        existingItem.id,
        quantity,
        "add",
        userId,
        "bulk_operation"
      );
      // Update other fields if provided
      if (unit_cost || supplier || category) {
        const updateData = {};
        if (unit_cost) updateData.current_cost_per_unit = unit_cost;
        if (supplier) updateData.supplier_info = supplier;
        if (category) updateData.category = category;
        await inventoryRepo.updateItem(existingItem.id, updateData, userId);
      }
    } else {
      // Create new item
      const itemData = {
        farm_id: farmId,
        name: item_name,
        qty: quantity,
        current_cost_per_unit: unit_cost || 0,
        supplier_info: supplier,
        category: category,
      };
      await inventoryRepo.createItem(itemData, userId);
    }
  } else if (action === "subtract") {
    if (!existingItem) {
      throw new Error(`Item ${item_name} not found`);
    }

    await inventoryRepo.updateStock(
      existingItem.id,
      quantity,
      "subtract",
      userId,
      "bulk_operation"
    );
  } else {
    throw new Error(`Unknown action: ${action}`);
  }
}

async function updateAnimalHealthBulk(env, animalData, farmId, userId) {
  const { animal_id, health_status, weight, notes, next_check_date } =
    animalData;

  if (!animal_id || !health_status) {
    throw new Error("Required fields missing: animal_id, health_status");
  }

  // Check if animal exists
  const animal = await env.DB.prepare(
    `
    SELECT id FROM animals WHERE farm_id = ? AND id = ?
  `
  )
    .bind(farmId, animal_id)
    .all();

  if (animal.length === 0) {
    throw new Error(`Animal with ID ${animal_id} not found`);
  }

  // Update animal health
  await env.DB.prepare(
    `
    UPDATE animals 
    SET health_status = ?, 
        current_weight = COALESCE(?, current_weight),
        last_health_check = CURRENT_TIMESTAMP,
        health_notes = COALESCE(?, health_notes),
        next_check_date = COALESCE(?, next_check_date),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `
  )
    .bind(health_status, weight, notes, next_check_date, animal_id)
    .run();

  // Create health record
  await env.DB.prepare(
    `
    INSERT INTO animal_health_records (
      animal_id, check_type, health_status, weight, notes, veterinarian, checked_at
    ) VALUES (?, 'bulk_update', ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `
  )
    .bind(animal_id, health_status, weight, notes, userId)
    .run();
}

async function createFinancialEntryBulk(env, financialData, farmId, userId) {
  const {
    type,
    amount,
    description,
    category,
    entry_date,
    reference_id,
    notes,
  } = financialData;

  if (!type || !amount || !description || !category) {
    throw new Error(
      "Required fields missing: type, amount, description, category"
    );
  }

  if (!["income", "expense"].includes(type)) {
    throw new Error("Type must be either income or expense");
  }

  // Use FinanceRepository to create transaction
  const db = new DatabaseOperations(env);
  const financeRepo = new FinanceRepository(db);

  const transactionData = {
    farm_id: farmId,
    type: type,
    amount: amount,
    description: description,
    budget_category: category,
    entry_date: entry_date || new Date().toISOString().split("T")[0],
    reference_id: reference_id,
    notes: notes,
  };

  const result = await financeRepo.createTransaction(transactionData, userId);
  return result.id;
}

async function generateReportBulk(env, reportData, farmId, userId) {
  const { report_type, time_range, include_charts, format, email_recipients } =
    reportData;

  if (!report_type || !time_range) {
    throw new Error("Required fields missing: report_type, time_range");
  }

  // This would typically integrate with a report generation service
  // For now, we'll simulate report generation

  const reportId = `report_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const reportUrl = `/api/reports/${reportId}`;

  // Create report record
  await env.DB.prepare(
    `
    INSERT INTO generated_reports (
      farm_id, report_type, time_range, format, 
      include_charts, report_url, status, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'generating', ?, CURRENT_TIMESTAMP)
  `
  )
    .bind(
      farmId,
      report_type,
      time_range,
      format || "pdf",
      include_charts ? 1 : 0,
      reportUrl,
      userId
    )
    .run();

  return { report_id: reportId, report_url: reportUrl };
}

async function validateBulkOperation(env, userId, body) {
  const { operation_type, data, farm_id } = body;

  try {
    const validationResults = {
      valid: true,
      errors: [],
      warnings: [],
      processed_count: 0,
    };

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const validation = await validateItem(env, operation_type, item, farm_id);

      if (!validation.valid) {
        validationResults.valid = false;
        validationResults.errors.push({
          item_index: i,
          item_data: item,
          errors: validation.errors,
        });
      }

      if (validation.warnings.length > 0) {
        validationResults.warnings.push({
          item_index: i,
          item_data: item,
          warnings: validation.warnings,
        });
      }

      validationResults.processed_count++;
    }

    return createSuccessResponse(validationResults);
  } catch (error) {
    console.error("Validate bulk operation error:", error);
    return createErrorResponse("Validation failed: " + error.message, 400);
  }
}

async function validateItem(env, operationType, item, farmId) {
  const result = { valid: true, errors: [], warnings: [] };

  try {
    switch (operationType) {
      case "bulk_task_creation":
        if (!item.title || !item.description || !item.task_category) {
          result.valid = false;
          result.errors.push(
            "Missing required fields: title, description, task_category"
          );
        }
        break;

      case "bulk_inventory_update":
        if (!item.item_name || !item.action || !item.quantity) {
          result.valid = false;
          result.errors.push(
            "Missing required fields: item_name, action, quantity"
          );
        }
        if (!["add", "subtract"].includes(item.action)) {
          result.valid = false;
          result.errors.push('Action must be either "add" or "subtract"');
        }
        break;

      case "bulk_animal_health_update":
        if (!item.animal_id || !item.health_status) {
          result.valid = false;
          result.errors.push(
            "Missing required fields: animal_id, health_status"
          );
        }
        break;

      case "bulk_financial_entry":
        if (!item.type || !item.amount || !item.description || !item.category) {
          result.valid = false;
          result.errors.push(
            "Missing required fields: type, amount, description, category"
          );
        }
        if (!["income", "expense"].includes(item.type)) {
          result.valid = false;
          result.errors.push('Type must be either "income" or "expense"');
        }
        break;
    }
  } catch (error) {
    result.valid = false;
    result.errors.push("Validation error: " + error.message);
  }

  return result;
}

async function cancelBulkOperation(env, userId, operationId) {
  try {
    const result = await env.DB.prepare(
      `
      UPDATE bulk_operations 
      SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ? AND status IN ('pending', 'processing')
    `
    )
      .bind(operationId, userId)
      .run();

    if (result.changes === 0) {
      return createErrorResponse(
        "Operation not found or cannot be cancelled",
        404
      );
    }

    return createSuccessResponse({
      success: true,
      message: "Operation cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel bulk operation error:", error);
    throw error;
  }
}

async function createCompletionNotification(
  env,
  userId,
  operationId,
  operationType,
  successCount,
  errorCount
) {
  const title = "Bulk Operation Completed";
  const message =
    errorCount === 0
      ? `Successfully completed ${operationType} with ${successCount} items`
      : `Completed ${operationType} with ${successCount} successes and ${errorCount} errors`;

  await env.DB.prepare(
    `
    INSERT INTO notifications (
      user_id, title, message, category, priority, 
      target_type, target_id, action_url, created_at
    ) VALUES (?, ?, ?, 'system', 'medium', 'user', ?, ?, CURRENT_TIMESTAMP)
  `
  )
    .bind(
      userId,
      title,
      message,
      userId,
      `/api/bulk-operations?action=status&operation_id=${operationId}`
    )
    .run();
}
