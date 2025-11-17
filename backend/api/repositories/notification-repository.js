/**
 * Notification Repository - Handles all notification-related database operations
 * Phase 7 Migration: Supporting Systems - Secure notification management with audit trails
 * Provides comprehensive notification CRUD operations with user access control
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "../_repositories.js";

/**
 * Notification Repository - Handles all notification-related database operations
 * Phase 7 Migration: Supporting Systems Enhancement
 */
export class NotificationRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "notifications");
    this.farmRepo = new FarmRepository(dbOperations);
  }

  /**
   * Get notifications for a user with access control
   */
  async getNotifications(userId, options = {}) {
    const {
      farmId,
      limit = 50,
      offset = 0,
      status = "all", // unread, read, all
      category = null,
      priority = null,
    } = options;

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

    if (category) {
      query += ` AND n.category = ?`;
      params.push(category);
    }

    if (priority) {
      query += ` AND n.priority = ?`;
      params.push(priority);
    }

    query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "notifications",
      context: { getNotifications: true, userId, options },
    });

    return result;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId, farmId = null) {
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

    const result = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "notifications",
      context: { getUnreadCount: true, userId, farmId },
    });

    return result[0]?.count || 0;
  }

  /**
   * Get notification categories with counts
   */
  async getCategories(userId, farmId = null) {
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

    const result = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "notifications",
      context: { getCategories: true, userId, farmId },
    });

    return result;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    // First verify access
    const hasAccess = await this.hasNotificationAccess(notificationId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to notification");
    }

    const result = await this.db.executeQuery(
      `
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [notificationId],
      {
        operation: "run",
        table: "notifications",
        context: { markAsRead: true, notificationId, userId },
      }
    );

    return { success: true, updated_rows: result.changes };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId, farmId = null) {
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

    const result = await this.db.executeQuery(query, params, {
      operation: "run",
      table: "notifications",
      context: { markAllAsRead: true, userId, farmId },
    });

    return { success: true, updated_rows: result.changes };
  }

  /**
   * Dismiss notification
   */
  async dismiss(notificationId, userId) {
    // First verify access
    const hasAccess = await this.hasNotificationAccess(notificationId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to notification");
    }

    const result = await this.db.executeQuery(
      `
      UPDATE notifications
      SET is_dismissed = 1, dismissed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [notificationId],
      {
        operation: "run",
        table: "notifications",
        context: { dismiss: true, notificationId, userId },
      }
    );

    return { success: true, updated_rows: result.changes };
  }

  /**
   * Create a new notification
   */
  async create(notificationData, userId) {
    const {
      title,
      message,
      category,
      priority = "medium",
      target_type = "user",
      target_id = userId,
      action_url = null,
      is_global = 0,
      expires_at = null,
    } = notificationData;

    if (!title || !message || !category) {
      throw new Error("Required fields missing: title, message, category");
    }

    // Validate target access if it's a farm notification
    if (target_type === "farm") {
      const hasAccess = await this.farmRepo.hasUserAccess(target_id, userId);
      if (!hasAccess) {
        throw new Error("Access denied to target farm");
      }
    }

    const result = await this.db.executeQuery(
      `
      INSERT INTO notifications (
        user_id, title, message, category, priority,
        target_type, target_id, action_url, is_global,
        expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
      [
        target_type === "user" ? target_id : null,
        title,
        message,
        category,
        priority,
        target_type,
        target_id,
        action_url,
        is_global,
        expires_at,
      ],
      {
        operation: "run",
        table: "notifications",
        context: { create: true, notificationData, userId },
      }
    );

    return {
      success: true,
      notification_id: result.lastInsertRowid,
      id: result.lastInsertRowid,
    };
  }

  /**
   * Update notification settings for a user
   */
  async updateSettings(userId, settings) {
    await this.db.executeQuery(
      `
      INSERT INTO notification_settings (user_id, categories, channels, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id)
      DO UPDATE SET
        categories = excluded.categories,
        channels = excluded.channels,
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        userId,
        JSON.stringify(settings.categories || {}),
        JSON.stringify(settings.channels || {}),
      ],
      {
        operation: "run",
        table: "notification_settings",
        context: { updateSettings: true, userId, settings },
      }
    );

    return { success: true };
  }

  /**
   * Get notification settings for a user
   */
  async getSettings(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT categories, channels, updated_at
      FROM notification_settings
      WHERE user_id = ?
    `,
      [userId],
      {
        operation: "query",
        table: "notification_settings",
        context: { getSettings: true, userId },
      }
    );

    if (result.length === 0) {
      return {
        categories: {},
        channels: { email: true, in_app: true, push: false },
      };
    }

    const settings = result[0];
    return {
      categories: JSON.parse(settings.categories || "{}"),
      channels: JSON.parse(settings.channels || "{}"),
      updated_at: settings.updated_at,
    };
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld = 90) {
    const result = await this.db.executeQuery(
      `
      DELETE FROM notifications
      WHERE created_at < datetime('now', '-${daysOld} days')
      AND is_read = 1
      AND is_dismissed = 1
    `,
      [],
      {
        operation: "run",
        table: "notifications",
        context: { cleanupOldNotifications: true, daysOld },
      }
    );

    return { deleted_count: result.changes };
  }

  /**
   * Get notification statistics for a user
   */
  async getStatistics(userId, farmId = null, timeframe = "30days") {
    let query = `
      SELECT
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread_count,
        COUNT(CASE WHEN is_read = 1 THEN 1 END) as read_count,
        COUNT(CASE WHEN is_dismissed = 1 THEN 1 END) as dismissed_count,
        COUNT(DISTINCT category) as unique_categories,
        MAX(created_at) as latest_notification
      FROM notifications
      WHERE (
        user_id = ?
        OR (target_type = 'farm' AND target_id IN (
          SELECT farm_id FROM farm_members WHERE user_id = ?
        ))
        OR is_global = 1
      )
      AND created_at >= datetime('now', '-${timeframe}')
    `;

    const params = [userId, userId];

    if (farmId) {
      query += ` AND (target_id = ? OR is_global = 1)`;
      params.push(farmId);
    }

    const result = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "notifications",
      context: { getStatistics: true, userId, farmId, timeframe },
    });

    return result[0] || {};
  }

  /**
   * Check if user has access to a notification
   */
  async hasNotificationAccess(notificationId, userId) {
    const result = await this.db.executeQuery(
      `
      SELECT COUNT(*) as count
      FROM notifications n
      WHERE n.id = ? AND (
        n.user_id = ?
        OR (n.target_type = 'farm' AND n.target_id IN (
          SELECT farm_id FROM farm_members WHERE user_id = ?
        ))
        OR n.is_global = 1
      )
    `,
      [notificationId, userId, userId],
      {
        operation: "query",
        table: "notifications",
        context: { hasNotificationAccess: true, notificationId, userId },
      }
    );

    return result[0]?.count > 0;
  }

  /**
   * Create system notification (for automated alerts)
   */
  async createSystemNotification(notificationData, farmId = null) {
    const {
      title,
      message,
      category,
      priority = "medium",
      action_url = null,
      expires_at = null,
    } = notificationData;

    if (!title || !message || !category) {
      throw new Error("Required fields missing: title, message, category");
    }

    const result = await this.db.executeQuery(
      `
      INSERT INTO notifications (
        title, message, category, priority,
        target_type, target_id, action_url, is_global,
        expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
      [
        title,
        message,
        category,
        priority,
        farmId ? "farm" : "global",
        farmId || null,
        action_url,
        farmId ? 0 : 1,
        expires_at,
      ],
      {
        operation: "run",
        table: "notifications",
        context: { createSystemNotification: true, notificationData, farmId },
      }
    );

    return {
      success: true,
      notification_id: result.lastInsertRowid,
      id: result.lastInsertRowid,
    };
  }

  /**
   * Bulk create notifications
   */
  async bulkCreate(notifications, userId) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      throw new Error("Notifications array is required");
    }

    const results = [];
    for (const notification of notifications) {
      try {
        const result = await this.create(notification, userId);
        results.push({ success: true, id: result.id, notification });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          notification,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return {
      total: notifications.length,
      success_count: successCount,
      error_count: errorCount,
      results,
    };
  }

  /**
   * Get notifications by category for analytics
   */
  async getByCategory(userId, category, options = {}) {
    const { limit = 100, offset = 0, farmId = null } = options;

    let query = `
      SELECT *
      FROM notifications
      WHERE category = ? AND (
        user_id = ?
        OR (target_type = 'farm' AND target_id IN (
          SELECT farm_id FROM farm_members WHERE user_id = ?
        ))
        OR is_global = 1
      )
    `;

    const params = [category, userId, userId];

    if (farmId) {
      query += ` AND (target_id = ? OR is_global = 1)`;
      params.push(farmId);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "notifications",
      context: { getByCategory: true, userId, category, options },
    });

    return result;
  }
}
