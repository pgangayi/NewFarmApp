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

    // Handle different notification endpoints
    if (method === "GET") {
      const action = url.searchParams.get("action") || "list";
      const farmId = url.searchParams.get("farm_id");
      const limit = url.searchParams.get("limit") || "50";
      const offset = url.searchParams.get("offset") || "0";
      const status = url.searchParams.get("status"); // unread, read, all

      if (action === "list") {
        return await getNotifications(
          env,
          user.id,
          farmId,
          limit,
          offset,
          status
        );
      } else if (action === "unread_count") {
        return await getUnreadCount(env, user.id, farmId);
      } else if (action === "categories") {
        return await getNotificationCategories(env, user.id, farmId);
      }
    } else if (method === "POST") {
      const body = await request.json();
      const { action } = body;

      if (action === "mark_read") {
        return await markNotificationRead(env, user.id, body.notification_id);
      } else if (action === "mark_all_read") {
        return await markAllRead(env, user.id, body.farm_id);
      } else if (action === "dismiss") {
        return await dismissNotification(env, user.id, body.notification_id);
      } else if (action === "settings") {
        return await updateNotificationSettings(env, user.id, body.settings);
      } else if (action === "create") {
        return await createNotification(env, user.id, body.notification);
      } else if (action === "trigger_system_check") {
        return await triggerSystemNotifications(env, user.id, body.farm_id);
      }
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Notifications error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

async function getNotifications(env, userId, farmId, limit, offset, status) {
  try {
    // Build query with user permissions
    let query = `
      SELECT 
        n.*,
        f.name as farm_name,
        CASE 
          WHEN n.user_id = ? THEN 'personal'
          WHEN n.target_type = 'farm' AND EXISTS (
            SELECT 1 FROM farm_members WHERE user_id = ? AND farm_id = n.target_id
          ) THEN 'farm'
          ELSE 'global'
        END as access_level
      FROM notifications n
      LEFT JOIN farms f ON n.target_id = f.id AND n.target_type = 'farm'
      WHERE (
        n.user_id = ? 
        OR (n.target_type = 'farm' AND n.target_id IN (
          SELECT farm_id FROM farm_members WHERE user_id = ?
        ))
        OR n.is_global = 1
      )
    `;

    const params = [userId, userId, userId, userId];

    if (farmId) {
      query += ` AND (n.target_id = ? OR n.is_global = 1)`;
      params.push(farmId);
    }

    if (status === "unread") {
      query += ` AND n.is_read = 0`;
    } else if (status === "read") {
      query += ` AND n.is_read = 1`;
    }

    query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await env.DB.prepare(query)
      .bind(...params)
      .all();
    return createSuccessResponse({ notifications: result });
  } catch (error) {
    console.error("Get notifications error:", error);
    throw error;
  }
}

async function getUnreadCount(env, userId, farmId) {
  try {
    let query = `
      SELECT COUNT(*) as count
      FROM notifications n
      WHERE n.is_read = 0 AND (
        n.user_id = ? 
        OR (n.target_type = 'farm' AND n.target_id IN (
          SELECT farm_id FROM farm_members WHERE user_id = ?
        ))
        OR n.is_global = 1
      )
    `;

    const params = [userId, userId];

    if (farmId) {
      query += ` AND (n.target_id = ? OR n.is_global = 1)`;
      params.push(farmId);
    }

    const result = await env.DB.prepare(query)
      .bind(...params)
      .all();
    return createSuccessResponse({ unread_count: result[0].count });
  } catch (error) {
    console.error("Get unread count error:", error);
    throw error;
  }
}

async function getNotificationCategories(env, userId, farmId) {
  try {
    let query = `
      SELECT 
        n.category,
        COUNT(*) as total_count,
        SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM notifications n
      WHERE (
        n.user_id = ? 
        OR (n.target_type = 'farm' AND n.target_id IN (
          SELECT farm_id FROM farm_members WHERE user_id = ?
        ))
        OR n.is_global = 1
      )
    `;

    const params = [userId, userId];

    if (farmId) {
      query += ` AND (n.target_id = ? OR n.is_global = 1)`;
      params.push(farmId);
    }

    query += ` GROUP BY n.category ORDER BY unread_count DESC`;

    const result = await env.DB.prepare(query)
      .bind(...params)
      .all();
    return createSuccessResponse({ categories: result });
  } catch (error) {
    console.error("Get notification categories error:", error);
    throw error;
  }
}

async function markNotificationRead(env, userId, notificationId) {
  try {
    const result = await env.DB.prepare(
      `
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (
        user_id = ? 
        OR target_id IN (SELECT farm_id FROM farm_members WHERE user_id = ?)
      )
    `
    )
      .bind(notificationId, userId, userId)
      .run();

    return createSuccessResponse({
      success: true,
      updated_rows: result.changes,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    throw error;
  }
}

async function markAllRead(env, userId, farmId) {
  try {
    let query = `
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE is_read = 0 AND (
        user_id = ? 
        OR (target_type = 'farm' AND target_id IN (
          SELECT farm_id FROM farm_members WHERE user_id = ?
        ))
        OR is_global = 1
      )
    `;

    const params = [userId, userId];

    if (farmId) {
      query += ` AND (target_id = ? OR is_global = 1)`;
      params.push(farmId);
    }

    const result = await env.DB.prepare(query)
      .bind(...params)
      .run();
    return createSuccessResponse({
      success: true,
      updated_rows: result.changes,
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    throw error;
  }
}

async function dismissNotification(env, userId, notificationId) {
  try {
    const result = await env.DB.prepare(
      `
      UPDATE notifications 
      SET is_dismissed = 1, dismissed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (
        user_id = ? 
        OR target_id IN (SELECT farm_id FROM farm_members WHERE user_id = ?)
      )
    `
    )
      .bind(notificationId, userId, userId)
      .run();

    return createSuccessResponse({
      success: true,
      updated_rows: result.changes,
    });
  } catch (error) {
    console.error("Dismiss notification error:", error);
    throw error;
  }
}

async function updateNotificationSettings(env, userId, settings) {
  try {
    // Create or update notification settings
    await env.DB.prepare(
      `
      INSERT INTO notification_settings (user_id, categories, channels, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) 
      DO UPDATE SET 
        categories = excluded.categories,
        channels = excluded.channels,
        updated_at = CURRENT_TIMESTAMP
    `
    )
      .bind(
        userId,
        JSON.stringify(settings.categories),
        JSON.stringify(settings.channels)
      )
      .run();

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error("Update notification settings error:", error);
    throw error;
  }
}

async function createNotification(env, userId, notification) {
  try {
    const {
      title,
      message,
      category,
      priority = "medium",
      target_type = "user",
      target_id = userId,
      action_url = null,
      is_global = 0,
    } = notification;

    const result = await env.DB.prepare(
      `
      INSERT INTO notifications (
        user_id, title, message, category, priority, 
        target_type, target_id, action_url, is_global, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `
    )
      .bind(
        target_type === "user" ? target_id : null,
        title,
        message,
        category,
        priority,
        target_type,
        target_id,
        action_url,
        is_global
      )
      .run();

    return createSuccessResponse({
      success: true,
      notification_id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
}

async function triggerSystemNotifications(env, userId, farmId) {
  try {
    const notifications = [];

    // Check for overdue tasks
    const overdueTasks = await env.DB.prepare(
      `
      SELECT COUNT(*) as count FROM tasks 
      WHERE farm_id = ? AND due_date < date('now') AND status != 'completed'
    `
    )
      .bind(farmId)
      .all();

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
    const lowStock = await env.DB.prepare(
      `
      SELECT COUNT(*) as count, ii.name 
      FROM inventory_items ii
      WHERE ii.farm_id = ? AND ii.qty <= ii.reorder_threshold
      GROUP BY ii.id
      ORDER BY ii.qty ASC
      LIMIT 5
    `
    )
      .bind(farmId)
      .all();

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
    const unhealthyAnimals = await env.DB.prepare(
      `
      SELECT COUNT(*) as count FROM animals 
      WHERE farm_id = ? AND health_status != 'healthy'
    `
    )
      .bind(farmId)
      .all();

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
    const financialAlerts = await checkFinancialAlerts(env, farmId);
    notifications.push(...financialAlerts);

    // Check weather alerts (if weather service is available)
    const weatherAlerts = await checkWeatherAlerts(env, farmId);
    notifications.push(...weatherAlerts);

    // Create notifications
    for (const notification of notifications) {
      await createNotification(env, userId, notification);
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

async function checkFinancialAlerts(env, farmId) {
  const notifications = [];

  try {
    // Check for negative cash flow
    const cashFlow = await env.DB.prepare(
      `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM finance_entries
      WHERE farm_id = ? AND date(entry_date) >= date('now', '-30 days')
    `
    )
      .bind(farmId)
      .all();

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

async function checkWeatherAlerts(env, farmId) {
  const notifications = [];

  try {
    // This would integrate with a weather service
    // For now, we'll simulate weather-based notifications

    // Check if we have weather data for the farm
    const farm = await env.DB.prepare(
      `
      SELECT location FROM farms WHERE id = ?
    `
    )
      .bind(farmId)
      .all();

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
