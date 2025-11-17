/**
 * Animal Repository - Handles all animal-related database operations
 * Enhanced with pedigree tracking, intake management, and location tracking
 */

import { BaseRepository } from "../_database.js";

/**
 * Animal Repository - Handles all animal-related database operations
 */
export class AnimalRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "animals");
  }

  /**
   * Get animals for user's farms with enhanced filtering and data
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        a.*,
        f.name as farm_name,
        l.name as location_name,
        l.type as location_type,
        COALESCE((SELECT COUNT(*) FROM animal_health_records ahr WHERE ahr.animal_id = a.id), 0) as health_record_count,
        COALESCE((SELECT COUNT(*) FROM animal_production ap WHERE ap.animal_id = a.id), 0) as production_record_count,
        COALESCE((SELECT COUNT(*) FROM animal_movements am WHERE am.animal_id = a.id), 0) as movement_count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      JOIN farms f ON a.farm_id = f.id
      LEFT JOIN locations l ON a.current_location_id = l.id
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters with security validation
    if (filters.species) {
      query += " AND a.species = ?";
      params.push(filters.species);
    }
    if (filters.breed) {
      query += " AND a.breed = ?";
      params.push(filters.breed);
    }
    if (filters.health_status) {
      query += " AND a.health_status = ?";
      params.push(filters.health_status);
    }
    if (filters.sex) {
      query += " AND a.sex = ?";
      params.push(filters.sex);
    }
    if (filters.farm_id) {
      query += " AND a.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.current_location_id) {
      query += " AND a.current_location_id = ?";
      params.push(filters.current_location_id);
    }
    if (filters.intake_type) {
      query += " AND a.intake_type = ?";
      params.push(filters.intake_type);
    }
    if (filters.search) {
      query +=
        " AND (a.name LIKE ? OR a.identification_tag LIKE ? OR a.species LIKE ?)";
      params.push(
        `%${filters.search}%`,
        `%${filters.search}%`,
        `%${filters.search}%`
      );
    }

    // Group by to avoid duplicates
    query += " GROUP BY a.id";

    // Add sorting
    if (options.sortBy) {
      query += ` ORDER BY a.${options.sortBy} ${
        options.sortDirection?.toUpperCase() || "DESC"
      }`;
    } else {
      query += " ORDER BY a.created_at DESC";
    }

    // Add pagination
    if (options.limit) {
      const limit = Math.min(options.limit, 1000);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "animals",
      context: {
        findByUserAccess: true,
        userId,
        filters,
        options,
        security_level: "enhanced",
      },
    });

    if (error) {
      throw new Error(
        `Database error in AnimalRepository.findByUserAccess: ${error.message}`
      );
    }

    return results;
  }

  /**
   * Count animals for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];

    if (filters.species) {
      query += " AND a.species = ?";
      params.push(filters.species);
    }
    if (filters.breed) {
      query += " AND a.breed = ?";
      params.push(filters.breed);
    }
    if (filters.health_status) {
      query += " AND a.health_status = ?";
      params.push(filters.health_status);
    }
    if (filters.sex) {
      query += " AND a.sex = ?";
      params.push(filters.sex);
    }
    if (filters.farm_id) {
      query += " AND a.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.current_location_id) {
      query += " AND a.current_location_id = ?";
      params.push(filters.current_location_id);
    }
    if (filters.intake_type) {
      query += " AND a.intake_type = ?";
      params.push(filters.intake_type);
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "animals",
      context: { countByUserAccess: true, userId, filters },
    });

    if (error) {
      throw new Error(
        `Database error in AnimalRepository.countByUserAccess: ${error.message}`
      );
    }

    return results[0]?.total || 0;
  }

  /**
   * Create animal with comprehensive validation
   */
  async createWithValidation(animalData, userId) {
    // Validate required fields
    if (!animalData.farm_id || !animalData.name || !animalData.species) {
      throw new Error("Farm ID, name, and species are required");
    }

    // Check farm access
    const hasAccess = await this.hasUserAccessToFarm(
      animalData.farm_id,
      userId
    );
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }

    // Validate intake type
    if (
      animalData.intake_type &&
      !["Birth", "Purchase", "Transfer"].includes(animalData.intake_type)
    ) {
      throw new Error(
        "Invalid intake_type. Must be Birth, Purchase, or Transfer."
      );
    }

    // Validate location if provided
    if (animalData.current_location_id) {
      const locationValid = await this.validateLocation(
        animalData.current_location_id,
        animalData.farm_id
      );
      if (!locationValid) {
        throw new Error("Invalid or inaccessible location");
      }
    }

    // Validate pedigree
    if (animalData.father_id || animalData.mother_id) {
      await this.validatePedigree(
        animalData.father_id,
        animalData.mother_id,
        animalData.farm_id,
        animalData.species,
        userId
      );
    }

    // Prepare animal data with defaults
    const animalRecord = {
      farm_id: animalData.farm_id,
      name: animalData.name.trim(),
      species: animalData.species.trim(),
      breed: animalData.breed || null,
      sex: animalData.sex || null,
      identification_tag: animalData.identification_tag || null,
      birth_date: animalData.birth_date || null,
      health_status: animalData.health_status || "healthy",
      intake_type: animalData.intake_type || null,
      intake_date: animalData.intake_date || null,
      purchase_price: animalData.purchase_price || null,
      seller_details: animalData.seller_details || null,
      father_id: animalData.father_id || null,
      mother_id: animalData.mother_id || null,
      current_location_id: animalData.current_location_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await this.create(animalRecord, { userId });

    if (!result || !result.data) {
      throw new Error("Failed to create animal");
    }

    return result.data[0];
  }

  /**
   * Get animal with comprehensive details
   */
  async findWithDetails(animalId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT DISTINCT
        a.*,
        f.name as farm_name,
        l.name as location_name,
        l.type as location_type,
        af.name as father_name,
        am.name as mother_name,
        COALESCE((SELECT COUNT(*) FROM animal_health_records ahr WHERE ahr.animal_id = a.id), 0) as health_record_count,
        COALESCE((SELECT COUNT(*) FROM animal_production ap WHERE ap.animal_id = a.id), 0) as production_record_count,
        COALESCE((SELECT COUNT(*) FROM animal_movements am WHERE am.animal_id = a.id), 0) as movement_count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      JOIN farms f ON a.farm_id = f.id
      LEFT JOIN locations l ON a.current_location_id = l.id
      LEFT JOIN animals af ON a.father_id = af.id
      LEFT JOIN animals am ON a.mother_id = am.id
      WHERE a.id = ? AND fm.user_id = ?
      GROUP BY a.id
    `,
      [animalId, userId],
      {
        operation: "query",
        table: "animals",
        context: { findWithDetails: true, animalId, userId },
      }
    );

    if (results.length === 0) {
      return null;
    }

    return results[0];
  }

  /**
   * Get animal pedigree tree
   */
  async getPedigree(animalId, userId, maxDepth = 3) {
    // Verify access
    const hasAccess = await this.hasUserAccessToAnimal(animalId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to animal pedigree");
    }

    const buildTree = async (id, depth = 0) => {
      if (!id || depth >= maxDepth) return null;

      const animal = await this.db.findById(
        "animals",
        id,
        "id, name, sex, species, father_id, mother_id",
        { userId }
      );
      if (!animal) return null;

      const father = await buildTree(animal.father_id, depth + 1);
      const mother = await buildTree(animal.mother_id, depth + 1);

      return {
        id: animal.id,
        name: animal.name,
        sex: animal.sex,
        generation: depth,
        parents: father || mother ? { father, mother } : null,
      };
    };

    return await buildTree(animalId, 0);
  }

  /**
   * Get livestock statistics
   */
  async getLivestockStats(userId) {
    // Species stats
    const speciesQuery = `
      SELECT a.species, COUNT(a.id) as count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
      GROUP BY a.species
    `;

    // Health status stats
    const healthQuery = `
      SELECT a.health_status, COUNT(a.id) as count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
      GROUP BY a.health_status
    `;

    // Location stats
    const locationQuery = `
      SELECT l.name as location_name, COUNT(a.id) as count
      FROM animals a
      JOIN locations l ON a.current_location_id = l.id
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE fm.user_id = ?
      GROUP BY l.name
    `;

    const [speciesStats, healthStats, locationStats] = await Promise.all([
      this.db.executeQuery(speciesQuery, [userId], { operation: "all" }),
      this.db.executeQuery(healthQuery, [userId], { operation: "all" }),
      this.db.executeQuery(locationQuery, [userId], { operation: "all" }),
    ]);

    const total = speciesStats.data.reduce((acc, cur) => acc + cur.count, 0);

    return {
      total_animals: total,
      by_species: speciesStats.data,
      by_health_status: healthStats.data,
      by_location: locationStats.data,
    };
  }

  // === PRIVATE HELPER METHODS ===

  async hasUserAccessToFarm(farmId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM farm_members
      WHERE farm_id = ? AND user_id = ?
      LIMIT 1
    `,
      [farmId, userId],
      {
        operation: "query",
        table: "farm_members",
        context: { hasUserAccessToFarm: true },
      }
    );

    return results.length > 0;
  }

  async hasUserAccessToAnimal(animalId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      WHERE a.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [animalId, userId],
      {
        operation: "query",
        table: "animals",
        context: { hasUserAccessToAnimal: true },
      }
    );

    return results.length > 0;
  }

  async validateLocation(locationId, farmId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM locations
      WHERE id = ? AND farm_id = ?
      LIMIT 1
    `,
      [locationId, farmId],
      {
        operation: "query",
        table: "locations",
        context: { validateLocation: true },
      }
    );

    return results.length > 0;
  }

  async validatePedigree(fatherId, motherId, farmId, species, userId) {
    const parentIds = [fatherId, motherId].filter((id) => id);
    if (parentIds.length === 0) return;

    const { results } = await this.db.executeQuery(
      `
      SELECT id, farm_id, species, sex, name
      FROM animals
      WHERE id IN (${parentIds.map(() => "?").join(",")})
    `,
      parentIds,
      {
        operation: "query",
        table: "animals",
        context: { validatePedigree: true },
      }
    );

    if (results.length !== parentIds.length) {
      throw new Error("One or more parent animals not found");
    }

    for (const parent of results) {
      if (parent.farm_id !== farmId) {
        throw new Error(
          `Parent animal ${parent.name} belongs to a different farm`
        );
      }
      if (parent.species !== species) {
        throw new Error(`Parent animal ${parent.name} has different species`);
      }
      if (fatherId && parent.id === fatherId && parent.sex !== "male") {
        throw new Error(`Father ${parent.name} must be male`);
      }
      if (motherId && parent.id === motherId && parent.sex !== "female") {
        throw new Error(`Mother ${parent.name} must be female`);
      }
    }
  }
}
