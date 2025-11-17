/**
 * Enhanced Fields API - Comprehensive Field Management
 * Phase 5: Repository Pattern Migration
 *
 * DEPRECATION NOTICE: This endpoint has been migrated to use the FieldRepository pattern
 * for enhanced security, performance, and audit capabilities.
 *
 * Migration Date: November 13, 2025
 * Status: Legacy - Redirecting to FieldRepository-based implementation
 *
 * This file maintains backward compatibility while redirecting to the new implementation.
 * It will be removed in the next major version.
 */

import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import { FieldRepository } from "./repositories/index.js";
import { DatabaseOperations } from "./_database.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Initialize AuthUtils
    const auth = new AuthUtils(env);

    // Get user from token
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Initialize repository with DatabaseOperations
    const dbOps = new DatabaseOperations(env);
    const fieldRepository = new FieldRepository(dbOps);

    // Enhanced fields listing with analytics
    if (method === "GET") {
      const fieldId = url.searchParams.get("id");
      const farmId = url.searchParams.get("farm_id");
      const analytics = url.searchParams.get("analytics");
      const soil = url.searchParams.get("soil");
      const equipment = url.searchParams.get("equipment");
      const usage = url.searchParams.get("usage");

      if (fieldId) {
        // Get specific field with comprehensive data using FieldRepository
        const includeSoil = soil === "true";
        const includeEquipment = equipment === "true";
        const includeUsage = usage === "true";

        const field = await fieldRepository.findByIdWithDetails(
          fieldId,
          user.id,
          includeSoil,
          includeEquipment,
          includeUsage
        );

        if (!field) {
          return createErrorResponse("Field not found or access denied", 404);
        }

        return createSuccessResponse(field);
      } else if (analytics === "true") {
        // Get fields with analytics data using FieldRepository
        const filters = {};
        if (farmId) {
          filters.farm_id = farmId;
        }
        const options = {
          sortBy: "created_at",
          sortDirection: "DESC",
        };

        const fields = await fieldRepository.findByUserAccess(
          user.id,
          filters,
          options
        );

        return createSuccessResponse(fields || []);
      } else {
        // Standard fields list with enhanced data using FieldRepository
        const filters = {};
        if (farmId) {
          filters.farm_id = farmId;
        }
        const options = {
          sortBy: "created_at",
          sortDirection: "DESC",
          page: parseInt(url.searchParams.get("page") || "1"),
          limit: parseInt(url.searchParams.get("limit") || "100"),
        };

        const fields = await fieldRepository.findByUserAccess(
          user.id,
          filters,
          options
        );

        return createSuccessResponse(fields || []);
      }
    } else if (method === "POST") {
      // Create field with enhanced data using FieldRepository
      const body = await request.json();
      const {
        farm_id,
        name,
        area_hectares,
        crop_type,
        notes,
        soil_type,
        field_capacity,
        current_cover_crop,
        irrigation_system,
        drainage_quality,
        accessibility_score,
        environmental_factors,
        maintenance_schedule,
      } = body;

      if (!farm_id || !name) {
        return createErrorResponse("Farm ID and name required", 400);
      }

      const fieldData = {
        farm_id,
        name,
        area_hectares,
        crop_type,
        notes,
        soil_type,
        field_capacity,
        current_cover_crop,
        irrigation_system,
        drainage_quality,
        accessibility_score,
        environmental_factors,
        maintenance_schedule,
      };

      const newField = await fieldRepository.createField(fieldData, user.id);

      return createSuccessResponse(newField);
    } else if (method === "PUT") {
      // Update field with enhanced data using FieldRepository
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) {
        return createErrorResponse("Field ID required", 400);
      }

      const updatedField = await fieldRepository.updateField(
        id,
        updateData,
        user.id
      );

      return createSuccessResponse(updatedField);
    } else if (method === "DELETE") {
      // Enhanced delete with dependencies check using FieldRepository
      const fieldId = url.searchParams.get("id");

      if (!fieldId) {
        return createErrorResponse("Field ID required", 400);
      }

      const result = await fieldRepository.deleteField(fieldId, user.id);

      return createSuccessResponse(result);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Enhanced Field API error:", error);

    // Handle specific FieldRepository errors
    if (error.message.includes("Farm not found or access denied")) {
      return createErrorResponse("Farm not found or access denied", 404);
    }

    if (error.message.includes("Field not found")) {
      return createErrorResponse("Field not found or access denied", 404);
    }

    if (error.message.includes("Cannot delete field with existing")) {
      return createErrorResponse(error.message, 400);
    }

    if (error.message.includes("Area must be a positive number")) {
      return createErrorResponse("Area must be a positive number", 400);
    }

    if (error.message.includes("Drainage quality must be")) {
      return createErrorResponse(error.message, 400);
    }

    if (error.message.includes("Accessibility score must be")) {
      return createErrorResponse(error.message, 400);
    }

    return createErrorResponse("Internal server error", 500);
  }
}

