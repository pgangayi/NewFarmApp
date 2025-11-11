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

    // Handle search requests
    if (method === "GET") {
      const query = url.searchParams.get("q") || "";
      const type = url.searchParams.get("type") || "all";
      const farmId = url.searchParams.get("farm_id");

      if (!query.trim()) {
        return createErrorResponse("Search query is required", 400);
      }

      // Get user's accessible farms if no specific farm_id provided
      let accessibleFarms = [];
      if (!farmId) {
        accessibleFarms = await getAccessibleFarms(env, user.id);
      } else {
        // Check if user has access to the specified farm
        if (!(await auth.hasFarmAccess(user.id, farmId))) {
          return createErrorResponse("Access denied to farm", 403);
        }
        accessibleFarms = [{ id: parseInt(farmId) }];
      }

      const searchResults = await performGlobalSearch(
        env,
        query,
        type,
        accessibleFarms
      );
      return createSuccessResponse(searchResults);
    } else if (method === "POST") {
      const body = await request.json();
      const { action, data } = body;

      if (action === "get_recent_searches") {
        const recentSearches = await getRecentSearches(env, user.id);
        return createSuccessResponse({ recent: recentSearches });
      }

      if (action === "save_search") {
        const { query, type } = data;
        await saveSearch(env, user.id, query, type);
        return createSuccessResponse({ saved: true });
      }

      if (action === "get_suggestions") {
        const { query } = data;
        const suggestions = await getSearchSuggestions(env, user.id, query);
        return createSuccessResponse({ suggestions });
      }
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Search error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

async function getAccessibleFarms(env, userId) {
  const result = await env.DB.prepare(
    `
    SELECT DISTINCT f.id
    FROM farms f
    JOIN farm_members fm ON f.id = fm.farm_id
    WHERE fm.user_id = ?
    ORDER BY f.id
  `
  )
    .bind(userId)
    .all();

  return result.map((row) => ({ id: row.id }));
}

async function performGlobalSearch(env, query, type, farms) {
  const searchQuery = `%${query.toLowerCase()}%`;
  const results = {
    animals: [],
    crops: [],
    tasks: [],
    inventory: [],
    farms: [],
    finance: [],
    total_results: 0,
  };

  // Build farm ID filter
  const farmIds = farms.map((farm) => farm.id);
  const farmFilter =
    farmIds.length > 0
      ? `AND farm_id IN (${farmIds.map(() => "?").join(",")})`
      : "";

  try {
    // Search Animals
    if (type === "all" || type === "animals") {
      const animals = await env.DB.prepare(
        `
        SELECT 
          'animal' as type,
          id,
          name,
          species,
          breed,
          health_status,
          farm_id,
          created_at
        FROM animals
        WHERE (
          LOWER(name) LIKE ? OR 
          LOWER(species) LIKE ? OR 
          LOWER(breed) LIKE ? OR
          LOWER(health_status) LIKE ?
        )
        ${farmFilter.replace("farm_id", "farm_id")}
        ORDER BY created_at DESC
        LIMIT 20
      `
      )
        .bind(searchQuery, searchQuery, searchQuery, searchQuery, ...farmIds)
        .all();

      results.animals = animals;
    }

    // Search Crops
    if (type === "all" || type === "crops") {
      const crops = await env.DB.prepare(
        `
        SELECT 
          'crop' as type,
          id,
          name,
          crop_type,
          growth_stage,
          farm_id,
          created_at
        FROM crops
        WHERE (
          LOWER(name) LIKE ? OR 
          LOWER(crop_type) LIKE ? OR 
          LOWER(growth_stage) LIKE ?
        )
        ${farmFilter.replace("farm_id", "farm_id")}
        ORDER BY created_at DESC
        LIMIT 20
      `
      )
        .bind(searchQuery, searchQuery, searchQuery, ...farmIds)
        .all();

      results.crops = crops;
    }

    // Search Tasks
    if (type === "all" || type === "tasks") {
      const tasks = await env.DB.prepare(
        `
        SELECT 
          'task' as type,
          id,
          title,
          description,
          task_category,
          priority,
          status,
          farm_id,
          created_at
        FROM tasks
        WHERE (
          LOWER(title) LIKE ? OR 
          LOWER(description) LIKE ? OR 
          LOWER(task_category) LIKE ?
        )
        ${farmFilter.replace("farm_id", "farm_id")}
        ORDER BY created_at DESC
        LIMIT 20
      `
      )
        .bind(searchQuery, searchQuery, searchQuery, ...farmIds)
        .all();

      results.tasks = tasks;
    }

    // Search Inventory
    if (type === "all" || type === "inventory") {
      const inventory = await env.DB.prepare(
        `
        SELECT 
          'inventory' as type,
          id,
          name,
          category,
          supplier,
          farm_id,
          created_at
        FROM inventory_items
        WHERE (
          LOWER(name) LIKE ? OR 
          LOWER(category) LIKE ? OR 
          LOWER(supplier) LIKE ?
        )
        ${farmFilter.replace("farm_id", "farm_id")}
        ORDER BY created_at DESC
        LIMIT 20
      `
      )
        .bind(searchQuery, searchQuery, searchQuery, ...farmIds)
        .all();

      results.inventory = inventory;
    }

    // Search Farms
    if (type === "all" || type === "farms") {
      const farms_result = await env.DB.prepare(
        `
        SELECT 
          'farm' as type,
          id,
          name,
          location,
          description,
          created_at
        FROM farms
        WHERE (
          LOWER(name) LIKE ? OR 
          LOWER(location) LIKE ? OR 
          LOWER(description) LIKE ?
        )
        AND id IN (${farmIds.map(() => "?").join(",")})
        ORDER BY created_at DESC
        LIMIT 20
      `
      )
        .bind(searchQuery, searchQuery, searchQuery, ...farmIds)
        .all();

      results.farms = farms_result;
    }

    // Search Finance Entries
    if (type === "all" || type === "finance") {
      const finance = await env.DB.prepare(
        `
        SELECT 
          'finance' as type,
          id,
          description,
          category,
          type as entry_type,
          farm_id,
          created_at
        FROM finance_entries
        WHERE (
          LOWER(description) LIKE ? OR 
          LOWER(category) LIKE ?
        )
        ${farmFilter.replace("farm_id", "farm_id")}
        ORDER BY created_at DESC
        LIMIT 20
      `
      )
        .bind(searchQuery, searchQuery, ...farmIds)
        .all();

      results.finance = finance;
    }

    // Calculate total results
    results.total_results =
      results.animals.length +
      results.crops.length +
      results.tasks.length +
      results.inventory.length +
      results.farms.length +
      results.finance.length;

    return results;
  } catch (error) {
    console.error("Search query error:", error);
    throw error;
  }
}

async function getRecentSearches(env, userId) {
  try {
    const result = await env.DB.prepare(
      `
      SELECT 
        query,
        type,
        created_at
      FROM search_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `
    )
      .bind(userId)
      .all();

    return result;
  } catch (error) {
    console.error("Get recent searches error:", error);
    return [];
  }
}

async function saveSearch(env, userId, query, type) {
  try {
    await env.DB.prepare(
      `
      INSERT INTO search_history (user_id, query, type, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `
    )
      .bind(userId, query, type)
      .run();
  } catch (error) {
    console.error("Save search error:", error);
  }
}

async function getSearchSuggestions(env, userId, query) {
  if (!query || query.length < 2) {
    return [];
  }

  const searchQuery = `%${query.toLowerCase()}%`;
  const suggestions = [];

  try {
    // Get suggestions from recent searches
    const recentSearches = await env.DB.prepare(
      `
      SELECT DISTINCT query
      FROM search_history
      WHERE user_id = ? AND LOWER(query) LIKE ?
      ORDER BY created_at DESC
      LIMIT 5
    `
    )
      .bind(userId, searchQuery)
      .all();

    suggestions.push(
      ...recentSearches.map((row) => ({
        type: "recent_search",
        text: row.query,
        score: 0.8,
      }))
    );

    // Get suggestions from entity names
    const entitySuggestions = await env.DB.prepare(
      `
      SELECT name, 'entity' as type
      FROM animals
      WHERE LOWER(name) LIKE ?
      UNION
      SELECT name, 'entity' as type
      FROM crops
      WHERE LOWER(name) LIKE ?
      UNION
      SELECT name, 'entity' as type
      FROM inventory_items
      WHERE LOWER(name) LIKE ?
      LIMIT 5
    `
    )
      .bind(searchQuery, searchQuery, searchQuery)
      .all();

    suggestions.push(
      ...entitySuggestions.map((row) => ({
        type: row.type,
        text: row.name,
        score: 0.9,
      }))
    );

    // Sort by score and return top 10
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
  } catch (error) {
    console.error("Get search suggestions error:", error);
    return [];
  }
}
