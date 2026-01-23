// Base API Controller with Common Functionality
// Eliminates duplicate code patterns across livestock and crops modules

import {
  AuthUtils,
  createUnauthorizedResponse,
} from "./_auth.js";
import { ErrorHandler, ResponseHandler } from "./_errors.js";
import { EnhancedAuditLogger } from "./_enhanced-audit.js";
import { RateLimiter } from "./_rate-limit.js";

export class BaseApiController {
  constructor(env, config = {}) {
    this.env = env;
    this.db = env.DB;
    this.config = {
      auditEnabled: true,
      rateLimitEnabled: true,
      defaultLimit: 20,
      maxLimit: 100,
      ...config,
    };

    // Initialize security components
    this.auth = new AuthUtils(env);
    this.audit = new EnhancedAuditLogger(env);
    this.rateLimiter = new RateLimiter(env);
    this.errorHandler = new ErrorHandler(env);
    this.responseHandler = new ResponseHandler(env);
  }

  /**
   * Standard API request handler with common security and auditing
   */
  async handleRequest(context, operationConfig = {}) {
    const { request } = context;
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    try {
      // Apply rate limiting
      if (this.config.rateLimitEnabled) {
        const rateLimitResponse = await this.applyRateLimit(
          request,
          pathname,
          method
        );
        if (rateLimitResponse) {
          await this.logSecurity(
            "security.rate_limit_exceeded",
            {
              endpoint: pathname,
              method,
              ip_address: this.extractIP(request),
            },
            { request }
          );
          return rateLimitResponse;
        }
      }

      // Authenticate user
      const user = await this.auth.getUserFromToken(request);
      if (!user) {
        await this.logAuth("auth.failure", null, request, {
          reason: "invalid_token",
        });
        return createUnauthorizedResponse();
      }

      // Audit the request
      if (this.config.auditEnabled) {
        await this.audit.log(
          "data.access",
          {
            endpoint: pathname,
            method,
            resource_type: operationConfig.resourceType,
          },
          {
            user,
            request,
            farmId: operationConfig.farmId,
          }
        );
      }

      return null; // Continue to specific handler
    } catch (error) {
      console.error(`${this.constructor.name} error:`, error);
      await this.audit.log(
        "system.error",
        {
          error_message: error.message,
          endpoint: pathname,
          method,
        },
        { user: null, request }
      );

      return this.errorHandler.internalError("Internal server error");
    }
  }

  /**
   * Standardized list query with common filtering and pagination
   */
  async handleListQuery(user, url, config) {
    const {
      page = 1,
      limit = this.config.defaultLimit,
      sort_by = "created_at",
      sort_order = "desc",
      search,
      ...filters
    } = Object.fromEntries(url.searchParams);

    // Validate and sanitize pagination
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(
      this.config.maxLimit,
      Math.max(1, parseInt(limit) || this.config.defaultLimit)
    );
    const validSortOrder = ["asc", "desc"].includes(sort_order.toLowerCase())
      ? sort_order.toLowerCase()
      : "desc";

    // Build base query with security filtering
    let query = this.buildBaseListQuery(config);
    const params = [user.id]; // Add user filter first

    // Add search functionality
    if (search) {
      const searchCondition = this.buildSearchCondition(search, config);
      if (searchCondition) {
        query += ` AND ${searchCondition}`;
        params.push(`%${search}%`, `%${search}%`);
      }
    }

    // Add filters
    const filterCondition = this.buildFilterCondition(filters, config);
    if (filterCondition) {
      query += ` AND ${filterCondition}`;
      params.push(...Object.values(filters).filter((v) => v != null));
    }

    // Add sorting
    const sortCondition = this.buildSortCondition(
      sort_by,
      validSortOrder,
      config
    );
    if (sortCondition) {
      query += ` ORDER BY ${sortCondition}`;
    } else {
      query += " ORDER BY created_at DESC";
    }

    // Add pagination
    const offset = (validPage - 1) * validLimit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(validLimit, offset);

    // Execute query with timeout
    const { results, error } = await this.executeQueryWithTimeout(
      query,
      params,
      5000
    );

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get total count for pagination
    const totalCount = await this.getTotalCount(user, filters, search, config);

    return {
      data: results || [],
      pagination: {
        page: validPage,
        limit: validLimit,
        total: totalCount,
        pages: Math.ceil(totalCount / validLimit),
      },
    };
  }