// Soil Analysis Management
export async function onRequestSoilAnalysis(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === "GET") {
      const fieldId = url.searchParams.get("field_id");
      const limit = url.searchParams.get("limit") || "10";

      if (!fieldId) {
        return createErrorResponse("Field ID required", 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(
        `
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `
      )
        .bind(fieldId, user.id)
        .all();

      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }

      const { results, error } = await env.DB.prepare(
        `
        SELECT * FROM soil_analysis 
        WHERE field_id = ? 
        ORDER BY analysis_date DESC 
        LIMIT ?
      `
      )
        .bind(fieldId, parseInt(limit))
        .all();

      if (error) {
        console.error("Soil analysis error:", error);
        return createErrorResponse("Database error", 500);
      }

      return createSuccessResponse(results);
    } else if (method === "POST") {
      const body = await request.json();
      const { field_id, ...analysisData } = body;

      if (!field_id) {
        return createErrorResponse("Field ID required", 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(
        `
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `
      )
        .bind(field_id, user.id)
        .all();

      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }

      const { error } = await env.DB.prepare(
        `
        INSERT INTO soil_analysis (
          field_id, analysis_date, ph_level, nitrogen_content, phosphorus_content,
          potassium_content, organic_matter, soil_moisture, temperature, salinity, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          field_id,
          analysisData.analysis_date || new Date().toISOString().split("T")[0],
          analysisData.ph_level || 0,
          analysisData.nitrogen_content || 0,
          analysisData.phosphorus_content || 0,
          analysisData.potassium_content || 0,
          analysisData.organic_matter || 0,
          analysisData.soil_moisture || 0,
          analysisData.temperature || 0,
          analysisData.salinity || 0,
          analysisData.recommendations || ""
        )
        .run();

      if (error) {
        console.error("Soil analysis insert error:", error);
        return createErrorResponse("Failed to create soil analysis", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Soil analysis API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Equipment Management
export async function onRequestEquipment(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (method === "GET") {
      const fieldId = url.searchParams.get("field_id");

      if (!fieldId) {
        return createErrorResponse("Field ID required", 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(
        `
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `
      )
        .bind(fieldId, user.id)
        .all();

      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }

      const { results, error } = await env.DB.prepare(
        `
        SELECT * FROM field_equipment 
        WHERE field_id = ? 
        ORDER BY equipment_type, equipment_name
      `
      )
        .bind(fieldId)
        .all();

      if (error) {
        console.error("Equipment error:", error);
        return createErrorResponse("Database error", 500);
      }

      return createSuccessResponse(results);
    } else if (method === "POST") {
      const body = await request.json();
      const { field_id, ...equipmentData } = body;

      if (!field_id) {
        return createErrorResponse("Field ID required", 400);
      }

      // Check access
      const { results: accessCheck } = await env.DB.prepare(
        `
        SELECT f.farm_id 
        FROM fields f
        JOIN farm_members fm ON f.farm_id = fm.farm_id
        WHERE f.id = ? AND fm.user_id = ?
      `
      )
        .bind(field_id, user.id)
        .all();

      if (accessCheck.length === 0) {
        return createErrorResponse("Access denied", 403);
      }

      const { error } = await env.DB.prepare(
        `
        INSERT INTO field_equipment (
          field_id, equipment_type, equipment_name, maintenance_schedule,
          last_maintenance, next_maintenance, performance_rating, cost_per_use
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          field_id,
          equipmentData.equipment_type,
          equipmentData.equipment_name || "",
          equipmentData.maintenance_schedule || "",
          equipmentData.last_maintenance || null,
          equipmentData.next_maintenance || null,
          equipmentData.performance_rating || 0,
          equipmentData.cost_per_use || 0
        )
        .run();

      if (error) {
        console.error("Equipment insert error:", error);
        return createErrorResponse("Failed to create equipment", 500);
      }

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Equipment API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}
