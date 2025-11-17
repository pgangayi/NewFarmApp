import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { DatabaseOperations } from "./_database.js";
import { createAuditLogger, getClientIP, getUserAgent } from "./_logger.js";

// Admin audit logs endpoint
// GET /api/admin/audit-logs
// Query params: user_id, farm_id, event_type, date_from (ISO), date_to (ISO), limit, offset
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    const params = url.searchParams;
    const userIdFilter = params.get("user_id");
    const farmId = params.get("farm_id");
    const eventType = params.get("event_type");
    const dateFrom = params.get("date_from");
    const dateTo = params.get("date_to");

    let limit = parseInt(params.get("limit") || "50", 10);
    let offset = parseInt(params.get("offset") || "0", 10);

    if (Number.isNaN(limit) || limit <= 0) limit = 50;
    if (Number.isNaN(offset) || offset < 0) offset = 0;

    const MAX_LIMIT = 500;
    if (limit > MAX_LIMIT) {
      return createErrorResponse(`limit must be <= ${MAX_LIMIT}`, 400);
    }

    // Authorization: allow farm-scoped admin access or a global admin key
    const adminApiKey = env.ADMIN_API_KEY || null;
    let allowed = false;

    if (farmId) {
      // Check user has farm access (owner/manager/admin)
      const hasAccess = await auth.hasFarmAccess(user.id, farmId);
      if (!hasAccess) {
        return createErrorResponse("Insufficient farm permissions", 403);
      }
      allowed = true;
    } else {
      // For global queries, require ADMIN_API_KEY or SUPER_ADMIN_ID
      const providedKey = request.headers.get("X-Admin-API-Key");
      if (adminApiKey && providedKey && providedKey === adminApiKey) {
        allowed = true;
      }
      if (!allowed && env.SUPER_ADMIN_ID && user.id === env.SUPER_ADMIN_ID) {
        allowed = true;
      }
    }

    if (!allowed) {
      return createErrorResponse("Forbidden: admin access required", 403);
    }

    const dbOps = new DatabaseOperations(env);

    // Build WHERE clause securely using prepared params
    let where = "1=1";
    const values = [];

    if (userIdFilter) {
      where += " AND user_id = ?";
      values.push(userIdFilter);
    }

    if (farmId) {
      where += " AND farm_id = ?";
      values.push(farmId);
    }

    if (eventType) {
      where += " AND event_type = ?";
      values.push(eventType);
    }

    if (dateFrom) {
      where += " AND timestamp >= ?";
      values.push(dateFrom);
    }

    if (dateTo) {
      where += " AND timestamp <= ?";
      values.push(dateTo);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs WHERE ${where}`;
    const countResult = await dbOps.executeQuery(countQuery, values, {
      operation: "first",
      table: "audit_logs",
      userId: user.id,
      context: { adminAudit: true },
    });

    const total = countResult.data?.total || 0;

    // Fetch rows
    const dataQuery = `SELECT * FROM audit_logs WHERE ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    const dataValues = [...values, limit, offset];
    const dataResult = await dbOps.executeQuery(dataQuery, dataValues, {
      operation: "query",
      table: "audit_logs",
      userId: user.id,
      context: { adminAuditFetch: true, limit, offset },
    });

    const rows = dataResult.data || [];

    // Redact PII by default
    const redactIp = (ip) => {
      if (!ip || ip === "unknown") return null;
      // Mask last octet for IPv4, truncate for IPv6
      const parts = ip.split(",")[0].trim();
      if (parts.includes(".")) {
        const segs = parts.split(".");
        segs[segs.length - 1] = "0";
        return segs.join(".");
      }
      return parts.slice(0, 32) + "...";
    };

    const redacted = rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      event_type: r.event_type,
      user_id: r.user_id,
      email: r.email ? r.email.replace(/(.+)@(.+)/, "***@$2") : null,
      farm_id: r.farm_id || null,
      ip_address: redactIp(r.ip_address),
      user_agent: r.user_agent ? r.user_agent.substring(0, 120) : null,
      metadata: r.metadata ? r.metadata : null,
    }));

    // Self-audit: log that an admin queried the audit logs
    try {
      const auditLogger = createAuditLogger(env);
      await auditLogger.logSecurityEvent(
        "audit_query",
        {
          performed_by: user.id,
          filters: {
            user_id: userIdFilter,
            farm_id: farmId,
            event_type: eventType,
          },
          limit,
          offset,
          result_count: redacted.length,
        },
        getClientIP(request),
        getUserAgent(request)
      );
    } catch (err) {
      // don't fail if self-audit logging fails
      console.warn("Failed to log audit query self-audit", err);
    }

    // Provide simple cursor tokens for next/prev pages (base64 encoded offsets)
    const nextOffset = offset + limit;
    const prevOffset = Math.max(0, offset - limit);
    const next_cursor =
      nextOffset < total
        ? Buffer.from(String(nextOffset)).toString("base64")
        : null;
    const prev_cursor =
      offset > 0 ? Buffer.from(String(prevOffset)).toString("base64") : null;

    return createSuccessResponse({
      total,
      limit,
      offset,
      next_cursor,
      prev_cursor,
      data: redacted,
    });
  } catch (error) {
    console.error("admin_audit_logs error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
