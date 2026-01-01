import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { DatabaseOperations } from "./_database.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const idMatch = url.pathname.match(/\/api\/pest-disease\/(\d+)$/);
  const id = idMatch ? idMatch[1] : null;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();

    const db = new DatabaseOperations(env);

    if (id) {
      if (method === "DELETE") {
        const { results: existing } = await db.executeQuery(
          "SELECT farm_id FROM pest_disease_records WHERE id = ?",
          [id],
          { operation: "query", table: "pest_disease_records" }
        );

        if (existing.length === 0) return createErrorResponse("Not found", 404);

        const hasAccess = await db.checkFarmAccess(
          user.id,
          existing[0].farm_id
        );
        if (!hasAccess) return createUnauthorizedResponse();

        await db.executeQuery(
          "DELETE FROM pest_disease_records WHERE id = ?",
          [id],
          { operation: "run", table: "pest_disease_records" }
        );
        return createSuccessResponse({ success: true });
      }
      // Add PUT if needed
    } else {
      if (method === "GET") {
        const farmId = url.searchParams.get("farm_id");
        if (!farmId) return createErrorResponse("Farm ID required", 400);

        const hasAccess = await db.checkFarmAccess(user.id, farmId);
        if (!hasAccess) return createUnauthorizedResponse();

        const { results } = await db.executeQuery(
          "SELECT * FROM pest_disease_records WHERE farm_id = ? ORDER BY detection_date DESC",
          [farmId],
          { operation: "query", table: "pest_disease_records" }
        );
        return createSuccessResponse(results);
      }

      if (method === "POST") {
        const data = await request.json();
        if (!data.farm_id || !data.type || !data.name) {
          return createErrorResponse("Missing required fields", 400);
        }

        const hasAccess = await db.checkFarmAccess(user.id, data.farm_id);
        if (!hasAccess) return createUnauthorizedResponse();

        const { results } = await db.executeQuery(
          "INSERT INTO pest_disease_records (farm_id, field_id, crop_id, type, name, severity, status, detection_date, description, treatment_plan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
          [
            data.farm_id,
            data.field_id,
            data.crop_id,
            data.type,
            data.name,
            data.severity,
            data.status || "active",
            data.detection_date,
            data.description,
            data.treatment_plan,
          ],
          { operation: "run", table: "pest_disease_records" }
        );
        return createSuccessResponse(results[0]);
      }
    }

    return createErrorResponse("Not found", 404);
  } catch (error) {
    return createErrorResponse(error.message, 500);
  }
}