  /**
   * Standardized create operation with validation and audit
   */
  async handleCreate(user, requestBody, config, context = {}) {
    // Validate required fields
    const validationResult = this.validateCreateData(requestBody, config);
    if (!validationResult.isValid) {
      return this.errorHandler.validationError(validationResult.message);
    }

    // Check farm access if required
    if (config.requireFarmAccess && requestBody.farm_id) {
      const hasAccess = await this.auth.hasFarmAccess(
        user.id,
        requestBody.farm_id
      );
      if (!hasAccess) {
        await this.logAuth("authz.access_denied", user, context.request, {
          resource_type: config.resourceType,
          farm_id: requestBody.farm_id,
        });
        return this.errorHandler.authorizationError("Farm access denied");
      }
    }

    // Build and execute insert query
    const insertQuery = this.buildInsertQuery(requestBody, config);
    const { results, error } = await this.executeQueryWithTimeout(
      insertQuery.query,
      insertQuery.params,
      3000
    );

    if (error) {
      throw new Error(`Create failed: ${error.message}`);
    }

    const createdId = results.lastInsertRowId;

    // Get created record with full details
    const createdRecord = await this.getRecordById(createdId, config);

    // Audit the creation
    if (this.config.auditEnabled) {
      await this.audit.log(
        "data.create",
        {
          resource_type: config.resourceType,
          resource_id: createdId,
          outcome: "success",
          ...context,
        },
        {
          user,
          request: context.request,
          farmId: requestBody.farm_id,
        }
      );
    }

    return this.responseHandler.created(createdRecord);
  }

  /**
   * Standardized update operation with validation and audit
   */
  async handleUpdate(user, recordId, requestBody, config, context = {}) {
    // Validate record ID
    if (!recordId) {
      return this.errorHandler.badRequestError("Record ID required");
    }

    // Check if user has access to update this record
    const accessCheck = await this.checkUpdateAccess(user, recordId, config);
    if (!accessCheck.allowed) {
      await this.logAuth("authz.access_denied", user, context.request, {
        resource_type: config.resourceType,
        resource_id: recordId,
        reason: accessCheck.reason,
      });
      return this.errorHandler.authorizationError(accessCheck.message);
    }

    // Validate update data
    const validationResult = this.validateUpdateData(requestBody, config);
    if (!validationResult.isValid) {
      return this.errorHandler.validationError(validationResult.message);
    }

    // Build and execute update query
    const updateQuery = this.buildUpdateQuery(recordId, requestBody, config);
    const { error } = await this.executeQueryWithTimeout(
      updateQuery.query,
      updateQuery.params,
      3000
    );

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    // Get updated record
    const updatedRecord = await this.getRecordById(recordId, config);

    // Audit the update
    if (this.config.auditEnabled) {
      await this.audit.log(
        "data.update",
        {
          resource_type: config.resourceType,
          resource_id: recordId,
          outcome: "success",
          before_state: accessCheck.existingRecord,
          after_state: updatedRecord,
          ...context,
        },
        {
          user,
          request: context.request,
          farmId: updatedRecord.farm_id,
        }
      );
    }

    return this.responseHandler.createSuccessResponse(updatedRecord);
  }

