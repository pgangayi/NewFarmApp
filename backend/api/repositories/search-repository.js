/**
 * Search Repository - Handles all search-related database operations
 * Phase 7 Migration: Supporting Systems - Advanced search functionality with caching
 * Provides comprehensive search across all farm entities with user access control
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "../_repositories.js";

/**
 * Search Repository - Handles all search-related database operations
 * Phase 7 Migration: Supporting Systems Enhancement
 */
export class SearchRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "search_history");
    this.farmRepo = new FarmRepository(dbOperations);
  }

  /**
   * Perform global search across all accessible entities
   */
  async globalSearch(userId, query, options = {}) {
    const {
      type = "all", // all, animals, crops, tasks, inventory, farms, finance
      farmId = null,
      limit = 20,
      offset = 0,
    } = options;

    if (!query || query.trim().length === 0) {
      throw new Error("Search query is required");
    }

    // Get user's accessible farms
    const accessibleFarms = await this.getAccessibleFarms(userId, farmId);
    if (accessibleFarms.length === 0) {
      return { total_results: 0, results: {} };
    }

    const searchQuery = `%${query.toLowerCase()}%`;
    const farmIds = accessibleFarms.map((farm) => farm.id);
    const farmFilter =
      farmIds.length > 0
        ? `AND farm_id IN (${farmIds.map(() => "?").join(",")})`
        : "";

    const results = {
      animals: [],
      crops: [],
      tasks: [],
      inventory: [],
      farms: [],
      finance: [],
      total_results: 0,
    };

    try {
      // Search Animals
      if (type === "all" || type === "animals") {
        const animals = await this.db.executeQuery(
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
          ${farmFilter.replace(/farm_id/g, "farm_id")}
          ORDER BY created_at DESC
          LIMIT ?
        `,
          [
            searchQuery,
            searchQuery,
            searchQuery,
            searchQuery,
            ...farmIds,
            limit,
          ],
          {
            operation: "query",
            table: "animals",
            context: { globalSearch: true, query, type: "animals", userId },
          }
        );
        results.animals = animals;
      }

      // Search Crops
      if (type === "all" || type === "crops") {
        const crops = await this.db.executeQuery(
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
          ${farmFilter.replace(/farm_id/g, "farm_id")}
          ORDER BY created_at DESC
          LIMIT ?
        `,
          [searchQuery, searchQuery, searchQuery, ...farmIds, limit],
          {
            operation: "query",
            table: "crops",
            context: { globalSearch: true, query, type: "crops", userId },
          }
        );
        results.crops = crops;
      }

      // Search Tasks
      if (type === "all" || type === "tasks") {
        const tasks = await this.db.executeQuery(
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
          ${farmFilter.replace(/farm_id/g, "farm_id")}
          ORDER BY created_at DESC
          LIMIT ?
        `,
          [searchQuery, searchQuery, searchQuery, ...farmIds, limit],
          {
            operation: "query",
            table: "tasks",
            context: { globalSearch: true, query, type: "tasks", userId },
          }
        );
        results.tasks = tasks;
      }

      // Search Inventory
      if (type === "all" || type === "inventory") {
        const inventory = await this.db.executeQuery(
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
          ${farmFilter.replace(/farm_id/g, "farm_id")}
          ORDER BY created_at DESC
          LIMIT ?
        `,
          [searchQuery, searchQuery, searchQuery, ...farmIds, limit],
          {
            operation: "query",
            table: "inventory_items",
            context: { globalSearch: true, query, type: "inventory", userId },
          }
        );
        results.inventory = inventory;
      }

      // Search Farms
      if (type === "all" || type === "farms") {
        const farms_result = await this.db.executeQuery(
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
          LIMIT ?
        `,
          [searchQuery, searchQuery, searchQuery, ...farmIds, limit],
          {
            operation: "query",
            table: "farms",
            context: { globalSearch: true, query, type: "farms", userId },
          }
        );
        results.farms = farms_result;
      }

      // Search Finance Entries
      if (type === "all" || type === "finance") {
        const finance = await this.db.executeQuery(
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
          ${farmFilter.replace(/farm_id/g, "farm_id")}
          ORDER BY created_at DESC
          LIMIT ?
        `,
          [searchQuery, searchQuery, ...farmIds, limit],
          {
            operation: "query",
            table: "finance_entries",
            context: { globalSearch: true, query, type: "finance", userId },
          }
        );
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

      // Save search history
      await this.saveSearchHistory(userId, query, type);

      return results;
    } catch (error) {
      console.error("Global search error:", error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on user history and entity names
   */
  async getSuggestions(userId, query, options = {}) {
    const { limit = 10, farmId = null } = options;

    if (!query || query.length < 2) {
      return [];
    }

    const searchQuery = `%${query.toLowerCase()}%`;
    const suggestions = [];

    try {
      // Get suggestions from recent searches
      const recentSearches = await this.db.executeQuery(
        `
        SELECT DISTINCT query
        FROM search_history
        WHERE user_id = ? AND LOWER(query) LIKE ?
        ORDER BY created_at DESC
        LIMIT 5
      `,
        [userId, searchQuery],
        {
          operation: "query",
          table: "search_history",
          context: { getSuggestions: true, query, type: "recent", userId },
        }
      );

      suggestions.push(
        ...recentSearches.map((row) => ({
          type: "recent_search",
          text: row.query,
          score: 0.8,
        }))
      );

      // Get accessible farms for entity suggestions
      const accessibleFarms = await this.getAccessibleFarms(userId, farmId);
      const farmIds = accessibleFarms.map((farm) => farm.id);
      const farmFilter =
        farmIds.length > 0
          ? `AND farm_id IN (${farmIds.map(() => "?").join(",")})`
          : "";

      // Get suggestions from entity names
      const entitySuggestions = await this.db.executeQuery(
        `
        SELECT name, 'entity' as type, 'animals' as entity_type
        FROM animals
        WHERE LOWER(name) LIKE ? ${farmFilter.replace(/farm_id/g, "farm_id")}
        UNION
        SELECT name, 'entity' as type, 'crops' as entity_type
        FROM crops
        WHERE LOWER(name) LIKE ? ${farmFilter.replace(/farm_id/g, "farm_id")}
        UNION
        SELECT name, 'entity' as type, 'inventory' as entity_type
        FROM inventory_items
        WHERE LOWER(name) LIKE ? ${farmFilter.replace(/farm_id/g, "farm_id")}
        UNION
        SELECT title as name, 'entity' as type, 'tasks' as entity_type
        FROM tasks
        WHERE LOWER(title) LIKE ? ${farmFilter.replace(/farm_id/g, "farm_id")}
        LIMIT 5
      `,
        [
          searchQuery,
          ...farmIds,
          searchQuery,
          ...farmIds,
          searchQuery,
          ...farmIds,
          searchQuery,
          ...farmIds,
        ],
        {
          operation: "query",
          table: "multiple_tables",
          context: { getSuggestions: true, query, type: "entities", userId },
        }
      );

      suggestions.push(
        ...entitySuggestions.map((row) => ({
          type: row.type,
          text: row.name,
          entity_type: row.entity_type,
          score: 0.9,
        }))
      );

      // Sort by score and return top results
      return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      console.error("Get search suggestions error:", error);
      return [];
    }
  }

  /**
   * Get recent searches for a user
   */
  async getRecentSearches(userId, limit = 10) {
    try {
      const result = await this.db.executeQuery(
        `
        SELECT
          query,
          type,
          created_at
        FROM search_history
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `,
        [userId, limit],
        {
          operation: "query",
          table: "search_history",
          context: { getRecentSearches: true, userId, limit },
        }
      );

      return result;
    } catch (error) {
      console.error("Get recent searches error:", error);
      return [];
    }
  }

  /**
   * Save search to history
   */
  async saveSearchHistory(userId, query, type) {
    try {
      await this.db.executeQuery(
        `
        INSERT INTO search_history (user_id, query, type, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `,
        [userId, query, type],
        {
          operation: "run",
          table: "search_history",
          context: { saveSearchHistory: true, userId, query, type },
        }
      );
    } catch (error) {
      // Don't throw error for search history failures
      console.log(`Failed to save search history: ${error.message}`);
    }
  }

  /**
   * Get accessible farms for a user
   */
  async getAccessibleFarms(userId, specificFarmId = null) {
    try {
      let query = `
        SELECT DISTINCT f.id
        FROM farms f
        JOIN farm_members fm ON f.id = fm.farm_id
        WHERE fm.user_id = ?
        ORDER BY f.id
      `;

      const params = [userId];

      if (specificFarmId) {
        query += ` AND f.id = ?`;
        params.push(specificFarmId);

        // Verify access to specific farm
        const hasAccess = await this.farmRepo.hasUserAccess(
          specificFarmId,
          userId
        );
        if (!hasAccess) {
          return [];
        }
      }

      const result = await this.db.executeQuery(query, params, {
        operation: "query",
        table: "farms",
        context: { getAccessibleFarms: true, userId, specificFarmId },
      });

      return result.map((row) => ({ id: row.id }));
    } catch (error) {
      console.error("Get accessible farms error:", error);
      return [];
    }
  }

  /**
   * Advanced search with filters and sorting
   */
  async advancedSearch(userId, searchParams) {
    const {
      query,
      entity_type,
      filters = {},
      sort_by = "relevance",
      sort_order = "desc",
      limit = 50,
      offset = 0,
      farmId = null,
    } = searchParams;

    if (!query || !entity_type) {
      throw new Error("Query and entity_type are required");
    }

    // Get accessible farms
    const accessibleFarms = await this.getAccessibleFarms(userId, farmId);
    if (accessibleFarms.length === 0) {
      return { results: [], total: 0 };
    }

    const farmIds = accessibleFarms.map((farm) => farm.id);
    const searchQuery = `%${query.toLowerCase()}%`;

    let sqlQuery = "";
    let params = [searchQuery];
    let countQuery = "";

    // Build query based on entity type
    const count = farmIds.length;
    switch (entity_type) {
      case "animals":
        sqlQuery = this.buildAnimalSearchQuery(
          filters,
          sort_by,
          sort_order,
          count
        );
        countQuery = this.buildAnimalCountQuery(filters, count);
        params = params.concat(farmIds);
        break;
      case "crops":
        sqlQuery = this.buildCropSearchQuery(
          filters,
          sort_by,
          sort_order,
          count
        );
        countQuery = this.buildCropCountQuery(filters, count);
        params = params.concat(farmIds);
        break;
      case "tasks":
        sqlQuery = this.buildTaskSearchQuery(
          filters,
          sort_by,
          sort_order,
          count
        );
        countQuery = this.buildTaskCountQuery(filters, count);
        params = params.concat(farmIds);
        break;
      case "inventory":
        sqlQuery = this.buildInventorySearchQuery(
          filters,
          sort_by,
          sort_order,
          count
        );
        countQuery = this.buildInventoryCountQuery(filters, count);
        params = params.concat(farmIds);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entity_type}`);
    }

    // Add pagination
    sqlQuery += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    try {
      const results = await this.db.executeQuery(sqlQuery, params, {
        operation: "query",
        table: `${entity_type}`,
        context: { advancedSearch: true, searchParams, userId },
      });

      const totalResult = await this.db.executeQuery(
        countQuery,
        [searchQuery, ...farmIds],
        {
          operation: "query",
          table: `${entity_type}`,
          context: { advancedSearchCount: true, searchParams, userId },
        }
      );

      const total = totalResult[0]?.count || 0;

      // Save search history
      await this.saveSearchHistory(userId, query, entity_type);

      return {
        results,
        total,
        entity_type,
        pagination: {
          limit,
          offset,
          has_more: offset + limit < total,
        },
      };
    } catch (error) {
      console.error("Advanced search error:", error);
      throw error;
    }
  }

  /**
   * Validate sort parameters to prevent SQL injection
   */
  validateSortParams(sortBy, sortOrder, allowedColumns) {
    const validOrder = ["ASC", "DESC"];
    const direction =
      sortOrder && validOrder.includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

    const column = allowedColumns.includes(sortBy) ? sortBy : "created_at";

    return { column, direction };
  }

  /**
   * Build animal search query
   */
  buildAnimalSearchQuery(filters, sort_by, sort_order, farmIdsCount) {
    const searchFields = ["name", "species", "breed", "health_status"];
    const whereConditions = this.buildWhereConditions(filters, searchFields);

    // Whitelist allowed sort columns
    const allowedSorts = [
      "name",
      "species",
      "breed",
      "health_status",
      "created_at",
    ];
    const { column, direction } = this.validateSortParams(
      sort_by,
      sort_order,
      allowedSorts
    );

    const farmPlaceholders = Array(farmIdsCount).fill("?").join(",");

    return `
      SELECT *,
             'animal' as entity_type
      FROM animals
      WHERE (${searchFields.map(() => "LOWER(?) LIKE ?").join(" OR ")})
      AND farm_id IN (${farmPlaceholders})
      ${whereConditions}
      ORDER BY ${column} ${direction}
    `;
  }

  /**
   * Build crop search query
   */
  buildCropSearchQuery(filters, sort_by, sort_order, farmIdsCount) {
    const searchFields = ["name", "crop_type", "growth_stage"];
    const whereConditions = this.buildWhereConditions(filters, searchFields);

    // Whitelist allowed sort columns
    const allowedSorts = ["name", "crop_type", "growth_stage", "created_at"];
    const { column, direction } = this.validateSortParams(
      sort_by,
      sort_order,
      allowedSorts
    );

    const farmPlaceholders = Array(farmIdsCount).fill("?").join(",");

    return `
      SELECT *,
             'crop' as entity_type
      FROM crops
      WHERE (${searchFields.map(() => "LOWER(?) LIKE ?").join(" OR ")})
      AND farm_id IN (${farmPlaceholders})
      ${whereConditions}
      ORDER BY ${column} ${direction}
    `;
  }

  /**
   * Build task search query
   */
  buildTaskSearchQuery(filters, sort_by, sort_order, farmIdsCount) {
    const searchFields = ["title", "description", "task_category"];
    const whereConditions = this.buildWhereConditions(filters, searchFields);

    // Whitelist allowed sort columns
    const allowedSorts = [
      "title",
      "priority",
      "due_date",
      "created_at",
      "status",
    ];
    const { column, direction } = this.validateSortParams(
      sort_by,
      sort_order,
      allowedSorts
    );

    const farmPlaceholders = Array(farmIdsCount).fill("?").join(",");

    return `
      SELECT *,
             'task' as entity_type
      FROM tasks
      WHERE (${searchFields.map(() => "LOWER(?) LIKE ?").join(" OR ")})
      AND farm_id IN (${farmPlaceholders})
      ${whereConditions}
      ORDER BY ${column} ${direction}
    `;
  }

  /**
   * Build inventory search query
   */
  buildInventorySearchQuery(filters, sort_by, sort_order, farmIdsCount) {
    const searchFields = ["name", "category", "supplier"];
    const whereConditions = this.buildWhereConditions(filters, searchFields);

    // Whitelist allowed sort columns
    const allowedSorts = ["name", "category", "quantity", "created_at"];
    const { column, direction } = this.validateSortParams(
      sort_by,
      sort_order,
      allowedSorts
    );

    const farmPlaceholders = Array(farmIdsCount).fill("?").join(",");

    return `
      SELECT *,
             'inventory' as entity_type
      FROM inventory_items
      WHERE (${searchFields.map(() => "LOWER(?) LIKE ?").join(" OR ")})
      AND farm_id IN (${farmPlaceholders})
      ${whereConditions}
      ORDER BY ${column} ${direction}
    `;
  }

  /**
   * Build count queries for pagination
   */
  buildAnimalCountQuery(filters, farmIdsCount) {
    const searchFields = ["name", "species", "breed", "health_status"];
    const whereConditions = this.buildWhereConditions(filters, searchFields);
    const farmPlaceholders = Array(farmIdsCount).fill("?").join(",");

    return `
      SELECT COUNT(*) as count
      FROM animals
      WHERE (${searchFields.map(() => "LOWER(?) LIKE ?").join(" OR ")})
      AND farm_id IN (${farmPlaceholders})
      ${whereConditions}
    `;
  }

  buildCropCountQuery(filters, farmIdsCount) {
    const searchFields = ["name", "crop_type", "growth_stage"];
    const whereConditions = this.buildWhereConditions(filters, searchFields);
    const farmPlaceholders = Array(farmIdsCount).fill("?").join(",");

    return `
      SELECT COUNT(*) as count
      FROM crops
      WHERE (${searchFields.map(() => "LOWER(?) LIKE ?").join(" OR ")})
      AND farm_id IN (${farmPlaceholders})
      ${whereConditions}
    `;
  }

  buildTaskCountQuery(filters, farmIdsCount) {
    const searchFields = ["title", "description", "task_category"];
    const whereConditions = this.buildWhereConditions(filters, searchFields);
    const farmPlaceholders = Array(farmIdsCount).fill("?").join(",");

    return `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE (${searchFields.map(() => "LOWER(?) LIKE ?").join(" OR ")})
      AND farm_id IN (${farmPlaceholders})
      ${whereConditions}
    `;
  }

  buildInventoryCountQuery(filters, farmIdsCount) {
    const searchFields = ["name", "category", "supplier"];
    const whereConditions = this.buildWhereConditions(filters, searchFields);
    const farmPlaceholders = Array(farmIdsCount).fill("?").join(",");

    return `
      SELECT COUNT(*) as count
      FROM inventory_items
      WHERE (${searchFields.map(() => "LOWER(?) LIKE ?").join(" OR ")})
      AND farm_id IN (${farmPlaceholders})
      ${whereConditions}
    `;
  }

  /**
   * Build WHERE conditions from filters
   */
  buildWhereConditions(filters, searchFields) {
    const conditions = [];

    if (filters.status) {
      conditions.push(`status = '${filters.status}'`);
    }
    if (filters.priority) {
      conditions.push(`priority = '${filters.priority}'`);
    }
    if (filters.category) {
      conditions.push(`category = '${filters.category}'`);
    }
    if (filters.health_status) {
      conditions.push(`health_status = '${filters.health_status}'`);
    }
    if (filters.growth_stage) {
      conditions.push(`growth_stage = '${filters.growth_stage}'`);
    }

    return conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";
  }

  /**
   * Get search analytics for a user
   */
  async getSearchAnalytics(userId, timeframe = "30days") {
    try {
      const result = await this.db.executeQuery(
        `
        SELECT
          COUNT(*) as total_searches,
          COUNT(DISTINCT query) as unique_queries,
          type,
          COUNT(*) as searches_by_type
        FROM search_history
        WHERE user_id = ?
          AND created_at >= datetime('now', '-${timeframe}')
        GROUP BY type
        ORDER BY searches_by_type DESC
      `,
        [userId],
        {
          operation: "query",
          table: "search_history",
          context: { getSearchAnalytics: true, userId, timeframe },
        }
      );

      const totalResult = await this.db.executeQuery(
        `
        SELECT COUNT(*) as total_searches
        FROM search_history
        WHERE user_id = ?
          AND created_at >= datetime('now', '-${timeframe}')
      `,
        [userId],
        {
          operation: "query",
          table: "search_history",
          context: { getSearchAnalyticsTotal: true, userId, timeframe },
        }
      );

      return {
        total_searches: totalResult[0]?.total_searches || 0,
        searches_by_type: result,
        timeframe,
      };
    } catch (error) {
      console.error("Get search analytics error:", error);
      return { total_searches: 0, searches_by_type: [], timeframe };
    }
  }

  /**
   * Clear search history for a user
   */
  async clearSearchHistory(userId) {
    try {
      const result = await this.db.executeQuery(
        "DELETE FROM search_history WHERE user_id = ?",
        [userId],
        {
          operation: "run",
          table: "search_history",
          context: { clearSearchHistory: true, userId },
        }
      );

      return { deleted_count: result.changes };
    } catch (error) {
      console.error("Clear search history error:", error);
      throw error;
    }
  }
}
