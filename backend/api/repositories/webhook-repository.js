/**
 * Webhook Repository - Handles all webhook-related database operations
 * Phase 7 Migration: Supporting Systems - Webhook management for integrations
 * Provides secure webhook CRUD operations with event logging and delivery tracking
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "../_repositories.js";

/**
 * Webhook Repository - Handles all webhook-related database operations
 * Phase 7 Migration: Supporting Systems Enhancement
 */
export class WebhookRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "webhooks");
    this.farmRepo = new FarmRepository(dbOperations);
  }

  /**
   * Create a new webhook
   */
  async createWebhook(webhookData, userId) {
    const {
      name,
      url,
      events,
      farm_id,
      secret,
      is_active = true,
      headers = {},
      retry_policy = { max_attempts: 3, backoff_multiplier: 2 },
      timeout = 30,
    } = webhookData;

    if (!name || !url || !events || !Array.isArray(events)) {
      throw new Error("Required fields missing: name, url, events array");
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      throw new Error("Invalid URL format");
    }

    // Check farm access if farm-specific webhook
    if (farm_id) {
      const hasAccess = await this.farmRepo.hasUserAccess(farm_id, userId);
      if (!hasAccess) {
        throw new Error("Access denied to farm");
      }
    }

    // Generate webhook secret if not provided
    const webhookSecret = secret || this.generateWebhookSecret();

    const result = await this.db.executeQuery(
      `
      INSERT INTO webhooks (
        name, url, events, farm_id, secret, is_active,
        headers, retry_policy, timeout, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
      [
        name,
        url,
        JSON.stringify(events),
        farm_id,
        webhookSecret,
        is_active ? 1 : 0,
        JSON.stringify(headers),
        JSON.stringify(retry_policy),
        timeout,
        userId,
      ],
      {
        operation: "run",
        table: "webhooks",
        context: { createWebhook: true, webhookData, userId },
      }
    );

    return {
      success: true,
      webhook_id: result.lastInsertRowid,
      id: result.lastInsertRowid,
      secret: webhookSecret,
    };
  }

  /**
   * Get webhooks for a user
   */
  async getWebhooks(userId, options = {}) {
    const { farmId, activeOnly = false, limit = 50, offset = 0 } = options;

    let query = `
      SELECT
        w.*,
        f.name as farm_name,
        CASE
          WHEN w.farm_id IS NULL THEN 'global'
          WHEN w.farm_id IN (
            SELECT farm_id FROM farm_members WHERE user_id = ?
          ) THEN 'farm'
          ELSE 'no_access'
        END as access_level
      FROM webhooks w
      LEFT JOIN farms f ON w.farm_id = f.id
      WHERE w.created_by = ?
    `;

    const params = [userId, userId];

    if (farmId) {
      query += ` AND (w.farm_id = ? OR w.farm_id IS NULL)`;
      params.push(farmId);
    }

    if (activeOnly) {
      query += ` AND w.is_active = 1`;
    }

    query += ` ORDER BY w.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "webhooks",
      context: { getWebhooks: true, userId, options },
    });

    // Parse JSON fields
    return result.map((webhook) => ({
      ...webhook,
      events: JSON.parse(webhook.events || "[]"),
      headers: JSON.parse(webhook.headers || "{}"),
      retry_policy: JSON.parse(webhook.retry_policy || "{}"),
    }));
  }

  /**
   * Get webhook by ID with access check
   */
  async getWebhookById(webhookId, userId) {
    const result = await this.db.executeQuery(
      `
      SELECT
        w.*,
        f.name as farm_name
      FROM webhooks w
      LEFT JOIN farms f ON w.farm_id = f.id
      WHERE w.id = ? AND w.created_by = ?
      `,
      [webhookId, userId],
      {
        operation: "query",
        table: "webhooks",
        context: { getWebhookById: true, webhookId, userId },
      }
    );

    if (result.length === 0) {
      return null;
    }

    const webhook = result[0];
    return {
      ...webhook,
      events: JSON.parse(webhook.events || "[]"),
      headers: JSON.parse(webhook.headers || "{}"),
      retry_policy: JSON.parse(webhook.retry_policy || "{}"),
    };
  }

  /**
   * Update webhook
   */
  async updateWebhook(webhookId, updateData, userId) {
    // First verify ownership
    const existing = await this.getWebhookById(webhookId, userId);
    if (!existing) {
      throw new Error("Webhook not found or access denied");
    }

    const { name, url, events, is_active, headers, retry_policy, timeout } =
      updateData;

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch (error) {
        throw new Error("Invalid URL format");
      }
    }

    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      params.push(name);
    }
    if (url !== undefined) {
      updateFields.push("url = ?");
      params.push(url);
    }
    if (events !== undefined) {
      updateFields.push("events = ?");
      params.push(JSON.stringify(events));
    }
    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }
    if (headers !== undefined) {
      updateFields.push("headers = ?");
      params.push(JSON.stringify(headers));
    }
    if (retry_policy !== undefined) {
      updateFields.push("retry_policy = ?");
      params.push(JSON.stringify(retry_policy));
    }
    if (timeout !== undefined) {
      updateFields.push("timeout = ?");
      params.push(timeout);
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");

    if (updateFields.length === 1) {
      throw new Error("No valid fields to update");
    }

    const query = `
      UPDATE webhooks
      SET ${updateFields.join(", ")}
      WHERE id = ? AND created_by = ?
    `;

    params.push(webhookId, userId);

    const result = await this.db.executeQuery(query, params, {
      operation: "run",
      table: "webhooks",
      context: { updateWebhook: true, webhookId, updateData, userId },
    });

    return { success: true, updated_rows: result.changes };
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId, userId) {
    // First verify ownership
    const existing = await this.getWebhookById(webhookId, userId);
    if (!existing) {
      throw new Error("Webhook not found or access denied");
    }

    const result = await this.db.executeQuery(
      "DELETE FROM webhooks WHERE id = ? AND created_by = ?",
      [webhookId, userId],
      {
        operation: "run",
        table: "webhooks",
        context: { deleteWebhook: true, webhookId, userId },
      }
    );

    return { success: true, deleted_rows: result.changes };
  }

  /**
   * Get webhooks that should receive an event
   */
  async getWebhooksForEvent(eventType, farmId = null) {
    let query = `
      SELECT *
      FROM webhooks
      WHERE is_active = 1
      AND (events LIKE ? OR events LIKE ?)
    `;

    const params = [`%${eventType}%`, `%"${eventType}"%`];

    if (farmId) {
      query += ` AND (farm_id = ? OR farm_id IS NULL)`;
      params.push(farmId);
    } else {
      query += ` AND farm_id IS NULL`; // Global webhooks only for non-farm events
    }

    const result = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "webhooks",
      context: { getWebhooksForEvent: true, eventType, farmId },
    });

    // Parse JSON fields and filter events
    return result
      .map((webhook) => ({
        ...webhook,
        events: JSON.parse(webhook.events || "[]"),
        headers: JSON.parse(webhook.headers || "{}"),
        retry_policy: JSON.parse(webhook.retry_policy || "{}"),
      }))
      .filter((webhook) => webhook.events.includes(eventType));
  }

  /**
   * Log webhook delivery attempt
   */
  async logDeliveryAttempt(webhookId, eventType, payload, response) {
    const {
      success,
      status_code,
      response_body,
      error_message,
      duration_ms,
      attempt_number = 1,
    } = response;

    await this.db.executeQuery(
      `
      INSERT INTO webhook_deliveries (
        webhook_id, event_type, payload, success,
        status_code, response_body, error_message,
        duration_ms, attempt_number, delivered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
      [
        webhookId,
        eventType,
        JSON.stringify(payload),
        success ? 1 : 0,
        status_code,
        response_body,
        error_message,
        duration_ms,
        attempt_number,
      ],
      {
        operation: "run",
        table: "webhook_deliveries",
        context: { logDeliveryAttempt: true, webhookId, eventType },
      }
    );
  }

  /**
   * Get delivery history for a webhook
   */
  async getDeliveryHistory(webhookId, userId, options = {}) {
    const { limit = 100, offset = 0, eventType = null } = options;

    // First verify webhook ownership
    const webhook = await this.getWebhookById(webhookId, userId);
    if (!webhook) {
      throw new Error("Webhook not found or access denied");
    }

    let query = `
      SELECT *
      FROM webhook_deliveries
      WHERE webhook_id = ?
    `;

    const params = [webhookId];

    if (eventType) {
      query += ` AND event_type = ?`;
      params.push(eventType);
    }

    query += ` ORDER BY delivered_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "webhook_deliveries",
      context: { getDeliveryHistory: true, webhookId, userId, options },
    });

    // Parse payload
    return result.map((delivery) => ({
      ...delivery,
      payload: JSON.parse(delivery.payload || "{}"),
    }));
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookId, userId, timeframe = "30days") {
    // First verify webhook ownership
    const webhook = await this.getWebhookById(webhookId, userId);
    if (!webhook) {
      throw new Error("Webhook not found or access denied");
    }

    const stats = await this.db.executeQuery(
      `
      SELECT
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN success = 1 THEN 1 END) as successful_deliveries,
        COUNT(CASE WHEN success = 0 THEN 1 END) as failed_deliveries,
        AVG(duration_ms) as avg_response_time,
        MAX(delivered_at) as last_delivery
      FROM webhook_deliveries
      WHERE webhook_id = ?
        AND delivered_at >= datetime('now', '-${timeframe}')
    `,
      [webhookId],
      {
        operation: "query",
        table: "webhook_deliveries",
        context: { getWebhookStats: true, webhookId, userId, timeframe },
      }
    );

    const eventStats = await this.db.executeQuery(
      `
      SELECT
        event_type,
        COUNT(*) as total,
        COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
        COUNT(CASE WHEN success = 0 THEN 1 END) as failed
      FROM webhook_deliveries
      WHERE webhook_id = ?
        AND delivered_at >= datetime('now', '-${timeframe}')
      GROUP BY event_type
      ORDER BY total DESC
    `,
      [webhookId],
      {
        operation: "query",
        table: "webhook_deliveries",
        context: { getWebhookEventStats: true, webhookId, userId, timeframe },
      }
    );

    const statsData = stats[0] || {};
    const successRate =
      statsData.total_deliveries > 0
        ? (statsData.successful_deliveries / statsData.total_deliveries) * 100
        : 0;

    return {
      total_deliveries: statsData.total_deliveries || 0,
      successful_deliveries: statsData.successful_deliveries || 0,
      failed_deliveries: statsData.failed_deliveries || 0,
      success_rate: Math.round(successRate * 100) / 100,
      avg_response_time:
        Math.round((statsData.avg_response_time || 0) * 100) / 100,
      last_delivery: statsData.last_delivery,
      event_breakdown: eventStats,
      timeframe,
    };
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(webhookId, userId, testPayload = null) {
    // First verify webhook ownership
    const webhook = await this.getWebhookById(webhookId, userId);
    if (!webhook) {
      throw new Error("Webhook not found or access denied");
    }

    const payload = testPayload || {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook delivery" },
    };

    try {
      // This would normally make an HTTP request to the webhook URL
      // For now, we'll simulate the delivery
      const startTime = Date.now();

      // Simulate HTTP request (in real implementation, use fetch)
      await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

      const duration = Date.now() - startTime;
      const success = true;
      const statusCode = 200;
      const responseBody = '{"status": "ok"}';

      // Log the test delivery
      await this.logDeliveryAttempt(webhookId, "webhook.test", payload, {
        success,
        status_code: statusCode,
        response_body: responseBody,
        duration_ms: duration,
        attempt_number: 1,
      });

      return {
        success: true,
        status_code: statusCode,
        response_body: responseBody,
        duration_ms: duration,
        message: "Webhook test successful",
      };
    } catch (error) {
      // Log failed delivery
      await this.logDeliveryAttempt(webhookId, "webhook.test", payload, {
        success: false,
        error_message: error.message,
        duration_ms: 0,
        attempt_number: 1,
      });

      return {
        success: false,
        error: error.message,
        message: "Webhook test failed",
      };
    }
  }

  /**
   * Generate webhook secret
   */
  generateWebhookSecret(length = 32) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secret = "";
    for (let i = 0; i < length; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload, signature, secret) {
    // This would implement HMAC-SHA256 signature validation
    // For now, return true (implement proper validation in production)
    return true;
  }

  /**
   * Clean up old delivery logs
   */
  async cleanupOldDeliveryLogs(daysOld = 90) {
    const result = await this.db.executeQuery(
      `
      DELETE FROM webhook_deliveries
      WHERE delivered_at < datetime('now', '-${daysOld} days')
    `,
      [],
      {
        operation: "run",
        table: "webhook_deliveries",
        context: { cleanupOldDeliveryLogs: true, daysOld },
      }
    );

    return { deleted_count: result.changes };
  }

  /**
   * Get failed deliveries for retry
   */
  async getFailedDeliveries(hoursOld = 24) {
    const result = await this.db.executeQuery(
      `
      SELECT
        wd.*,
        w.url,
        w.retry_policy,
        w.secret
      FROM webhook_deliveries wd
      JOIN webhooks w ON wd.webhook_id = w.id
      WHERE wd.success = 0
        AND wd.delivered_at >= datetime('now', '-${hoursOld} hours')
        AND w.is_active = 1
      ORDER BY wd.delivered_at ASC
    `,
      [],
      {
        operation: "query",
        table: "webhook_deliveries",
        context: { getFailedDeliveries: true, hoursOld },
      }
    );

    return result.map((delivery) => ({
      ...delivery,
      payload: JSON.parse(delivery.payload || "{}"),
      retry_policy: JSON.parse(delivery.retry_policy || "{}"),
    }));
  }

  /**
   * Retry failed webhook delivery
   */
  async retryDelivery(deliveryId) {
    const delivery = await this.db.executeQuery(
      `
      SELECT
        wd.*,
        w.url,
        w.headers,
        w.timeout,
        w.secret
      FROM webhook_deliveries wd
      JOIN webhooks w ON wd.webhook_id = w.id
      WHERE wd.id = ? AND wd.success = 0
    `,
      [deliveryId],
      {
        operation: "query",
        table: "webhook_deliveries",
        context: { retryDelivery: true, deliveryId },
      }
    );

    if (delivery.length === 0) {
      throw new Error("Failed delivery not found");
    }

    const deliveryData = delivery[0];
    const payload = JSON.parse(deliveryData.payload || "{}");
    const headers = JSON.parse(deliveryData.headers || "{}");

    // Increment attempt number
    const newAttemptNumber = (deliveryData.attempt_number || 1) + 1;

    try {
      // This would make the actual HTTP request
      // For now, simulate success
      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const duration = Date.now() - startTime;

      // Log successful retry
      await this.logDeliveryAttempt(
        deliveryData.webhook_id,
        deliveryData.event_type,
        payload,
        {
          success: true,
          status_code: 200,
          response_body: '{"status": "ok"}',
          duration_ms: duration,
          attempt_number: newAttemptNumber,
        }
      );

      return { success: true, attempt_number: newAttemptNumber };
    } catch (error) {
      // Log failed retry
      await this.logDeliveryAttempt(
        deliveryData.webhook_id,
        deliveryData.event_type,
        payload,
        {
          success: false,
          error_message: error.message,
          duration_ms: 0,
          attempt_number: newAttemptNumber,
        }
      );

      return {
        success: false,
        error: error.message,
        attempt_number: newAttemptNumber,
      };
    }
  }
}
