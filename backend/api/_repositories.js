// Specific Repository Classes for Farm Management Entities
// Provides entity-specific operations with centralized database access
// Date: November 13, 2025 (Revised and Optimized)

// ----------------------------------------------------------------------------
// BASE AND DEPENDENT REPOSITORIES (Added for completeness)
// ----------------------------------------------------------------------------

/**
 * Base Repository - Provides common CRUD operations
 * (This class was missing from the original file)
 */
export class BaseRepository {
  constructor(dbOperations, table) {
    if (!dbOperations || !table) {
      throw new Error(
        "DatabaseOperations instance and table name are required."
      );
    }
    this.db = dbOperations;
    this.table = table;
  }

  /**
   * Find a record by its ID.
   */
  async findById(id, options = {}) {
    return await this.db.findById(this.table, id, "*", options);
  }

  /**
   * Create a new record.
   */
  async create(data, options = {}) {
    return await this.db.create(this.table, data, options);
  }

  /**
   * Update a record by its ID.
   */
  async updateById(id, data, options = {}) {
    return await this.db.updateById(this.table, id, data, options);
  }

  /**
   * Delete a record by its ID.
   */
  async deleteById(id, options = {}) {
    return await this.db.deleteById(this.table, id, options);
  }
}

/**
 * Farm Repository - Handles farm-specific checks
 * (This class was used but not defined in the original file)
 */
export class FarmRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "farms");
  }

  /**
   * Check if a user has access to a specific farm.
   */
  async hasUserAccess(farmId, userId) {
    const count = await this.db.count("farm_members", {
      farm_id: farmId,
      user_id: userId,
    });
    return count > 0;
  }
}

// ----------------------------------------------------------------------------
// ENTITY-SPECIFIC REPOSITORIES
// ----------------------------------------------------------------------------

/**
 * Animal Repository - Handles all animal-related database operations
 */
export class AnimalRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "animals");
    this.validSortFields = new Set([
      "id",
      "name",
      "species",
      "breed",
      "birth_date",
      "health_status",
      "current_weight",
      "acquisition_date",
      "created_at",
      "updated_at",
    ]);
  }

  /**
   * Validates and gets a safe sort field.
   * @private
   */
  validateSortField(field) {
    if (this.validSortFields.has(field)) {
      return `a.${field}`;
    }
    // Default and safe sort field
    return "a.created_at";
  }

  /**
   * Get animals for user's farms with enhanced data
   * @performance Rewritten to use JOINs instead of correlated subqueries.
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT
        a.id, a.name, a.species, a.breed, a.birth_date, a.sex,
        a.identification_tag, a.health_status, a.current_location,
        a.production_type, a.status, a.current_weight, a.target_weight,
        a.vaccination_status, a.last_vet_check, a.acquisition_date,
        a.acquisition_cost, a.created_at, a.updated_at,
        fa.name as farm_name,
        b.origin_country as breed_origin,
        b.purpose as breed_purpose,
        b.average_weight as breed_avg_weight,
        b.temperament as breed_temperament,
        COUNT(DISTINCT hr.id) as health_records_count,
        COUNT(DISTINCT pr.id) as production_records_count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      JOIN farms fa ON a.farm_id = fa.id
      LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
      LEFT JOIN animal_health_records hr ON hr.animal_id = a.id
      LEFT JOIN animal_production pr ON pr.animal_id = a.id
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters
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
    if (filters.farm_id) {
      query += " AND a.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.search) {
      query += " AND (a.name LIKE ? OR a.identification_tag LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Group by all non-aggregated fields
    query += `
      GROUP BY a.id, fa.name, b.origin_country, b.purpose,
               b.average_weight, b.temperament
    `;

    // Add sorting
    const sortField = this.validateSortField(options.sortBy);
    const sortDirection =
      options.sortDirection?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY ${sortField} ${sortDirection}`;

    // Add pagination
    if (options.limit) {
      const limit = Math.max(1, Math.min(parseInt(options.limit) || 20, 1000));
      const offset = Math.max(0, (parseInt(options.page) || 1) - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const { data } = await this.db.executeQuery(query, params, {
      operation: "all", // Use 'all' for list results
      table: "animals",
      context: { findByUserAccess: true, userId, filters, options },
    });

    return data;
  }

  /**
   * Count animals for pagination
   * @bugfix Added missing filters to match findByUserAccess
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
    if (filters.farm_id) {
      query += " AND a.farm_id = ?";
      params.push(filters.farm_id);
    }
    // **FIX**: Added missing filters
    if (filters.health_status) {
      query += " AND a.health_status = ?";
      params.push(filters.health_status);
    }
    if (filters.search) {
      query += " AND (a.name LIKE ? OR a.identification_tag LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const { data } = await this.db.executeQuery(query, params, {
      operation: "first", // Use 'first' for single count
      table: "animals",
      context: { countByUserAccess: true, userId, filters },
    });

    return data?.total || 0;
  }

  /**
   * Create animal with validation
   */
  async createWithValidation(animalData, userId) {
    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(animalData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }

    // Verify breed if specified
    if (animalData.breed) {
      const { data } = await this.db.executeQuery(
        "SELECT id FROM breeds WHERE name = ? AND species = ? LIMIT 1",
        [animalData.breed, animalData.species],
        {
          operation: "first",
          table: "breeds",
          context: { validateBreed: true },
        }
      );

      if (!data) {
        throw new Error(
          `Breed "${animalData.breed}" not found for species "${animalData.species}"`
        );
      }
    }

    return await this.create(animalData, { userId });
  }

  /**
   * Get animal with full details
   * @performance Rewritten to use JOINs
   */
  async findWithDetails(animalId, userId) {
    const { data } = await this.db.executeQuery(
      `
      SELECT
        a.*,
        fa.name as farm_name,
        b.origin_country as breed_origin,
        b.purpose as breed_purpose,
        b.average_weight as breed_avg_weight,
        b.temperament as breed_temperament,
        father.name as father_name,
        mother.name as mother_name,
        COUNT(DISTINCT hr.id) as health_records_count,
        COUNT(DISTINCT pr.id) as production_records_count,
        COUNT(DISTINCT abr.id) as breeding_records_count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      JOIN farms fa ON a.farm_id = fa.id
      LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
      LEFT JOIN animals father ON a.father_id = father.id
      LEFT JOIN animals mother ON a.mother_id = mother.id
      LEFT JOIN animal_health_records hr ON hr.animal_id = a.id
      LEFT JOIN animal_production pr ON pr.animal_id = a.id
      LEFT JOIN animal_breeding abr ON abr.animal_id = a.id
      WHERE a.id = ? AND fm.user_id = ?
      GROUP BY a.id, fa.name, b.origin_country, b.purpose,
               b.average_weight, b.temperament, father.name, mother.name
      LIMIT 1
    `,
      [animalId, userId],
      {
        operation: "first", // Use 'first' for single item
        table: "animals",
        context: { findWithDetails: true, animalId, userId },
      }
    );

    return data; // 'data' is the single object or null
  }
}

