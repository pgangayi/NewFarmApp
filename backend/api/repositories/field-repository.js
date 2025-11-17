/**
 * Field Repository - Handles all field-related database operations
 * Phase 5 Migration: Operational Systems - Field Management Enhancement
 * Provides comprehensive field management with soil analysis, equipment tracking, and usage history
 */

import { BaseRepository } from "../_database.js";
import { FarmRepository } from "../_repositories.js";

/**
 * Field Repository - Handles all field-related database operations
 * Phase 5 Migration: Operational Systems Enhancement
 */
export class FieldRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "fields");
  }

  /**
   * Get fields for user's farms with enhanced filtering and analytics
   */
  async findByUserAccess(userId, filters = {}, options = {}) {
    let query = `
      SELECT DISTINCT
        f.*,
        fa.name as farm_name,
        COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count,
        COALESCE((SELECT AVG(fuh.profitability_score) FROM field_usage_history fuh WHERE fuh.field_id = f.id), 0) as avg_profitability,
        COALESCE((SELECT MAX(fuh.yield_per_hectare) FROM field_usage_history fuh WHERE fuh.field_id = f.id), 0) as best_yield_per_hectare,
        COALESCE((SELECT AVG(sa.ph_level) FROM soil_analysis sa WHERE sa.field_id = f.id), 0) as avg_ph_level,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = fa.id AND t.status != 'completed'), 0) as pending_tasks
      FROM fields f
      JOIN farm_members fm ON f.farm_id = fm.farm_id
      JOIN farms fa ON f.farm_id = fa.id
      WHERE fm.user_id = ?
    `;

    const params = [userId];

    // Apply filters with security validation
    if (filters.farm_id) {
      query += " AND f.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.crop_type) {
      query += " AND f.crop_type = ?";
      params.push(filters.crop_type);
    }
    if (filters.soil_type) {
      query += " AND f.soil_type = ?";
      params.push(filters.soil_type);
    }
    if (filters.irrigation_system) {
      query += " AND f.irrigation_system = ?";
      params.push(filters.irrigation_system);
    }
    if (filters.drainage_quality) {
      query += " AND f.drainage_quality = ?";
      params.push(filters.drainage_quality);
    }
    if (filters.current_cover_crop) {
      query += " AND f.current_cover_crop = ?";
      params.push(filters.current_cover_crop);
    }
    if (filters.search) {
      query += " AND (f.name LIKE ? OR f.notes LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Add sorting
    if (options.sortBy) {
      query += ` ORDER BY f.${options.sortBy} ${
        options.sortDirection?.toUpperCase() || "DESC"
      }`;
    } else {
      query += " ORDER BY f.created_at DESC";
    }

    // Add pagination
    if (options.limit) {
      const limit = Math.min(options.limit, 1000);
      const offset = (options.page - 1) * limit;
      query += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "fields",
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
        `Database error in FieldRepository.findByUserAccess: ${error.message}`
      );
    }

    return results;
  }

  /**
   * Count fields for pagination
   */
  async countByUserAccess(userId, filters = {}) {
    let query = `
      SELECT COUNT(DISTINCT f.id) as total
      FROM fields f
      JOIN farm_members fm ON f.farm_id = fm.farm_id
      WHERE fm.user_id = ?
    `;
    const params = [userId];

    if (filters.farm_id) {
      query += " AND f.farm_id = ?";
      params.push(filters.farm_id);
    }
    if (filters.crop_type) {
      query += " AND f.crop_type = ?";
      params.push(filters.crop_type);
    }

    const { results, error } = await this.db.executeQuery(query, params, {
      operation: "query",
      table: "fields",
      context: { countByUserAccess: true, userId, filters },
    });

    if (error) {
      throw new Error(
        `Database error in FieldRepository.countByUserAccess: ${error.message}`
      );
    }

    return results[0]?.total || 0;
  }

  /**
   * Create field with comprehensive setup and validation
   */
  async createField(fieldData, userId) {
    // Validate required fields
    if (!fieldData.farm_id || !fieldData.name) {
      throw new Error("Farm ID and name are required");
    }

    // Validate field data
    if (fieldData.area_hectares !== undefined) {
      const area = parseFloat(fieldData.area_hectares);
      if (isNaN(area) || area <= 0) {
        throw new Error("Area must be a positive number");
      }
      fieldData.area_hectares = area;
    }

    // Check farm access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(fieldData.farm_id, userId);
    if (!hasAccess) {
      throw new Error("Farm not found or access denied");
    }

    // Validate drainage quality if provided
    if (
      fieldData.drainage_quality &&
      !["excellent", "good", "fair", "poor"].includes(
        fieldData.drainage_quality
      )
    ) {
      throw new Error(
        "Drainage quality must be excellent, good, fair, or poor"
      );
    }

    // Validate accessibility score if provided
    if (fieldData.accessibility_score !== undefined) {
      const score = parseInt(fieldData.accessibility_score);
      if (isNaN(score) || score < 1 || score > 10) {
        throw new Error("Accessibility score must be between 1 and 10");
      }
      fieldData.accessibility_score = score;
    }

    // Prepare field data with defaults
    const fieldRecord = {
      farm_id: fieldData.farm_id,
      name: fieldData.name.trim(),
      area_hectares: fieldData.area_hectares || null,
      crop_type: fieldData.crop_type || null,
      notes: fieldData.notes || null,
      soil_type: fieldData.soil_type || null,
      field_capacity: fieldData.field_capacity || null,
      current_cover_crop: fieldData.current_cover_crop || null,
      irrigation_system: fieldData.irrigation_system || null,
      drainage_quality: fieldData.drainage_quality || null,
      accessibility_score: fieldData.accessibility_score || null,
      environmental_factors: fieldData.environmental_factors || null,
      maintenance_schedule: fieldData.maintenance_schedule || null,
    };

    const transaction = [
      {
        query: `
          INSERT INTO fields (
            farm_id, name, area_hectares, crop_type, notes,
            soil_type, field_capacity, current_cover_crop, irrigation_system,
            drainage_quality, accessibility_score, environmental_factors,
            maintenance_schedule
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: Object.values(fieldRecord),
        operation: "run",
        table: "fields",
        context: {
          createField: true,
          audit_level: "comprehensive",
          data_integrity: "enforced",
        },
      },
    ];

    try {
      const result = await this.db.executeTransaction(transaction);
      const newFieldId = result.results[0].lastRowId;

      // Log field creation in audit trail
      await this.logFieldOperation("create", newFieldId, fieldRecord, userId);

      // Create initial soil analysis record
      await this.createInitialSoilAnalysis(newFieldId);

      return await this.findByIdWithDetails(newFieldId, userId);
    } catch (error) {
      throw new Error(`Field creation failed: ${error.message}`);
    }
  }

  /**
   * Update field with validation and audit trail
   */
  async updateField(id, updateData, userId) {
    // Validate record access
    const existing = await this.findByIdWithDetails(id);
    if (!existing) {
      throw new Error("Field not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToField(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this field");
    }

    // Validate update data
    if (updateData.area_hectares !== undefined) {
      const area = parseFloat(updateData.area_hectares);
      if (isNaN(area) || area <= 0) {
        throw new Error("Area must be a positive number");
      }
      updateData.area_hectares = area;
    }

    if (
      updateData.drainage_quality &&
      !["excellent", "good", "fair", "poor"].includes(
        updateData.drainage_quality
      )
    ) {
      throw new Error(
        "Drainage quality must be excellent, good, fair, or poor"
      );
    }

    if (updateData.accessibility_score !== undefined) {
      const score = parseInt(updateData.accessibility_score);
      if (isNaN(score) || score < 1 || score > 10) {
        throw new Error("Accessibility score must be between 1 and 10");
      }
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform update
    const updated = await this.updateById(id, updateData);

    // Log update in audit trail
    await this.logFieldOperation(
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
   * Delete field with comprehensive dependency checking
   */
  async deleteField(id, userId) {
    // Validate record access
    const existing = await this.findByIdWithDetails(id);
    if (!existing) {
      throw new Error("Field not found");
    }

    // Check access through farm membership
    const hasAccess = await this.hasUserAccessToField(id, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this field");
    }

    // Check for dependencies (crops, equipment, etc.)
    const dependencies = await this.checkFieldDependencies(id);
    if (dependencies.hasReferences) {
      const message = this.generateDependencyMessage(dependencies);
      throw new Error(message);
    }

    // Perform deletion
    await this.deleteById(id);

    // Log deletion in audit trail
    await this.logFieldOperation(
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
   * Get field with comprehensive details and related data
   */
  async findByIdWithDetails(
    fieldId,
    userId,
    includeSoil = false,
    includeEquipment = false,
    includeUsage = false
  ) {
    const { results } = await this.db.executeQuery(
      `
      SELECT DISTINCT
        f.*,
        fa.name as farm_name,
        COALESCE((SELECT COUNT(*) FROM crops c WHERE c.field_id = f.id), 0) as crop_count,
        COALESCE((SELECT COUNT(*) FROM tasks t WHERE t.farm_id = fa.id AND t.status != 'completed'), 0) as pending_tasks
      FROM fields f
      JOIN farm_members fm ON f.farm_id = fm.farm_id
      JOIN farms fa ON f.farm_id = fa.id
      WHERE f.id = ? AND fm.user_id = ?
      GROUP BY f.id
    `,
      [fieldId, userId],
      {
        operation: "query",
        table: "fields",
        context: { findByIdWithDetails: true, fieldId, userId },
      }
    );

    if (results.length === 0) {
      return null;
    }

    const field = results[0];

    // Get soil analysis if requested
    if (includeSoil) {
      const { results: soilResults } = await this.db.executeQuery(
        `
        SELECT * FROM soil_analysis 
        WHERE field_id = ? 
        ORDER BY analysis_date DESC 
        LIMIT 10
      `,
        [fieldId],
        {
          operation: "query",
          table: "soil_analysis",
          context: { getSoilAnalysis: true, fieldId },
        }
      );
      field.soil_analysis = soilResults;
    }

    // Get equipment if requested
    if (includeEquipment) {
      const { results: equipmentResults } = await this.db.executeQuery(
        `
        SELECT * FROM field_equipment 
        WHERE field_id = ? 
        ORDER BY equipment_type, equipment_name
      `,
        [fieldId],
        {
          operation: "query",
          table: "field_equipment",
          context: { getEquipment: true, fieldId },
        }
      );
      field.equipment = equipmentResults;
    }

    // Get usage history if requested
    if (includeUsage) {
      const { results: usageResults } = await this.db.executeQuery(
        `
        SELECT * FROM field_usage_history 
        WHERE field_id = ? 
        ORDER BY usage_period_start DESC 
        LIMIT 12
      `,
        [fieldId],
        {
          operation: "query",
          table: "field_usage_history",
          context: { getUsageHistory: true, fieldId },
        }
      );
      field.usage_history = usageResults;
    }

    return field;
  }

  /**
   * Get field analytics and performance metrics
   */
  async getFieldAnalytics(farmId, userId, dateFrom, dateTo) {
    // Verify access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    const dateFilter =
      dateFrom && dateTo
        ? `AND date(f.created_at) >= date('${dateFrom}') AND date(f.created_at) <= date('${dateTo}')`
        : "";

    const { results } = await this.db.executeQuery(
      `
      SELECT
        COUNT(*) as total_fields,
        AVG(f.area_hectares) as avg_field_size,
        COUNT(CASE WHEN f.soil_type IS NOT NULL THEN 1 END) as analyzed_fields,
        COUNT(CASE WHEN f.current_cover_crop IS NOT NULL THEN 1 END) as cultivated_fields,
        AVG(CASE WHEN f.soil_ph IS NOT NULL THEN f.soil_ph END) as avg_soil_ph,
        AVG(CASE WHEN f.drainage_quality = 'excellent' THEN 1 WHEN f.drainage_quality = 'good' THEN 0.8 WHEN f.drainage_quality = 'fair' THEN 0.6 ELSE 0.4 END) as avg_drainage_score
      FROM fields f
      WHERE f.farm_id = ? ${dateFilter}
    `,
      [farmId],
      {
        operation: "query",
        table: "fields",
        context: { getFieldAnalytics: true, farmId, dateFrom, dateTo },
      }
    );

    return results[0] || {};
  }

  /**
   * Get field utilization data
   */
  async getFieldUtilization(farmId, userId) {
    // Verify access
    const farmRepo = new FarmRepository(this.db);
    const hasAccess = await farmRepo.hasUserAccess(farmId, userId);
    if (!hasAccess) {
      throw new Error("Farm access denied");
    }

    const { results } = await this.db.executeQuery(
      `
      SELECT
        f.id,
        f.name,
        f.area_hectares,
        COUNT(c.id) as active_crops,
        COALESCE(SUM(c.area_hectares), 0) as cultivated_area,
        (COALESCE(SUM(c.area_hectares), 0) / f.area_hectares) * 100 as utilization_rate
      FROM fields f
      LEFT JOIN crops c ON f.id = c.field_id AND c.growth_stage IN ('planted', 'growing', 'flowering', 'mature')
      WHERE f.farm_id = ?
      GROUP BY f.id, f.name, f.area_hectares
      ORDER BY utilization_rate DESC
    `,
      [farmId],
      {
        operation: "query",
        table: "fields",
        context: { getFieldUtilization: true, farmId },
      }
    );

    return results;
  }

  /**
   * Create soil analysis record for field
   */
  async createSoilAnalysis(fieldId, analysisData, userId) {
    // Verify access
    const hasAccess = await this.hasUserAccessToField(fieldId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this field");
    }

    // Validate analysis data
    if (analysisData.ph_level !== undefined) {
      const ph = parseFloat(analysisData.ph_level);
      if (isNaN(ph) || ph < 0 || ph > 14) {
        throw new Error("pH level must be between 0 and 14");
      }
    }

    const soilRecord = {
      field_id: fieldId,
      analysis_date:
        analysisData.analysis_date || new Date().toISOString().split("T")[0],
      ph_level: analysisData.ph_level || 0,
      nitrogen_content: analysisData.nitrogen_content || 0,
      phosphorus_content: analysisData.phosphorus_content || 0,
      potassium_content: analysisData.potassium_content || 0,
      organic_matter: analysisData.organic_matter || 0,
      soil_moisture: analysisData.soil_moisture || 0,
      temperature: analysisData.temperature || 0,
      salinity: analysisData.salinity || 0,
      recommendations: analysisData.recommendations || "",
    };

    const { error } = await this.db.executeQuery(
      `
      INSERT INTO soil_analysis (
        field_id, analysis_date, ph_level, nitrogen_content, phosphorus_content,
        potassium_content, organic_matter, soil_moisture, temperature, salinity, recommendations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      Object.values(soilRecord),
      {
        operation: "run",
        table: "soil_analysis",
        context: { createSoilAnalysis: true, fieldId, userId },
      }
    );

    if (error) {
      throw new Error(`Soil analysis creation failed: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Add equipment to field
   */
  async addEquipment(fieldId, equipmentData, userId) {
    // Verify access
    const hasAccess = await this.hasUserAccessToField(fieldId, userId);
    if (!hasAccess) {
      throw new Error("Access denied to this field");
    }

    // Validate equipment data
    if (!equipmentData.equipment_type) {
      throw new Error("Equipment type is required");
    }

    if (equipmentData.performance_rating !== undefined) {
      const rating = parseInt(equipmentData.performance_rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        throw new Error("Performance rating must be between 1 and 5");
      }
    }

    const equipmentRecord = {
      field_id: fieldId,
      equipment_type: equipmentData.equipment_type,
      equipment_name: equipmentData.equipment_name || "",
      maintenance_schedule: equipmentData.maintenance_schedule || "",
      last_maintenance: equipmentData.last_maintenance || null,
      next_maintenance: equipmentData.next_maintenance || null,
      performance_rating: equipmentData.performance_rating || 0,
      cost_per_use: equipmentData.cost_per_use || 0,
    };

    const { error } = await this.db.executeQuery(
      `
      INSERT INTO field_equipment (
        field_id, equipment_type, equipment_name, maintenance_schedule,
        last_maintenance, next_maintenance, performance_rating, cost_per_use
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      Object.values(equipmentRecord),
      {
        operation: "run",
        table: "field_equipment",
        context: { addEquipment: true, fieldId, userId },
      }
    );

    if (error) {
      throw new Error(`Equipment creation failed: ${error.message}`);
    }

    return { success: true };
  }

  // === PRIVATE HELPER METHODS ===

  async hasUserAccessToField(fieldId, userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 1 FROM fields f
      JOIN farm_members fm ON f.farm_id = fm.farm_id
      WHERE f.id = ? AND fm.user_id = ?
      LIMIT 1
    `,
      [fieldId, userId],
      {
        operation: "query",
        table: "fields",
        context: { hasUserAccessToField: true },
      }
    );

    return results.length > 0;
  }

  async checkFieldDependencies(fieldId) {
    // Check if field is referenced by other records
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        (SELECT COUNT(*) FROM crops WHERE field_id = ?) as crop_count,
        (SELECT COUNT(*) FROM soil_analysis WHERE field_id = ?) as soil_analysis_count,
        (SELECT COUNT(*) FROM field_equipment WHERE field_id = ?) as equipment_count,
        (SELECT COUNT(*) FROM field_usage_history WHERE field_id = ?) as usage_count
    `,
      [fieldId, fieldId, fieldId, fieldId],
      {
        operation: "query",
        table: "fields",
        context: { checkFieldDependencies: true },
      }
    );

    const deps = results[0];
    return {
      hasReferences: deps.crop_count > 0,
      crop_count: deps.crop_count,
      soil_analysis_count: deps.soil_analysis_count,
      equipment_count: deps.equipment_count,
      usage_count: deps.usage_count,
    };
  }

  generateDependencyMessage(dependencies) {
    const messages = [];

    if (dependencies.crop_count > 0) {
      messages.push(`${dependencies.crop_count} active crop(s)`);
    }
    if (dependencies.soil_analysis_count > 0) {
      messages.push(
        `${dependencies.soil_analysis_count} soil analysis record(s)`
      );
    }
    if (dependencies.equipment_count > 0) {
      messages.push(`${dependencies.equipment_count} equipment record(s)`);
    }
    if (dependencies.usage_count > 0) {
      messages.push(`${dependencies.usage_count} usage history record(s)`);
    }

    return `Cannot delete field with existing ${messages.join(
      ", "
    )}. Please remove them first.`;
  }

  async createInitialSoilAnalysis(fieldId) {
    try {
      await this.db.executeQuery(
        `
        INSERT INTO soil_analysis (field_id, analysis_date)
        VALUES (?, date('now'))
      `,
        [fieldId],
        {
          operation: "run",
          table: "soil_analysis",
          context: { createInitialSoilAnalysis: true, fieldId },
        }
      );
    } catch (error) {
      console.error("Failed to create initial soil analysis:", error);
      // Don't throw - this is not critical
    }
  }

  async logFieldOperation(operation, fieldId, data, userId) {
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
          `field.${operation}`,
          "fields",
          fieldId,
          data.before ? JSON.stringify(data.before) : null,
          data.after || data.created || JSON.stringify(data),
          new Date().toISOString(),
          "system",
          "FieldRepository",
        ],
        {
          operation: "run",
          table: "audit_logs",
          context: { logFieldOperation: true },
        }
      );
    } catch (error) {
      console.error("Failed to log field operation:", error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }
}
