// Farms API - Migrated to DatabaseOperations
// Date: November 13, 2025
// Updated: January 1, 2026 - Fixed farms loading issue

import {
  AuthUtils,
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "./_auth.js";
import {
  DatabaseOperations,
  FarmRepository,
  DB_ERROR_CODES,
} from "./_database.js";

// Security Constants
const RATE_LIMITS = {
  GET: 1000, // requests per hour
  POST: 100, // farm creations per hour
  PUT: 500, // updates per hour
  DELETE: 50, // deletions per hour
};

const ALLOWED_FARM_TYPES = ["organic", "conventional", "sustainable", "mixed"];
const ALLOWED_CERTIFICATION_STATUS = [
  "certified",
  "in_progress",
  "pending",
  "none",
];
const ALLOWED_ENVIRONMENTAL_COMPLIANCE = [
  "compliant",
  "in_progress",
  "non_compliant",
];

// Validation Utilities
const ValidationUtils = {
  // Comprehensive numeric validation
  validateNumeric(value, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
    if (value === null || value === undefined) return null;

    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) {
      throw new Error(`Invalid ${name}: must be a valid number`);
    }

    if (num < min || num > max) {
      throw new Error(`Invalid ${name}: must be between ${min} and ${max}`);
    }

    return num;
  },

  // Date validation
  validateDate(dateString, name) {
    if (!dateString) return null;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ${name}: must be a valid date`);
    }

    // Check if date is in reasonable range (not too far in past or future)
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 50, 0, 1); // 50 years ago
    const maxDate = new Date(now.getFullYear() + 10, 11, 31); // 10 years in future

    if (date < minDate || date > maxDate) {
      throw new Error(
        `Invalid ${name}: date must be between ${
          minDate.toISOString().split("T")[0]
        } and ${maxDate.toISOString().split("T")[0]}`
      );
    }

    return date.toISOString().split("T")[0];
  },

  // String validation with length limits and sanitization
  validateString(value, name, minLength = 0, maxLength = 1000) {
    if (!value || typeof value !== "string") {
      throw new Error(`Invalid ${name}: must be a non-empty string`);
    }

    const trimmed = value.trim();
    if (trimmed.length < minLength || trimmed.length > maxLength) {
      throw new Error(
        `Invalid ${name}: length must be between ${minLength} and ${maxLength}`
      );
    }

    // Basic XSS sanitization
    return trimmed.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  },

  // Enum validation
  validateEnum(value, name, allowedValues) {
    if (value === null || value === undefined) return null;
    if (!allowedValues.includes(value)) {
      throw new Error(
        `Invalid ${name}: must be one of [${allowedValues.join(", ")}]`
      );
    }
    return value;
  },

  // Comprehensive farm data validation
  validateFarmData(data) {
    const validated = {};

    // Required fields
    validated.name = this.validateString(data.name, "name", 1, 255);
    validated.location = this.validateString(data.location, "location", 1, 255);

    // Optional fields with validation
    if (data.area_hectares !== undefined) {
      validated.area_hectares = this.validateNumeric(
        data.area_hectares,
        "area_hectares",
        0,
        100000
      );
    }

    if (data.farm_type !== undefined) {
      validated.farm_type = this.validateEnum(
        data.farm_type,
        "farm_type",
        ALLOWED_FARM_TYPES
      );
    }

    if (data.certification_status !== undefined) {
      validated.certification_status = this.validateEnum(
        data.certification_status,
        "certification_status",
        ALLOWED_CERTIFICATION_STATUS
      );
    }

    if (data.environmental_compliance !== undefined) {
      validated.environmental_compliance = this.validateEnum(
        data.environmental_compliance,
        "environmental_compliance",
        ALLOWED_ENVIRONMENTAL_COMPLIANCE
      );
    }

    if (data.total_acres !== undefined) {
      validated.total_acres = this.validateNumeric(
        data.total_acres,
        "total_acres",
        0,
        247000
      );
    }

    if (data.operational_start_date !== undefined) {
      validated.operational_start_date = this.validateDate(
        data.operational_start_date,
        "operational_start_date"
      );
    }

    if (data.management_structure !== undefined) {
      validated.management_structure = this.validateString(
        data.management_structure,
        "management_structure",
        0,
        1000
      );
    }

    if (data.seasonal_staff !== undefined) {
      validated.seasonal_staff = this.validateNumeric(
        data.seasonal_staff,
        "seasonal_staff",
        0,
        10000
      );
    }

    if (data.annual_budget !== undefined) {
      validated.annual_budget = this.validateNumeric(
        data.annual_budget,
        "annual_budget",
        0,
        1000000000
      );
    }

    return validated;
  },
};

// CSRF Protection
const CSRFProtection = {
  async validateToken(request) {
    const method = request.method;

    // Only validate CSRF for state-changing operations
    if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      return true;
    }

    const csrfToken = request.headers.get("X-CSRF-Token");
    const sessionToken = request.headers.get("X-Session-Token");

    if (!csrfToken || !sessionToken) {
      throw new Error("CSRF protection: missing tokens");
    }

    // In a real implementation, validate tokens against session storage
    // This is a simplified version
    if (csrfToken.length < 32 || sessionToken.length < 32) {
      throw new Error("CSRF protection: invalid token format");
    }

    return true;
  },
};

// Rate Limiting (simplified implementation)
const RateLimiter = {
  async checkLimit(userId, operation, limit) {
    // In a real implementation, this would check Redis or similar
    // For now, we'll just validate the operation exists
    if (!limit) {
      throw new Error("Rate limit exceeded");
    }
    return true;
  },
};

// Error Sanitization
const SecureLogger = {
  logError(operation, error, context = {}) {
    // Sanitize error message - never expose sensitive information
    const sanitizedError = {
      operation,
      message: "An error occurred", // Generic message
      timestamp: new Date().toISOString(),
      // Only log non-sensitive context
      ...(context.userId && { userId: context.userId.substring(0, 8) + "..." }), // Partial user ID
    };

    console.error("Secure API Error:", sanitizedError);
  },
};

// Audit Logging
const AuditLogger = {
  async logAction(userId, action, farmId, details = {}) {
    const auditEntry = {
      user_id: userId,
      action,
      resource_type: "farm",
      resource_id: farmId,
      timestamp: new Date().toISOString(),
      details: JSON.stringify(details),
      ip_address: "logged_separately", // Would be captured at request level
      user_agent: "logged_separately", // Would be captured at request level
    };

    try {
      // In a real implementation, this would insert into audit_logs table
      console.log("Audit Log:", auditEntry);
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error("Audit logging failed:", error);
    }
  },
};

// Transaction Management
const TransactionManager = {
  async executeWithTransaction(env, operations) {
    try {
      await env.DB.exec("BEGIN TRANSACTION");

      const results = [];
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }

      await env.DB.exec("COMMIT");
      return results;
    } catch (error) {
      await env.DB.exec("ROLLBACK");
      throw error;
    }
  },
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    // Initialize AuthUtils and DatabaseOperations
    const auth = new AuthUtils(env);
    const db = new DatabaseOperations(env);
    const farmRepo = new FarmRepository(db);

    // Get user from token
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Route to appropriate handler
    if (method === "GET") {
      return await handleGetFarms(request, url, user, auth, farmRepo);
    } else if (method === "POST") {
      return await handleCreateFarm(request, user, auth, farmRepo);
    } else if (method === "PUT") {
      return await handleUpdateFarm(request, user, auth, farmRepo);
    } else if (method === "DELETE") {
      return await handleDeleteFarm(request, url, user, auth, farmRepo);
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    console.error("Farms API error:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// GET handler using FarmRepository
async function handleGetFarms(request, url, user, auth, farmRepo) {
  const farmId = url.searchParams.get("id");
  const stats = url.searchParams.get("stats");
  const operations = url.searchParams.get("operations");
  const analytics = url.searchParams.get("analytics");

  // Pagination parameters
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") || "50"))
  );
  const offset = (page - 1) * limit;

  try {
    if (farmId) {
      // Check access BEFORE querying database
      if (!(await auth.hasFarmAccess(user.id, farmId))) {
        return createErrorResponse("Access denied", 403);
      }

      // Get specific farm with statistics using repository
      const farm = await farmRepo.findWithStats(farmId, { userId: user.id });

      if (!farm) {
        return createErrorResponse("Farm not found", 404);
      }

      // Get farm statistics if requested
      if (stats === "true") {
        const statistics = await farmRepo.db.findMany(
          "farm_statistics",
          { farm_id: farmId },
          {
            orderBy: "report_date",
            orderDirection: "DESC",
            limit: 12,
            userId: user.id,
          }
        );
        farm.statistics = statistics;
      }

      // Get recent farm operations if requested
      if (operations === "true") {
        const operations = await farmRepo.db.findMany(
          "farm_operations",
          { farm_id: farmId },
          {
            orderBy: "operation_date",
            orderDirection: "DESC",
            limit: 50,
            userId: user.id,
          }
        );
        farm.operations = operations;
      }

      return createSuccessResponse(farm);
    } else if (analytics === "true") {
      // Get farms with analytics data using repository
      // findByOwner already includes animal_count, field_count, and pending_tasks
      const farms = await farmRepo.findByOwner(user.id, {
        orderBy: "created_at",
        orderDirection: "DESC",
        limit,
        offset,
        userId: user.id,
      });

      return createSuccessResponse(farms);
    } else {
      // Standard farms list using repository
      // Use findByUser to get all farms the user has access to (owned + member)
      const farms = await farmRepo.findByUser(user.id, {
        orderBy: "created_at",
        orderDirection: "DESC",
        limit,
        offset,
        userId: user.id,
      });

      return createSuccessResponse(farms || []);
    }
  } catch (error) {
    console.error("Error in handleGetFarms:", error);
    return createErrorResponse("Database error", 500);
  }
}

// POST handler using FarmRepository
async function handleCreateFarm(request, user, auth, farmRepo) {
  const body = await request.json();

  // Comprehensive validation
  let validatedData;
  try {
    validatedData = ValidationUtils.validateFarmData(body);
  } catch (error) {
    return createErrorResponse(`Validation error: ${error.message}`, 400);
  }

  // Create farm using repository
  try {
    const newFarm = await farmRepo.create(
      {
        ...validatedData,
        owner_id: user.id,
      },
      { userId: user.id }
    );

    // Note: Owner access is already granted within farmRepo.create via farm_members table

    // Create initial farm statistics record
    await farmRepo.db.create(
      "farm_statistics",
      {
        farm_id: newFarm.id,
        report_date: new Date().toISOString().split("T")[0],
      },
      { userId: user.id, auditLog: false }
    );

    return createSuccessResponse(newFarm);
  } catch (error) {
    console.error("Error in handleCreateFarm:", error);
    return createErrorResponse("Failed to create farm", 500);
  }
}

// PUT handler using FarmRepository
async function handleUpdateFarm(request, user, auth, farmRepo) {
  const body = await request.json();
  const { id: farmId, ...updateData } = body;

  if (!farmId) {
    return createErrorResponse("Farm ID required", 400);
  }

  // Check access BEFORE querying database
  if (!(await auth.hasFarmAccess(user.id, farmId))) {
    return createErrorResponse("Access denied", 403);
  }

  // Validate update data
  let validatedData;
  try {
    validatedData = ValidationUtils.validateFarmData(updateData);
  } catch (error) {
    return createErrorResponse(`Validation error: ${error.message}`, 400);
  }

  if (Object.keys(validatedData).length === 0) {
    return createErrorResponse("No fields to update", 400);
  }

  try {
    // Update farm using repository
    const result = await farmRepo.updateById(farmId, validatedData, {
      userId: user.id,
    });

    // Get updated farm with statistics
    const updatedFarm = await farmRepo.findWithStats(farmId, {
      userId: user.id,
    });

    return createSuccessResponse(updatedFarm);
  } catch (error) {
    console.error("Error in handleUpdateFarm:", error);
    return createErrorResponse("Failed to update farm", 500);
  }
}

// DELETE handler using FarmRepository
async function handleDeleteFarm(request, url, user, auth, farmRepo) {
  const farmId = url.searchParams.get("id");

  if (!farmId) {
    return createErrorResponse("Farm ID required", 400);
  }

  // Check access BEFORE querying database
  if (!(await auth.hasFarmAccess(user.id, farmId))) {
    return createErrorResponse("Access denied", 403);
  }

  try {
    // Check for dependencies using repository
    const dependencies = await farmRepo.db.checkDependencies("farms", farmId);

    const hasDependencies = Object.entries(dependencies).some(
      ([table, count]) => {
        if (count === -1) return false; // Check failed, don't block
        return count > 0;
      }
    );

    if (hasDependencies) {
      return createErrorResponse(
        "Cannot delete farm with existing data. Please archive instead.",
        400
      );
    }

    // Perform deletion using repository
    await farmRepo.deleteById(farmId, { userId: user.id });

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error("Error in handleDeleteFarm:", error);
    return createErrorResponse("Failed to delete farm", 500);
  }
}

// Farm Statistics Management - Secure Version
export async function onRequestStats(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Rate limiting
    await RateLimiter.checkLimit(user.id, method, RATE_LIMITS[method] || 500);

    // CSRF protection
    await CSRFProtection.validateToken(request);

    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const period = url.searchParams.get("period") || "12months";

      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }

      // Check access before querying
      if (!(await auth.hasFarmAccess(user.id, farmId))) {
        return createErrorResponse("Access denied", 403);
      }

      // Secure parameter validation - NO SQL injection
      const validPeriods = ["6months", "12months", "24months"];
      const limit = validPeriods.includes(period)
        ? period === "6months"
          ? 6
          : period === "24months"
          ? 24
          : 12
        : 12;

      const { results, error } = await env.DB.prepare(
        `
        SELECT 
          id, farm_id, report_date, total_animals, total_acres_under_cultivation,
          annual_revenue, total_operational_cost, profit_margin, employee_count,
          productivity_score, sustainability_score, created_at, updated_at
        FROM farm_statistics 
        WHERE farm_id = ? 
        ORDER BY report_date DESC 
        LIMIT ?
      `
      )
        .bind(farmId, limit)
        .all();

      if (error) {
        SecureLogger.logError("stats_query", error, {
          userId: user.id,
          farmId,
        });
        return createErrorResponse("Database error", 500);
      }

      await AuditLogger.logAction(user.id, "view_farm_statistics", farmId, {
        details: { period, count: results?.length || 0 },
      });

      return createSuccessResponse(results);
    } else if (method === "POST") {
      const body = await request.json();
      const { farm_id, ...statsData } = body;

      if (!farm_id) {
        return createErrorResponse("Farm ID required", 400);
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Access denied", 403);
      }

      // Validate statistics data
      const validatedStats = {};
      try {
        if (statsData.report_date !== undefined) {
          validatedStats.report_date = ValidationUtils.validateDate(
            statsData.report_date,
            "report_date"
          );
        }
        if (statsData.total_animals !== undefined) {
          validatedStats.total_animals = ValidationUtils.validateNumeric(
            statsData.total_animals,
            "total_animals",
            0,
            100000
          );
        }
        if (statsData.total_acres_under_cultivation !== undefined) {
          validatedStats.total_acres_under_cultivation =
            ValidationUtils.validateNumeric(
              statsData.total_acres_under_cultivation,
              "total_acres_under_cultivation",
              0,
              1000000
            );
        }
        if (statsData.annual_revenue !== undefined) {
          validatedStats.annual_revenue = ValidationUtils.validateNumeric(
            statsData.annual_revenue,
            "annual_revenue",
            0,
            1000000000
          );
        }
        if (statsData.total_operational_cost !== undefined) {
          validatedStats.total_operational_cost =
            ValidationUtils.validateNumeric(
              statsData.total_operational_cost,
              "total_operational_cost",
              0,
              1000000000
            );
        }
        if (statsData.profit_margin !== undefined) {
          validatedStats.profit_margin = ValidationUtils.validateNumeric(
            statsData.profit_margin,
            "profit_margin",
            -100,
            100
          );
        }
        if (statsData.employee_count !== undefined) {
          validatedStats.employee_count = ValidationUtils.validateNumeric(
            statsData.employee_count,
            "employee_count",
            0,
            10000
          );
        }
        if (statsData.productivity_score !== undefined) {
          validatedStats.productivity_score = ValidationUtils.validateNumeric(
            statsData.productivity_score,
            "productivity_score",
            0,
            100
          );
        }
        if (statsData.sustainability_score !== undefined) {
          validatedStats.sustainability_score = ValidationUtils.validateNumeric(
            statsData.sustainability_score,
            "sustainability_score",
            0,
            100
          );
        }
      } catch (error) {
        return createErrorResponse(`Validation error: ${error.message}`, 400);
      }

      const { error } = await env.DB.prepare(
        `
        INSERT INTO farm_statistics (
          farm_id, report_date, total_animals, total_acres_under_cultivation,
          annual_revenue, total_operational_cost, profit_margin, employee_count,
          productivity_score, sustainability_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          farm_id,
          validatedStats.report_date || new Date().toISOString().split("T")[0],
          validatedStats.total_animals || 0,
          validatedStats.total_acres_under_cultivation || 0,
          validatedStats.annual_revenue || 0,
          validatedStats.total_operational_cost || 0,
          validatedStats.profit_margin || 0,
          validatedStats.employee_count || 0,
          validatedStats.productivity_score || 0,
          validatedStats.sustainability_score || 0
        )
        .run();

      if (error) {
        SecureLogger.logError("stats_insert", error, {
          userId: user.id,
          farmId: farm_id,
        });
        return createErrorResponse("Failed to create statistics", 500);
      }

      await AuditLogger.logAction(user.id, "create_farm_statistics", farm_id, {
        details: { fields_updated: Object.keys(validatedStats) },
      });

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    SecureLogger.logError("stats_api", error);
    return createErrorResponse("Internal server error", 500);
  }
}

