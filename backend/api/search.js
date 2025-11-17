import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { DatabaseOperations } from "./_database.js";
import { SearchRepository } from "./repositories/search-repository.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Initialize database operations and repositories
  const db = new DatabaseOperations(env);
  const searchRepo = new SearchRepository(db);

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Handle search requests
    if (method === "GET") {
      const query = url.searchParams.get("q") || "";
      const type = url.searchParams.get("type") || "all";
      const farmId = url.searchParams.get("farm_id");

      if (!query.trim()) {
        return createErrorResponse("Search query is required", 400);
      }

      // Check farm access if specified
      if (farmId && !(await auth.hasFarmAccess(user.id, farmId))) {
        return createErrorResponse("Access denied to farm", 403);
      }

      const searchResults = await searchRepo.globalSearch(user.id, query, {
        type,
        farmId,
      });
      return createSuccessResponse(searchResults);
    } else if (method === "POST") {
      const body = await request.json();
      const { action, data } = body;

      if (action === "get_recent_searches") {
        const recentSearches = await searchRepo.getRecentSearches(user.id);
        return createSuccessResponse({ recent: recentSearches });
      }

      if (action === "save_search") {
        const { query, type } = data;
        await searchRepo.saveSearchHistory(user.id, query, type);
        return createSuccessResponse({ saved: true });
      }

      if (action === "get_suggestions") {
        const { query } = data;
        const suggestions = await searchRepo.getSuggestions(user.id, query);
        return createSuccessResponse({ suggestions });
      }
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Search error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