  /**
   * Standardized delete operation with dependency checking and audit
   */
  async handleDelete(user, recordId, config, context = {}) {
    // Validate record ID
    if (!recordId) {
      return createErrorResponse("Record ID required", 400);
    }

    // Check if user has access to delete this record
    const accessCheck = await this.checkDeleteAccess(user, recordId, config);
    if (!accessCheck.allowed) {
      await this.logAuth("authz.access_denied", user, context.request, {
        resource_type: config.resourceType,
        resource_id: recordId,
        reason: accessCheck.reason,
      });
      return this.errorHandler.authorizationError(accessCheck.message);
    }

    // Check for dependencies
    const dependencyCheck = await this.checkDependencies(recordId, config);
    if (!dependencyCheck.allowed) {
      return this.errorHandler.badRequestError(dependencyCheck.message);
    }

    // Execute delete
    const { error } = await this.executeQueryWithTimeout(
      `DELETE FROM ${config.tableName} WHERE id = ?`,
      [recordId],
      3000
    );

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    // Audit the deletion
    if (this.config.auditEnabled) {
      await this.audit.log(
        "data.delete",
        {
          resource_type: config.resourceType,
          resource_id: recordId,
          outcome: "success",
          deleted_record: accessCheck.existingRecord,
          ...context,
        },
        {
          user,
          request: context.request,
          farmId: accessCheck.existingRecord?.farm_id,
        }
      );
    }

    return this.responseHandler.createSuccessResponse({ success: true });
  }

  // === ABSTRACT METHODS (to be implemented by subclasses) ===

  buildBaseListQuery(config) {
    throw new Error("Subclasses must implement buildBaseListQuery");
  }

  buildSearchCondition(search, config) {
    return null; // Optional for subclasses
  }

  buildFilterCondition(filters, config) {
    return null; // Optional for subclasses
  }

  buildSortCondition(sortBy, sortOrder, config) {
    return null; // Optional for subclasses
  }

  validateCreateData(data, config) {
    return { isValid: true, message: null };
  }

  validateUpdateData(data, config) {
    return { isValid: true, message: null };
  }

  buildInsertQuery(data, config) {
    throw new Error("Subclasses must implement buildInsertQuery");
  }

  buildUpdateQuery(id, data, config) {
    throw new Error("Subclasses must implement buildUpdateQuery");
  }

  checkUpdateAccess(user, id, config) {
    throw new Error("Subclasses must implement checkUpdateAccess");
  }

  checkDeleteAccess(user, id, config) {
    throw new Error("Subclasses must implement checkDeleteAccess");
  }

  checkDependencies(id, config) {
    return { allowed: true, message: null };
  }

  getRecordById(id, config) {
    throw new Error("Subclasses must implement getRecordById");
  }

  // === UTILITY METHODS ===

  async executeQueryWithTimeout(query, params, timeout = 5000) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeout)
    );

    const queryPromise = this.db
      .prepare(query)
      .bind(...params)
      .all();

    try {
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      console.error("Query execution error:", error);
      throw error;
    }
  }

  async getTotalCount(user, filters, search, config) {
    let query = this.buildBaseCountQuery(config);
    const params = [user.id];

    if (search) {
      const searchCondition = this.buildSearchCondition(search, config);
      if (searchCondition) {
        query += ` AND ${searchCondition}`;
        params.push(`%${search}%`, `%${search}%`);
      }
    }

    const filterCondition = this.buildFilterCondition(filters, config);
    if (filterCondition) {
      query += ` AND ${filterCondition}`;
      params.push(...Object.values(filters).filter((v) => v != null));
    }

    const { results } = await this.db
      .prepare(query)
      .bind(...params)
      .all();
    return results[0]?.count || 0;
  }

  buildBaseCountQuery(config) {
    return `SELECT COUNT(*) as count FROM ${config.tableName} WHERE 1=1`;
  }

  async applyRateLimit(request, endpoint, method) {
    const identifier = await this.rateLimiter.getIdentifier(request);
    const check = await this.rateLimiter.checkLimit(
      identifier,
      endpoint,
      method
    );

    if (!check.allowed) {
      return this.rateLimiter.createRateLimitResponse(
        check.remaining,
        check.resetTime,
        check.limit
      );
    }

    return null;
  }

  extractIP(request) {
    return (
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"
    );
  }

  async logAuth(event, user, request, additional = {}) {
    if (this.config.auditEnabled) {
      await this.audit.logAuth(event, user, request, additional);
    }
  }

  async logSecurity(event, details, context = {}) {
    if (this.config.auditEnabled) {
      await this.audit.logSecurity(event, details, context);
    }
  }
}