// Farm Operations Management - Secure Version
export async function onRequestOperations(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    const auth = new AuthUtils(env);
    const user = await auth.getUserFromToken(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    // Rate limiting
    await RateLimiter.checkLimit(user.id, method, RATE_LIMITS[method] || 500);

    // CSRF protection
    await CSRFProtection.validateToken(request);

    if (method === "GET") {
      const farmId = url.searchParams.get("farm_id");
      const operationType = url.searchParams.get("type");
      const limit = Math.min(
        100,
        Math.max(1, parseInt(url.searchParams.get("limit") || "50"))
      );

      if (!farmId) {
        return createErrorResponse("Farm ID required", 400);
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farmId))) {
        return createErrorResponse("Access denied", 403);
      }

      // Build query with explicit parameterization - NO SQL injection
      let query = `
        SELECT 
          id, farm_id, operation_type, operation_date, description, cost,
          revenue, staff_involved, success_rating, environmental_impact, created_at
        FROM farm_operations 
        WHERE farm_id = ?
      `;
      const params = [farmId];

      if (operationType) {
        query += " AND operation_type = ?";
        params.push(operationType);
      }

      query += " ORDER BY operation_date DESC LIMIT ?";
      params.push(limit);

      const { results, error } = await env.DB.prepare(query)
        .bind(...params)
        .all();

      if (error) {
        SecureLogger.logError("operations_query", error, {
          userId: user.id,
          farmId,
        });
        return createErrorResponse("Database error", 500);
      }

      await AuditLogger.logAction(user.id, "view_farm_operations", farmId, {
        details: { operation_type: operationType, count: results?.length || 0 },
      });

      return createSuccessResponse(results);
    } else if (method === "POST") {
      const body = await request.json();
      const { farm_id, ...operationData } = body;

      if (!farm_id) {
        return createErrorResponse("Farm ID required", 400);
      }

      // Check access
      if (!(await auth.hasFarmAccess(user.id, farm_id))) {
        return createErrorResponse("Access denied", 403);
      }

      // Validate operation data
      const validatedOperation = {};
      try {
        if (operationData.operation_type !== undefined) {
          validatedOperation.operation_type = ValidationUtils.validateString(
            operationData.operation_type,
            "operation_type",
            1,
            100
          );
        }
        if (operationData.operation_date !== undefined) {
          validatedOperation.operation_date = ValidationUtils.validateDate(
            operationData.operation_date,
            "operation_date"
          );
        }
        if (operationData.description !== undefined) {
          validatedOperation.description = ValidationUtils.validateString(
            operationData.description,
            "description",
            0,
            2000
          );
        }
        if (operationData.cost !== undefined) {
          validatedOperation.cost = ValidationUtils.validateNumeric(
            operationData.cost,
            "cost",
            0,
            100000000
          );
        }
        if (operationData.revenue !== undefined) {
          validatedOperation.revenue = ValidationUtils.validateNumeric(
            operationData.revenue,
            "revenue",
            0,
            100000000
          );
        }
        if (operationData.staff_involved !== undefined) {
          validatedOperation.staff_involved = ValidationUtils.validateString(
            operationData.staff_involved,
            "staff_involved",
            0,
            500
          );
        }
        if (operationData.success_rating !== undefined) {
          validatedOperation.success_rating = ValidationUtils.validateNumeric(
            operationData.success_rating,
            "success_rating",
            0,
            10
          );
        }
        if (operationData.environmental_impact !== undefined) {
          validatedOperation.environmental_impact =
            ValidationUtils.validateString(
              operationData.environmental_impact,
              "environmental_impact",
              0,
              1000
            );
        }
      } catch (error) {
        return createErrorResponse(`Validation error: ${error.message}`, 400);
      }

      const { error } = await env.DB.prepare(
        `
        INSERT INTO farm_operations (
          farm_id, operation_type, operation_date, description,
          cost, revenue, staff_involved, success_rating, environmental_impact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          farm_id,
          validatedOperation.operation_type || "general",
          validatedOperation.operation_date ||
            new Date().toISOString().split("T")[0],
          validatedOperation.description || "",
          validatedOperation.cost || 0,
          validatedOperation.revenue || 0,
          validatedOperation.staff_involved || "",
          validatedOperation.success_rating || 0,
          validatedOperation.environmental_impact || ""
        )
        .run();

      if (error) {
        SecureLogger.logError("operation_insert", error, {
          userId: user.id,
          farmId: farm_id,
        });
        return createErrorResponse("Failed to create operation", 500);
      }

      await AuditLogger.logAction(user.id, "create_farm_operation", farm_id, {
        details: { operation_type: validatedOperation.operation_type },
      });

      return createSuccessResponse({ success: true });
    } else {
      return createErrorResponse("Method not allowed", 405);
    }
  } catch (error) {
    SecureLogger.logError("operations_api", error);
    return createErrorResponse("Internal server error", 500);
  }
}
