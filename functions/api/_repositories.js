// Specific Repository Classes for Farm Management Entities
// Provides entity-specific operations with centralized database access
// Date: November 7, 2025

import { BaseRepository } from './_database.js';

/**
 * Farm Repository - Handles all farm-related database operations
 */
export class FarmRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, 'farms');
  }

  /**
   * Get farms owned by a user
   */
  async findByOwnerId(ownerId, options = {}) {
    const { results } = await this.db.executeQuery(`
      SELECT 
        f.*,
        COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
        COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
      FROM farms f
      WHERE f.owner_id = ?
      ORDER BY f.created_at DESC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
    `, [ownerId], {
      operation: 'query',
      table: 'farms',
      context: { findByOwnerId: true, ownerId, ...options.context }
    });

    return results;
  }

  /**
   * Get farms where user has access (as owner or member)
   */
  async findByUserAccess(userId, options = {}) {
    const { results } = await this.db.executeQuery(`
      SELECT DISTINCT
        f.*,
        fm.role,
        COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
        COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
      FROM farms f
      JOIN farm_members fm ON f.id = fm.farm_id
      WHERE fm.user_id = ?
      ORDER BY f.created_at DESC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
    `, [userId], {
      operation: 'query',
      table: 'farms',
      context: { findByUserAccess: true, userId, ...options.context }
    });

    return results;
  }

  /**
   * Get farm with statistics
   */
  async findWithStatistics(farmId, userId) {
    const { results } = await this.db.executeQuery(`
      SELECT 
        f.*,
        COALESCE((SELECT COUNT(*) FROM animals a WHERE a.farm_id = f.id), 0) as animal_count,
        COALESCE((SELECT COUNT(*) FROM fields fi WHERE fi.farm_id = f.id), 0) as field_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = f.id AND t.status != 'completed'), 0) as pending_tasks
      FROM farms f
      JOIN farm_members fm ON f.id = fm.farm_id
      WHERE f.id = ? AND fm.user_id = ?
    `, [farmId, userId], {
      operation: 'query',
      table: 'farms',
      context: { findWithStatistics: true, farmId, userId }
    });

    return results[0] || null;
  }

  /**
   * Get farm statistics over time
   */
  async getStatistics(farmId, period = '12months', userId) {
    const limit = period === '6months' ? 6 : 12;
    
    const { results } = await this.db.executeQuery(`
      SELECT * FROM farm_statistics 
      WHERE farm_id = ? 
      ORDER BY report_date DESC 
      LIMIT ?
    `, [farmId, limit], {
      operation: 'query',
      table: 'farm_statistics',
      context: { getStatistics: true, farmId, period }
    });

    return results;
  }

  /**
   * Create farm with initial setup
   */
  async createWithSetup(farmData, ownerId) {
    const transaction = [];
    
    // Create farm
    transaction.push({
      query: `
        INSERT INTO farms (
          name, location, area_hectares, farm_type, certification_status,
          environmental_compliance, total_acres, operational_start_date,
          management_structure, seasonal_staff, annual_budget, owner_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      params: [
        farmData.name,
        farmData.location,
        farmData.area_hectares || null,
        farmData.farm_type || null,
        farmData.certification_status || null,
        farmData.environmental_compliance || null,
        farmData.total_acres || null,
        farmData.operational_start_date || null,
        farmData.management_structure || null,
        farmData.seasonal_staff || null,
        farmData.annual_budget || null,
        ownerId
      ],
      operation: 'run',
      table: 'farms',
      context: { createWithSetup: true }
    });

    try {
      const result = await this.db.executeTransaction(transaction);
      const newFarmId = result.results[0].lastRowId;

      // Grant owner access
      await this.db.executeQuery(
        'INSERT INTO farm_members (farm_id, user_id, role) VALUES (?, ?, ?)',
        [newFarmId, ownerId, 'owner'],
        {
          operation: 'run',
          table: 'farm_members',
          context: { grantOwnerAccess: true }
        }
      );

      // Create initial statistics record
      await this.db.executeQuery(
        'INSERT INTO farm_statistics (farm_id, report_date) VALUES (?, ?)',
        [newFarmId, new Date().toISOString().split('T')[0]],
        {
          operation: 'run',
          table: 'farm_statistics',
          context: { createInitialStats: true }
        }
      );

      return await this.findById(newFarmId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update farm with dependency management
   */
  async updateWithDependencies(farmId, updateData, userId) {
    // Check access first
    const farm = await this.findById(farmId);
    if (!farm || !await this.hasUserAccess(farmId, userId)) {
      throw new Error('Farm not found or access denied');
    }

    // Update the farm
    return await this.updateById(farmId, updateData);
  }

  /**
   * Delete farm with dependency checks
   */
  async deleteWithDependencies(farmId, userId) {
    // Check access and ownership
    const { results } = await this.db.executeQuery(`
      SELECT f.owner_id, f.name
      FROM farms f
      JOIN farm_members fm ON f.id = fm.farm_id
      WHERE f.id = ? AND fm.user_id = ? AND fm.role = 'owner'
    `, [farmId, userId], {
      operation: 'query',
      table: 'farms',
      context: { deleteCheck: true }
    });

    if (results.length === 0) {
      throw new Error('Farm not found, access denied, or insufficient permissions');
    }

    // Check for dependencies
    const dependencies = await this.db.checkDependencies('farms', farmId);
    const hasDependencies = Object.values(dependencies).some(count => count > 0);

    if (hasDependencies) {
      throw new Error('Cannot delete farm with existing data. Please archive instead.');
    }

    // Perform deletion
    await this.deleteById(farmId);
    
    return { success: true, farmId, deletedFarm: results[0] };
  }

  /**
   * Check if user has access to farm
   */
  async hasUserAccess(farmId, userId) {
    const { results } = await this.db.executeQuery(`
      SELECT 1 FROM farm_members 
      WHERE farm_id = ? AND user_id = ?
      LIMIT 1
    `, [farmId, userId], {
      operation: 'query',
      table: 'farm_members',
      context: { hasUserAccess: true }
    });

    return results.length > 0;
  }
}

/**
 * Animal Repository - Handles all animal-related database operations
 */
export class AnimalRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, 'animals');
  }

  /**
   * Get animals for user's farms with enhanced data
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        a.id,
        a.name,
        a.species,
        a.breed,
        a.birth_date,
        a.sex,
        a.identification_tag,
        a.health_status,
        a.current_location,
        a.production_type,
        a.status,
        a.current_weight,
        a.target_weight,
        a.vaccination_status,
        a.last_vet_check,
        a.acquisition_date,
        a.acquisition_cost,
        a.created_at,
        a.updated_at,
        fa.name as farm_name,
        b.origin_country as breed_origin,
        b.purpose as breed_purpose,
        b.average_weight as breed_avg_weight,
        b.temperament as breed_temperament,
        COALESCE((SELECT COUNT(*) FROM animal_health_records hr WHERE hr.animal_id = a.id), 0) as health_records_count,
        COALESCE((SELECT COUNT(*) FROM animal_production pr WHERE pr.animal_id = a.id), 0) as production_records_count
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      JOIN farms fa ON a.farm_id = fa.id
      LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters
    if (filters.species) {
      query += ' AND a.species = ?';
      params.push(filters.species);
    }
    if (filters.breed) {
      query += ' AND a.breed = ?';
      params.push(filters.breed);
    }
    if (filters.health_status) {
      query += ' AND a.health_status = ?';
      params.push(filters.health_status);
    }
    if (filters.farm_id) {
      query += ' AND a.farm_id = ?';
      params.push(filters.farm_id);
    }
    if (filters.search) {
      query += ' AND (a.name LIKE ? OR a.identification_tag LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Group by to avoid duplicates
    query += ' GROUP BY a.id';

    // Add sorting
    if (options.sortBy) {
      query += ` ORDER BY a.${options.sortBy} ${options.sortDirection?.toUpperCase() || 'DESC'}`;
    } else {
      query += ' ORDER BY a.created_at DESC';
    }

    // Add pagination
    if (options.limit) {
      const limit = Math.min(options.limit, 1000);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const { results } = await this.db.executeQuery(
      query,
      params,
      {
        operation: 'query',
        table: 'animals',
        context: { findByUserAccess: true, userId, filters, options }
      }
    );

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
      query += ' AND a.species = ?';
      params.push(filters.species);
    }
    if (filters.breed) {
      query += ' AND a.breed = ?';
      params.push(filters.breed);
    }
    if (filters.farm_id) {
      query += ' AND a.farm_id = ?';
      params.push(filters.farm_id);
    }

    const { results } = await this.db.executeQuery(
      query,
      params,
      {
        operation: 'query',
        table: 'animals',
        context: { countByUserAccess: true, userId, filters }
      }
    );

    return results[0]?.total || 0;
  }

  /**
   * Create animal with validation
   */
  async createWithValidation(animalData, userId) {
    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(animalData.farm_id, userId);
    if (!hasAccess) {
      throw new Error('Farm not found or access denied');
    }

    // Verify breed if specified
    if (animalData.breed) {
      const { results } = await this.db.executeQuery(
        'SELECT id FROM breeds WHERE name = ? AND species = ?',
        [animalData.breed, animalData.species],
        {
          operation: 'query',
          table: 'breeds',
          context: { validateBreed: true }
        }
      );
      
      if (results.length === 0) {
        throw new Error(`Breed "${animalData.breed}" not found for species "${animalData.species}"`);
      }
    }

    return await this.create(animalData);
  }

  /**
   * Get animal with full details
   */
  async findWithDetails(animalId, userId) {
    const { results } = await this.db.executeQuery(`
      SELECT DISTINCT
        a.*,
        fa.name as farm_name,
        b.origin_country as breed_origin,
        b.purpose as breed_purpose,
        b.average_weight as breed_avg_weight,
        b.temperament as breed_temperament,
        COALESCE((SELECT COUNT(*) FROM animal_health_records hr WHERE hr.animal_id = a.id), 0) as health_records_count,
        COALESCE((SELECT COUNT(*) FROM animal_production pr WHERE pr.animal_id = a.id), 0) as production_records_count,
        COALESCE((SELECT COUNT(*) FROM animal_breeding abr WHERE abr.animal_id = a.id), 0) as breeding_records_count,
        father.name as father_name,
        mother.name as mother_name
      FROM animals a
      JOIN farm_members fm ON a.farm_id = fm.farm_id
      JOIN farms fa ON a.farm_id = fa.id
      LEFT JOIN breeds b ON a.breed = b.name AND a.species = b.species
      LEFT JOIN animals father ON a.father_id = father.id
      LEFT JOIN animals mother ON a.mother_id = mother.id
      WHERE a.id = ? AND fm.user_id = ?
      GROUP BY a.id
    `, [animalId, userId], {
      operation: 'query',
      table: 'animals',
      context: { findWithDetails: true, animalId, userId }
    });

    return results[0] || null;
  }
}

/**
 * Crop Repository - Handles all crop-related database operations
 */
export class CropRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, 'crops');
  }

  /**
   * Get crops for user's farms
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT 
        c.*,
        f.name as field_name,
        fa.name as farm_name,
        COALESCE((SELECT COUNT(*) FROM crop_activities ca WHERE ca.crop_id = c.id), 0) as activity_count,
        COALESCE((SELECT COUNT(*) FROM crop_observations co WHERE co.crop_id = c.id), 0) as observation_count
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      JOIN farms fa ON c.farm_id = fa.id
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE fm.user_id = ?
    `;
    const params = [userId];

    // Apply filters
    if (filters.field_id) {
      query += ' AND c.field_id = ?';
      params.push(filters.field_id);
    }
    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }
    if (filters.crop_type) {
      query += ' AND c.crop_type = ?';
      params.push(filters.crop_type);
    }

    query += ' ORDER BY c.created_at DESC';

    const { results } = await this.db.executeQuery(
      query,
      params,
      {
        operation: 'query',
        table: 'crops',
        context: { findByUserAccess: true, userId, filters, options }
      }
    );

    return results;
  }

  /**
   * Create crop with initial activity
   */
  async createWithActivity(cropData, userId) {
    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(cropData.farm_id, userId);
    if (!hasAccess) {
      throw new Error('Farm not found or access denied');
    }

    const newCrop = await this.create(cropData);

    // Create initial activity record
    await this.db.executeQuery(
      'INSERT INTO crop_activities (crop_id, activity_type, activity_date, description) VALUES (?, ?, ?, ?)',
      [
        newCrop.id,
        'planted',
        new Date().toISOString().split('T')[0],
        `Planted ${cropData.crop_type}${cropData.crop_variety ? ' (' + cropData.crop_variety + ')' : ''}`
      ],
      {
        operation: 'run',
        table: 'crop_activities',
        context: { createInitialActivity: true }
      }
    );

    return newCrop;
  }

  /**
   * Get crop with related data
   */
  async findWithRelations(cropId, userId, includeActivities = false, includeObservations = false) {
    const { results } = await this.db.executeQuery(`
      SELECT 
        c.*,
        f.name as field_name,
        fa.name as farm_name,
        COALESCE((SELECT COUNT(*) FROM crop_activities ca WHERE ca.crop_id = c.id), 0) as activity_count,
        COALESCE((SELECT COUNT(*) FROM crop_observations co WHERE co.crop_id = c.id), 0) as observation_count
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      JOIN farms fa ON c.farm_id = fa.id
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE c.id = ? AND fm.user_id = ?
    `, [cropId, userId], {
      operation: 'query',
      table: 'crops',
      context: { findWithRelations: true, cropId, userId }
    });

    if (results.length === 0) {
      return null;
    }

    const crop = results[0];

    // Include activities if requested
    if (includeActivities) {
      const { results: activities } = await this.db.executeQuery(
        'SELECT * FROM crop_activities WHERE crop_id = ? ORDER BY activity_date DESC LIMIT 20',
        [cropId],
        {
          operation: 'query',
          table: 'crop_activities',
          context: { getActivities: true }
        }
      );
      crop.activities = activities;
    }

    // Include observations if requested
    if (includeObservations) {
      const { results: observations } = await this.db.executeQuery(
        'SELECT * FROM crop_observations WHERE crop_id = ? ORDER BY observation_date DESC LIMIT 10',
        [cropId],
        {
          operation: 'query',
          table: 'crop_observations',
          context: { getObservations: true }
        }
      );
      crop.observations = observations;
    }

    return crop;
  }
}

// Export all repositories
export default {
  FarmRepository,
  AnimalRepository,
  CropRepository
};