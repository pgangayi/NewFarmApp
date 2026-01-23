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

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) return createUnauthorizedResponse();

    const db = new DatabaseOperations(env);

    if (method === "GET") {
      const locationId = url.searchParams.get("id");
      if (locationId) {
        const location = await db.findById("locations", locationId);
        if (!location) {
          return createErrorResponse("Location not found", 404);
        }
        return createSuccessResponse(location);
      } else {
        const locations = await db.findMany("locations", {}, {
          orderBy: "name",
          orderDirection: "ASC",
        });
        return createSuccessResponse(locations || []);
      }
    } else if (method === "POST") {
      const data = await request.json();
      if (!data.name) {
        return createErrorResponse("Name is required", 400);
      }

      const newLocation = await db.create("locations", data);
      return createSuccessResponse(newLocation);
    } else if (method === "PUT") {
      const data = await request.json();
      const { id, ...updateData } = data;
      if (!id) {
        return createErrorResponse("ID is required", 400);
      }

      const updatedLocation = await db.updateById("locations", id, updateData);
      return createSuccessResponse(updatedLocation);
    } else if (method === "DELETE") {
      const locationId = url.searchParams.get("id");
      if (!locationId) {
        return createErrorResponse("ID is required", 400);
      }

      const result = await db.deleteById("locations", locationId);
      return createSuccessResponse(result);
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    return createErrorResponse(error.message, 500);
  }
}