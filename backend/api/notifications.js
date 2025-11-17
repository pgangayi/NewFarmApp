import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { DatabaseOperations } from "./_database.js";
import { NotificationRepository } from "./repositories/notification-repository.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Initialize database operations and repositories
  const db = new DatabaseOperations(env);
  const notificationRepo = new NotificationRepository(db);

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Handle different notification endpoints
    if (method === "GET") {
      const action = url.searchParams.get("action") || "list";
      const farmId = url.searchParams.get("farm_id");
      const limit = url.searchParams.get("limit") || "50";
      const offset = url.searchParams.get("offset") || "0";
      const status = url.searchParams.get("status"); // unread, read, all

      if (action === "list") {
        const notifications = await notificationRepo.getNotifications(user.id, {
          farmId,
          limit: parseInt(limit),
          offset: parseInt(offset),
          status,
        });
        return createSuccessResponse({ notifications });
      } else if (action === "unread_count") {
        const unread_count = await notificationRepo.getUnreadCount(
          user.id,
          farmId
        );
        return createSuccessResponse({ unread_count });
      } else if (action === "categories") {
        const categories = await notificationRepo.getCategories(
          user.id,
          farmId
        );
        return createSuccessResponse({ categories });
      }
    } else if (method === "POST") {
      const body = await request.json();
      const { action } = body;

      if (action === "mark_read") {
        const result = await notificationRepo.markAsRead(
          body.notification_id,
          user.id
        );
        return createSuccessResponse(result);
      } else if (action === "mark_all_read") {
        const result = await notificationRepo.markAllAsRead(
          user.id,
          body.farm_id
        );
        return createSuccessResponse(result);
      } else if (action === "dismiss") {
        const result = await notificationRepo.dismiss(
          body.notification_id,
          user.id
        );
        return createSuccessResponse(result);
      } else if (action === "settings") {
        const result = await notificationRepo.updateSettings(
          user.id,
          body.settings
        );
        return createSuccessResponse(result);
      } else if (action === "create") {
        const result = await notificationRepo.create(
          body.notification,
          user.id
        );
        return createSuccessResponse(result);
      } else if (action === "trigger_system_check") {
        return await triggerSystemNotifications(
          notificationRepo,
          user.id,
          body.farm_id
        );
      }
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Notifications error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

async function triggerSystemNotifications(notificationRepo, userId, farmId) {
  try {
    const notifications = [];

    // Check for overdue tasks
    const overdueTasks = await db.executeQuery(
      `
      SELECT COUNT(*) as count FROM tasks
      WHERE farm_id = ? AND due_date < date('now') AND status != 'completed'
    `,
      [farmId],
      {
        operation: "query",
        table: "tasks",
        context: {
          triggerSystemNotifications: true,
          checkOverdueTasks: true,
          farmId,
        },
      }
    );

    if (overdueTasks[0].count > 0) {
      notifications.push({
        title: "Overdue Tasks Alert",
        message: `${overdueTasks[0].count} tasks are overdue and need attention`,
        category: "tasks",
        priority: "high",
        target_type: "farm",
        target_id: farmId,
      });
    }

    // Check for low stock items
    const lowStock = await db.executeQuery(
      `
      SELECT COUNT(*) as count, ii.name
      FROM inventory_items ii
      WHERE ii.farm_id = ? AND ii.qty <= ii.reorder_threshold
      GROUP BY ii.id
      ORDER BY ii.qty ASC
      LIMIT 5
    `,
      [farmId],
      {
        operation: "query",
        table: "inventory_items",
        context: {
          triggerSystemNotifications: true,
          checkLowStock: true,
          farmId,
        },
      }
    );

    if (lowStock.length > 0) {
      const itemNames = lowStock.map((item) => item.name).join(", ");
      notifications.push({
        title: "Low Stock Alert",
        message: `Items running low: ${itemNames}`,
        category: "inventory",
        priority: "medium",
        target_type: "farm",
        target_id: farmId,
      });
    }

    // Check for unhealthy animals
    const unhealthyAnimals = await db.executeQuery(
      `
      SELECT COUNT(*) as count FROM animals
      WHERE farm_id = ? AND health_status != 'healthy'
    `,
      [farmId],
      {
        operation: "query",
        table: "animals",
        context: {
          triggerSystemNotifications: true,
          checkUnhealthyAnimals: true,
          farmId,
        },
      }
    );

    if (unhealthyAnimals[0].count > 0) {
      notifications.push({
        title: "Animal Health Alert",
        message: `${unhealthyAnimals[0].count} animals need health attention`,
        category: "animals",
        priority: "high",
        target_type: "farm",
        target_id: farmId,
      });
    }

    // Check financial alerts
    const financialAlerts = await checkFinancialAlerts(db, farmId);
    notifications.push(...financialAlerts);

    // Check weather alerts (if weather service is available)
    const weatherAlerts = await checkWeatherAlerts(db, farmId);
    notifications.push(...weatherAlerts);

    // Create notifications
    for (const notification of notifications) {
      await notificationRepo.create(notification, userId);
    }

    return createSuccessResponse({
      success: true,
      notifications_created: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Trigger system notifications error:", error);
    throw error;
  }
}

async function checkFinancialAlerts(db, farmId) {
  const notifications = [];

  try {
    // Check for negative cash flow
    const cashFlow = await db.executeQuery(
      `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM finance_entries
      WHERE farm_id = ? AND date(entry_date) >= date('now', '-30 days')
    `,
      [farmId],
      {
        operation: "query",
        table: "finance_entries",
        context: { checkFinancialAlerts: true, farmId },
      }
    );

    const income = cashFlow[0]?.income || 0;
    const expenses = cashFlow[0]?.expenses || 0;

    if (expenses > income * 1.2) {
      // Expenses exceed income by 20%
      notifications.push({
        title: "Financial Alert",
        message: "Expenses are significantly higher than income this month",
        category: "finance",
        priority: "medium",
        target_type: "farm",
        target_id: farmId,
      });
    }
  } catch (error) {
    console.error("Check financial alerts error:", error);
  }

  return notifications;
}

async function checkWeatherAlerts(db, farmId) {
  const notifications = [];

  try {
    // This would integrate with a weather service
    // For now, we'll simulate weather-based notifications

    // Check if we have weather data for the farm
    const farm = await db.executeQuery(
      `
      SELECT location FROM farms WHERE id = ?
    `,
      [farmId],
      {
        operation: "query",
        table: "farms",
        context: { checkWeatherAlerts: true, farmId },
      }
    );

    if (farm[0]?.location) {
      // Simulate weather alert (in real implementation, this would call a weather API)
      const randomAlert = Math.random() < 0.1; // 10% chance of weather alert

      if (randomAlert) {
        notifications.push({
          title: "Weather Alert",
          message:
            "Heavy rain expected in the next 24 hours. Consider adjusting irrigation schedules.",
          category: "weather",
          priority: "medium",
          target_type: "farm",
          target_id: farmId,
        });
      }
    }
  } catch (error) {
    console.error("Check weather alerts error:", error);
  }

  return notifications;
}