/**
 * Crop Repository - Handles all crop-related database operations
 */
export class CropRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "crops");
  }

  /**
   * Get crops for user's farms
   * @performance Rewritten to use JOINs
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT
        c.*,
        f.name as field_name,
        fa.name as farm_name,
        COUNT(DISTINCT ca.id) as activity_count,
        COUNT(DISTINCT co.id) as observation_count
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      JOIN farms fa ON c.farm_id = fa.id
      LEFT JOIN fields f ON c.field_id = f.id
      LEFT JOIN crop_activities ca ON ca.crop_id = c.id
      LEFT JOIN crop_observations co ON co.crop_id = c.id
      WHERE fm.user_id = ?
    `;
    const params = [userId];

    // Apply filters
    if (filters.field_id) {
      query += " AND c.field_id = ?";
      params.push(filters.field_id);
    }
    if (filters.status) {
      query += " AND c.status = ?";
      params.push(filters.status);
    }
    if (filters.crop_type) {
      query += " AND c.crop_type = ?";
      params.push(filters.crop_type);
    }

    query += `
      GROUP BY c.id, f.name, fa.name
      ORDER BY c.created_at DESC
    `;

    // Simple pagination (if needed, expand like AnimalRepository)
    if (options.limit) {
      const limit = Math.max(1, Math.min(parseInt(options.limit) || 20, 1000));
      const offset = Math.max(0, (parseInt(options.page) || 1) - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const { data } = await this.db.executeQuery(query, params, {
      operation: "all",
      table: "crops",
      context: { findByUserAccess: true, userId, filters, options },
    });

    return data;
  }

  /**
   * Create crop with initial activity
   */
  async createWithActivity(cropData, userId) {
    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(cropData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }

    const newCrop = await this.create(cropData, { userId });

    // Create initial activity record
    await this.db.executeQuery(
      "INSERT INTO crop_activities (crop_id, activity_type, activity_date, description, created_by) VALUES (?, ?, ?, ?, ?)",
      [
        newCrop.id,
        "planted",
        new Date().toISOString().split("T")[0],
        `Planted ${cropData.crop_type}${
          cropData.crop_variety ? " (" + cropData.crop_variety + ")" : ""
        }`,
        userId,
      ],
      {
        operation: "run",
        table: "crop_activities",
        context: { createInitialActivity: true },
      }
    );

    return newCrop;
  }

  /**
   * Get crop with related data
   * @performance Rewritten main query to use JOINs
   */
  async findWithRelations(
    cropId,
    userId,
    includeActivities = false,
    includeObservations = false
  ) {
    const { data } = await this.db.executeQuery(
      `
      SELECT
        c.*,
        f.name as field_name,
        fa.name as farm_name,
        COUNT(DISTINCT ca.id) as activity_count,
        COUNT(DISTINCT co.id) as observation_count
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      JOIN farms fa ON c.farm_id = fa.id
      LEFT JOIN fields f ON c.field_id = f.id
      LEFT JOIN crop_activities ca ON ca.crop_id = c.id
      LEFT JOIN crop_observations co ON co.crop_id = c.id
      WHERE c.id = ? AND fm.user_id = ?
      GROUP BY c.id, f.name, fa.name
      LIMIT 1
    `,
      [cropId, userId],
      {
        operation: "first", // Use 'first' for single item
        table: "crops",
        context: { findWithRelations: true, cropId, userId },
      }
    );

    if (!data) {
      return null;
    }

    const crop = data;

    // Include activities if requested (N+1, but acceptable for a details page)
    if (includeActivities) {
      const { data: activities } = await this.db.executeQuery(
        "SELECT * FROM crop_activities WHERE crop_id = ? ORDER BY activity_date DESC LIMIT 20",
        [cropId],
        {
          operation: "all",
          table: "crop_activities",
          context: { getActivities: true },
        }
      );
      crop.activities = activities;
    }

    // Include observations if requested
    if (includeObservations) {
      const { data: observations } = await this.db.executeQuery(
        "SELECT * FROM crop_observations WHERE crop_id = ? ORDER BY observation_date DESC LIMIT 10",
        [cropId],
        {
          operation: "all",
          table: "crop_observations",
          context: { getObservations: true },
        }
      );
      crop.observations = observations;
    }

    return crop;
  }
}

// Export all repositories
export default {
  BaseRepository,
  FarmRepository,
  AnimalRepository,
  CropRepository,
};
