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
  const path = url.pathname.split("/").pop(); // 'breeds' or 'varieties'

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();

    const db = new DatabaseOperations(env);

    if (path === "breeds") {
      if (method === "GET") {
        const species = url.searchParams.get("species");
        let query = "SELECT * FROM breeds";
        const params = [];
        if (species) {
          query += " WHERE species = ?";
          params.push(species);
        }
        query += " ORDER BY name ASC";

        const { results } = await db.executeQuery(query, params, {
          operation: "query",
          table: "breeds",
        });
        return createSuccessResponse(results);
      } else if (method === "POST") {
        const data = await request.json();
        if (!data.species || !data.name) {
          return createErrorResponse("Species and name are required", 400);
        }

        const { results } = await db.executeQuery(
          "INSERT INTO breeds (species, name, description) VALUES (?, ?, ?) RETURNING *",
          [data.species, data.name, data.description || null],
          { operation: "run", table: "breeds" }
        );
        return createSuccessResponse(results[0]);
      }
    } else if (path === "varieties") {
      if (method === "GET") {
        const cropType = url.searchParams.get("crop_type");
        let query = "SELECT * FROM crop_varieties";
        const params = [];
        if (cropType) {
          query += " WHERE crop_type = ?";
          params.push(cropType);
        }
        query += " ORDER BY name ASC";

        const { results } = await db.executeQuery(query, params, {
          operation: "query",
          table: "crop_varieties",
        });
        return createSuccessResponse(results);
      } else if (method === "POST") {
        const data = await request.json();
        if (!data.crop_type || !data.name) {
          return createErrorResponse("Crop type and name are required", 400);
        }

        const { results } = await db.executeQuery(
          "INSERT INTO crop_varieties (crop_type, name, description, days_to_maturity) VALUES (?, ?, ?, ?) RETURNING *",
          [
            data.crop_type,
            data.name,
            data.description || null,
            data.days_to_maturity || null,
          ],
          { operation: "run", table: "crop_varieties" }
        );
        return createSuccessResponse(results[0]);
      }
    }

    return createErrorResponse("Not found", 404);
  } catch (error) {
    return createErrorResponse(error.message, 500);
  }
}
