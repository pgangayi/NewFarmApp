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

  // Simple routing
  const idMatch = url.pathname.match(/\/api\/rotations\/(\d+)$/);
  const id = idMatch ? idMatch[1] : null;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();

    const db = new DatabaseOperations(env);

    if (id) {
      // Single resource operations
      if (method === "DELETE") {
        // Verify ownership via farm_id (need to fetch first)
        const { results: existing } = await db.executeQuery(
          "SELECT farm_id FROM crop_rotations WHERE id = ?",
          [id],
          { operation: "query", table: "crop_rotations" }
        );

        if (existing.length === 0) return createErrorResponse("Not found", 404);

        const hasAccess = await db.checkFarmAccess(
          user.id,
          existing[0].farm_id
        );
        if (!hasAccess) return createUnauthorizedResponse();

        await db.executeQuery("DELETE FROM crop_rotations WHERE id = ?", [id], {
          operation: "run",
          table: "crop_rotations",
        });
        return createSuccessResponse({ success: true });
      }
      // Add PUT/GET single if needed
    } else {
      // Collection operations
      if (method === "GET") {
        const farmId = url.searchParams.get("farm_id");
        if (!farmId) return createErrorResponse("Farm ID required", 400);

        // Check access
        const hasAccess = await db.checkFarmAccess(user.id, farmId);
        if (!hasAccess) return createUnauthorizedResponse();

        const { results: rotations } = await db.executeQuery(
          "SELECT * FROM crop_rotations WHERE farm_id = ? ORDER BY created_at DESC",
          [farmId],
          { operation: "query", table: "crop_rotations" }
        );

        // Fetch steps for each rotation
        for (const rotation of rotations) {
          const { results: steps } = await db.executeQuery(
            "SELECT * FROM crop_rotation_steps WHERE rotation_id = ? ORDER BY step_order ASC",
            [rotation.id],
            { operation: "query", table: "crop_rotation_steps" }
          );
          rotation.steps = steps;
        }

        return createSuccessResponse(rotations);
      }

      if (method === "POST") {
        const data = await request.json();
        if (!data.farm_id || !data.name || !data.field_id) {
          return createErrorResponse("Missing required fields", 400);
        }

        const hasAccess = await db.checkFarmAccess(user.id, data.farm_id);
        if (!hasAccess) return createUnauthorizedResponse();

        const { results: rotation } = await db.executeQuery(
          "INSERT INTO crop_rotations (farm_id, field_id, name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
          [
            data.farm_id,
            data.field_id,
            data.name,
            data.description,
            data.start_date,
            data.end_date,
            data.status || "active",
          ],
          { operation: "run", table: "crop_rotations" }
        );

        if (data.steps && Array.isArray(data.steps)) {
          for (const step of data.steps) {
            await db.executeQuery(
              "INSERT INTO crop_rotation_steps (rotation_id, step_order, crop_type, variety, season, year_offset, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [
                rotation[0].id,
                step.step_order,
                step.crop_type,
                step.variety,
                step.season,
                step.year_offset,
                step.notes,
              ],
              { operation: "run", table: "crop_rotation_steps" }
            );
          }
        }

        // Return full object with steps
        rotation[0].steps = data.steps || [];
        return createSuccessResponse(rotation[0]);
      }
    }

    return createErrorResponse("Not found", 404);
  } catch (error) {
    return createErrorResponse(error.message, 500);
  }
}
