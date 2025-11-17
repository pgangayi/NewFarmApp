/**
 * Crop Repository - Handles all crop-related database operations
 * Phase 5 Migration: Operational Systems - Crop Management Enhancement
 * Provides comprehensive crop management with activities, observations, and analytics
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "./_repositories.js";

/**
 * Crop Repository - Handles all crop-related database operations
 * Phase 5 Migration: Operational Systems Enhancement
 */
export class CropRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "crops");
  }

  /**
   * Get crops for user's farms with enhanced filtering and data
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        c.*,
        f.name as field_name,
        fa.name as farm_name,
        COALESCE((SELECT COUNT(*) FROM crop_activities ca WHERE ca.crop_id = c.id), 0) as activity_count,
        COALESCE((SELECT COUNT(*) FROM crop_observations co WHERE co.crop_id = c.id), 0) as observation_count,
        COALESCE((SELECT COUNT(*) FROM irrigation_schedules isc WHERE isc.crop_id = c.id AND isc.is_active = 1), 0) as irrigation_schedules,
        COALESCE((SELECT MAX(cyr.total_yield) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as best_yield,
        COALESCE((SELECT AVG(cyr.yield_per_hectare) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as avg_yield_per_hectare,
        COALESCE((SELECT AVG(cyr.revenue) FROM crop_yield_records cyr WHERE cyr.crop_id = c.id), 0) as avg_revenue
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      JOIN farms fa ON c.farm_id = fa.id
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters with security validation
    if (filters.status) {
      query += " AND c.status = ?";
      params.push(filters.status);
    }
    if (filters.crop_type) {
      query += " AND c.crop_type = ?";
      params.push(filters.crop_type);
    }
    if (filters.field_id) {
      query += " AND c.field_id = ?";
      params.push(filters.field_id);
    }
    if (filters.farm_id) {
      query += " AND c.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.planting_date_from) {
      query += " AND date(c.planting_date) >= ?";
      params.push(filters.planting_date_from);
    }
    if (filters.planting_date_to) {
      query += " AND date(c.planting_date) <= ?";
      params.push(filters.planting_date_to);
    }
    if (filters.search) {
      query +=
        " AND (c.crop_type LIKE ? OR c.crop_variety LIKE ? OR c.notes LIKE ?)";
      params.push(
        `%${filters.search}%`,
        `%${filters.search}%`,
        `%${filters.search}%`
      );
    }

    // Group by to avoid duplicates
    query += " GROUP BY c.id";

    // Add sorting
    if (options.sortBy) {
      query += ` ORDER BY c.${options.sortBy} ${
        options.sortDirection?.toUpperCase() || "DESC"
      }`;
    } else {
      query += " ORDER BY c.planting_date DESC, c.created_at DESC";
    }

    // Add pagination
    if (options.limit) {
      const limit = Math.min(options.limit, 1000);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "crops",
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
        `Database error in CropRepository.findByUserAccess: ${error.message}`
      );
    }

    return results;
  }

  /**
   * Count crops for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];

    if (filters.status) {
      query += " AND c.status = ?";
      params.push(filters.status);
    }
    if (filters.crop_type) {
      query += " AND c.crop_type = ?";
      params.push(filters.crop_type);
    }
    if (filters.field_id) {
      query += " AND c.field_id = ?";
      params.push(filters.field_id);
    }
    if (filters.farm_id) {
      query += " AND c.farm_id = ?";
      params.push(filters.farm_id);
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "crops",
      context: { countByUserAccess: true, userId, filters },
    });

    if (error) {
      throw new Error(
        `Database error in CropRepository.countByUserAccess: ${error.message}`
      );
    }

    return results[0]?.total || 0;
  }

  /**
   * Create crop with comprehensive validation and setup
   */
  async createCrop(cropData, userId) {
    // Validate required fields
    if (!cropData.farm_id || !cropData.crop_type) {
      throw new Error("Farm ID and crop type are required");
    }

    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(cropData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }

    // Validate crop data
    if (
      cropData.status &&
      !["planted", "growing", "harvested", "failed", "archived"].includes(
        cropData.status
      )
    ) {
      throw new Error("Invalid status value");
    }

    // Prepare crop data with defaults
    const cropRecord = {
      farm_id: cropData.farm_id,
      field_id: cropData.field_id || null,
      crop_type: cropData.crop_type.trim(),
      crop_variety: cropData.crop_variety || null,
      planting_date: cropData.planting_date || null,
      harvest_date: cropData.harvest_date || null,
      expected_yield: cropData.expected_yield || null,
      actual_yield: cropData.actual_yield || null,
      seeds_used: cropData.seeds_used || null,
      fertilizer_type: cropData.fertilizer_type || null,
      irrigation_schedule: cropData.irrigation_schedule || null,
      pest_control_schedule: cropData.pest_control_schedule || null,
      soil_preparation: cropData.soil_preparation || null,
      weather_requirements: cropData.weather_requirements || null,
      growth_stage: cropData.growth_stage || "seedling",
      status: cropData.status || "planted",
      current_weight: cropData.current_weight || 0,
      target_weight: cropData.target_weight || null,
      health_status: cropData.health_status || "good",
      last_inspection_date: cropData.last_inspection_date || null,
      notes: cropData.notes || null,
    };

    const transaction = [
      {
        query: `
          INSERT INTO crops (
            farm_id, field_id, crop_type, crop_variety, planting_date, harvest_date,
            expected_yield, actual_yield, seeds_used, fertilizer_type, irrigation_schedule,
            pest_control_schedule, soil_preparation, weather_requirements, growth_stage,
            status, current_weight, target_weight, health_status, last_inspection_date, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: Object.values(cropRecord),
        operation: "run",
        table: "crops",
        context: {
          createCrop: true,
          audit_level: "comprehensive",
          data_integrity: "enforced",
        },
      },
    ];

    try {
      const result = await this.db.executeTransaction(transaction);
      const newCropId = result.results[0].lastRowId;

      // Create initial activity record
      await this.createCropActivity(
        newCropId,
        "planted",
        new Date().toISOString().split("T")[0],
        `Planted ${cropData.crop_type}${
          cropData.crop_variety ? " (" + cropData.crop_variety + ")" : ""
        }`,
        userId
      );

      // Log crop creation in audit trail
      await this.logCropOperation("create", newCropId, cropRecord, userId);

      return await this.findByIdWithDetails(newCropId, userId);
    } catch (error) {
      throw new Error(`Crop creation failed: ${error.message}`);
    }
  }

  /**
   * Update crop with validation and audit trail
   */
  async updateCrop(id, updateData, userId) {
    // Validate record access
    const existing = await this.findByIdWithDetails(id);
    if (!existing) {
      throw new Error("Crop not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToCrop(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this crop");
    }

    // Validate update data
    if (
      updateData.status &&
      !["planted", "growing", "harvested", "failed", "archived"].includes(
        updateData.status
      )
    ) {
      throw new Error("Invalid status value");
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform update
    const updated = await this.updateById(id, updateData);

    // Log activity for status changes
    if (updateData.status && updateData.status !== existing.status) {
      await this.createCropActivity(
        id,
        "status_changed",
        new Date().toISOString().split("T")[0],
        `Status changed to ${updateData.status}`,
        userId
      );
    }

    // Log update in audit trail
    await this.logCropOperation(
      "update",
      id,
      {
        before: existing,
        after: updated,
        changes: updateData,
      },
      userId
    );

    return await this.findByIdWithDetails(id, userId);
  }

  /**
   * Delete crop with dependency checking
   */
  async deleteCrop(id, userId) {
    // Validate record access
    const existing = await this.findByIdWithDetails(id);
    if (!existing) {
      throw new Error("Crop not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToCrop(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this crop");
    }

    // Check for dependencies
    const dependencies = await this.checkCropDependencies(id);
    if (dependencies.hasReferences) {
      throw new Error(
        "Cannot delete crop with existing schedules or yield records. Please archive instead."
      );
    }

    // Perform deletion
    await this.deleteById(id);

    // Log deletion in audit trail
    await this.logCropOperation(
      "delete",
      id,
      {
        deleted_record: existing,
      },
      userId
    );

    return { success: true, deletedId: id };
  }

  /**
   * Get crop with comprehensive details
   */
  async findByIdWithDetails(cropId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT DISTINCT
        c.*,
        f.name as field_name,
        fa.name as farm_name,
        COALESCE((SELECT COUNT(*) FROM crop_activities ca WHERE ca.crop_id = c.id), 0) as activity_count,
        COALESCE((SELECT COUNT(*) FROM crop_observations co WHERE co.crop_id = c.id), 0) as observation_count,
        COALESCE((SELECT COUNT(*) FROM irrigation_schedules isc WHERE isc.crop_id = c.id AND isc.is_active = 1), 0) as irrigation_schedules
      FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      JOIN farms fa ON c.farm_id = fa.id
      LEFT JOIN fields f ON c.field_id = f.id
      WHERE c.id = ? AND fm.user_id = ?
      GROUP BY c.id
    `,
      [cropId, userId],
      {
        operation: "query",
        table: "crops",
        context: { findByIdWithDetails: true, cropId, userId },
      }
    );

    if (results.length === 0) {
      return null;
    }

    return results[0];
  }

  /**
   * Get crop activities
   */
  async getCropActivities(cropId, userId, limit = 20) {
    // Verify access
    const hasAccess = await this.hasUserAccessToCrop(cropId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to crop activities");
    }

    const { results, error } = await this.db.executeQuery(
      `
      SELECT ca.*, u.name as worker_name
      FROM crop_activities ca
      LEFT JOIN users u ON ca.worker_id = u.id
      WHERE ca.crop_id = ?
      ORDER BY ca.activity_date DESC
      LIMIT ?
    `,
      [cropId, limit],
      {
        operation: "query",
        table: "crop_activities",
        context: { getCropActivities: true, cropId, limit },
      }
    );

    if (error) {
      throw new Error(`Database error in getCropActivities: ${error.message}`);
    }

    return results;
  }

  /**
   * Create crop activity
   */
  async createCropActivity(
    cropId,
    activityType,
    activityDate,
    description,
    userId,
    additionalData = {}
  ) {
    const activityData = {
      crop_id: cropId,
      activity_type: activityType,
      activity_date: activityDate,
      description: description,
      cost: additionalData.cost || 0,
      worker_id: userId,
      weather_conditions: additionalData.weather_conditions || null,
    };

    const { error } = await this.db.executeQuery(
      `
      INSERT INTO crop_activities (
        crop_id, activity_type, activity_date, description, cost, worker_id, weather_conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      Object.values(activityData),
      {
        operation: "run",
        table: "crop_activities",
        context: { createCropActivity: true, cropId, activityType },
      }
    );

    if (error) {
      throw new Error(`Failed to create crop activity: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Get crop observations
   */
  async getCropObservations(cropId, userId, limit = 10) {
    // Verify access
    const hasAccess = await this.hasUserAccessToCrop(cropId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to crop observations");
    }

    const { results, error } = await this.db.executeQuery(
      `
      SELECT * FROM crop_observations
      WHERE crop_id = ?
      ORDER BY observation_date DESC
      LIMIT ?
    `,
      [cropId, limit],
      {
        operation: "query",
        table: "crop_observations",
        context: { getCropObservations: true, cropId, limit },
      }
    );

    if (error) {
      throw new Error(
        `Database error in getCropObservations: ${error.message}`
      );
    }

    return results;
  }

  /**
   * Create crop observation
   */
  async createCropObservation(observationData, userId) {
    if (!observationData.crop_id || !observationData.observation_date) {
      throw new Error("Crop ID and observation date are required");
    }

    // Verify access
    const hasAccess = await this.hasUserAccessToCrop(
      observationData.crop_id,
      userId
    );
    if (!hasAccess) {
      throw new Error("Access denied to crop");
    }

    const observationRecord = {
      crop_id: observationData.crop_id,
      observation_date: observationData.observation_date,
      growth_stage: observationData.growth_stage || null,
      health_status: observationData.health_status || null,
      height_cm: observationData.height_cm || null,
      leaf_count: observationData.leaf_count || null,
      pest_presence: observationData.pest_presence ? 1 : 0,
      disease_signs: observationData.disease_signs || null,
      soil_moisture: observationData.soil_moisture || null,
      photos: observationData.photos || null,
      notes: observationData.notes || null,
    };

    const { error } = await this.db.executeQuery(
      `
      INSERT INTO crop_observations (
        crop_id, observation_date, growth_stage, health_status, height_cm,
        leaf_count, pest_presence, disease_signs, soil_moisture, photos, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      Object.values(observationRecord),
      {
        operation: "run",
        table: "crop_observations",
        context: {
          createCropObservation: true,
          cropId: observationData.crop_id,
        },
      }
    );

    if (error) {
      throw new Error(`Failed to create crop observation: ${error.message}`);
    }

    // Update crop health status and last inspection date
    if (observationData.health_status) {
      await this.updateById(observationData.crop_id, {
        health_status: observationData.health_status,
        last_inspection_date: observationData.observation_date,
      });
    }

    return { success: true };
  }

  /**
   * Get crop analytics
   */
  async getCropAnalytics(farmId, userId, dateFrom, dateTo) {
    // Verify access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    const dateFilter =
      dateFrom && dateTo
        ? `AND date(c.planting_date) >= date('${dateFrom}') AND date(c.planting_date) <= date('${dateTo}')`
        : "";

    const { results, error } = await this.db.executeQuery(
      `
      SELECT
        COUNT(*) as total_crops,
        COUNT(CASE WHEN c.status = 'harvested' THEN 1 END) as harvested_crops,
        COUNT(CASE WHEN c.status = 'growing' THEN 1 END) as active_crops,
        COUNT(CASE WHEN c.health_status = 'poor' THEN 1 END) as unhealthy_crops,
        AVG(c.expected_yield) as avg_expected_yield,
        AVG(c.actual_yield) as avg_actual_yield,
        SUM(c.actual_yield) as total_yield,
        COUNT(DISTINCT c.crop_type) as crop_variety_count
      FROM crops c
      WHERE c.farm_id = ? ${dateFilter}
    `,
      [farmId],
      {
        operation: "query",
        table: "crops",
        context: { getCropAnalytics: true, farmId, dateFrom, dateTo },
      }
    );

    if (error) {
      throw new Error(`Database error in getCropAnalytics: ${error.message}`);
    }

    return results[0] || {};
  }

  // === PRIVATE HELPER METHODS ===

  async hasUserAccessToCrop(cropId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM crops c
      JOIN farm_members fm ON c.farm_id = fm.farm_id
      WHERE c.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [cropId, userId],
      {
        operation: "query",
        table: "crops",
        context: { hasUserAccessToCrop: true },
      }
    );

    return results.length > 0;
  }

  async checkCropDependencies(cropId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT
        (SELECT COUNT(*) FROM irrigation_schedules WHERE crop_id = ?) as irrigation_schedules,
        (SELECT COUNT(*) FROM crop_yield_records WHERE crop_id = ?) as yield_records,
        (SELECT COUNT(*) FROM crop_activities WHERE crop_id = ?) as activities,
        (SELECT COUNT(*) FROM crop_observations WHERE crop_id = ?) as observations
    `,
      [cropId, cropId, cropId, cropId],
      {
        operation: "query",
        table: "crops",
        context: { checkCropDependencies: true },
      }
    );

    const deps = results[0];
    return {
      hasReferences: deps.irrigation_schedules > 0 || deps.yield_records > 0,
      irrigation_schedules: deps.irrigation_schedules,
      yield_records: deps.yield_records,
      activities: deps.activities,
      observations: deps.observations,
    };
  }

  async logCropOperation(operation, cropId, data, userId) {
    try {
      await this.db.executeQuery(
        `
        INSERT INTO audit_logs (
          user_id, action, table_name, record_id, old_values, new_values,
          timestamp, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          userId,
          `crop.${operation}`,
          "crops",
          cropId,
          data.before ? JSON.stringify(data.before) : null,
          data.after || data.created || JSON.stringify(data),
          new Date().toISOString(),
          "system",
          "CropRepository",
        ],
        {
          operation: "run",
          table: "audit_logs",
          context: { logCropOperation: true },
        }
      );
    } catch (error) {
      console.error("Failed to log crop operation:", error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }
}
