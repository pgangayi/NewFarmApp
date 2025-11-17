/**
 * Webhooks API - Phase 7 Migration: Supporting Systems
 * Webhook management for integrations with secure database operations
 */

import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { DatabaseOperations } from "./_database.js";
import { WebhookRepository } from "./repositories/webhook-repository.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Initialize database operations and repositories
  const db = new DatabaseOperations(env);
  const webhookRepo = new WebhookRepository(db);

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Handle different webhook endpoints
    if (method === "GET") {
      const action = url.searchParams.get("action") || "list";
      const webhookId = url.searchParams.get("webhook_id");
      const farmId = url.searchParams.get("farm_id");

      if (action === "list") {
        const webhooks = await webhookRepo.getWebhooks(user.id, {
          farmId,
          activeOnly: url.searchParams.get("active_only") === "true",
        });
        return createSuccessResponse({ webhooks });
      } else if (action === "get" && webhookId) {
        const webhook = await webhookRepo.getWebhookById(webhookId, user.id);
        if (!webhook) {
          return createErrorResponse("Webhook not found", 404);
        }
        return createSuccessResponse({ webhook });
      } else if (action === "delivery_history" && webhookId) {
        const history = await webhookRepo.getDeliveryHistory(
          webhookId,
          user.id,
          {
            limit: parseInt(url.searchParams.get("limit") || "50"),
            offset: parseInt(url.searchParams.get("offset") || "0"),
            eventType: url.searchParams.get("event_type"),
          }
        );
        return createSuccessResponse({ history });
      } else if (action === "stats" && webhookId) {
        const stats = await webhookRepo.getWebhookStats(webhookId, user.id);
        return createSuccessResponse({ stats });
      }
    } else if (method === "POST") {
      const body = await request.json();
      const { action } = body;

      if (action === "create") {
        const result = await webhookRepo.createWebhook(body.webhook, user.id);
        return createSuccessResponse(result);
      } else if (action === "update" && body.webhook_id) {
        const result = await webhookRepo.updateWebhook(
          body.webhook_id,
          body.updates,
          user.id
        );
        return createSuccessResponse(result);
      } else if (action === "delete" && body.webhook_id) {
        const result = await webhookRepo.deleteWebhook(
          body.webhook_id,
          user.id
        );
        return createSuccessResponse(result);
      } else if (action === "test" && body.webhook_id) {
        const result = await webhookRepo.testWebhook(body.webhook_id, user.id);
        return createSuccessResponse(result);
      }
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Webhooks error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
