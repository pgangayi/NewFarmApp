// Centralized Response Formatting for Farm Management System
// Provides consistent API response formats across all endpoints
// Date: November 7, 2025

import { createLogger } from './_logger.js';

const logger = createLogger(process.env.NODE_ENV || 'development');

/**
 * API Response Types
 */
export const RESPONSE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error',
  UNAUTHORIZED: 'unauthorized',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  RATE_LIMIT: 'rate_limit'
};

/**
 * Response metadata
 */
export class ResponseMetadata {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.requestId = null;
    this.processingTime = null;
    this.version = '1.0';
  }

  setRequestId(id) {
    this.requestId = id;
    return this;
  }

  setProcessingTime(milliseconds) {
    this.processingTime = milliseconds;
    return this;
  }

  setVersion(version) {
    this.version = version;
    return this;
  }
}

/**
 * Base Response Formatter
 */
export class BaseResponseFormatter {
  constructor() {
    this.metadata = new ResponseMetadata();
  }

  /**
   * Create standard success response
   */
  success(data, options = {}) {
    const {
      message = 'Operation completed successfully',
      status = 200,
      code = 'SUCCESS',
      pagination = null,
      metadata = {}
    } = options;

    const response = {
      type: RESPONSE_TYPES.SUCCESS,
      status,
      code,
      message,
      data,
      metadata: {
        ...this.metadata,
        ...metadata
      }
    };

    if (pagination) {
      response.pagination = pagination;
    }

    logger.info('API Success Response', {
      status,
      code,
      hasData: !!data,
      hasPagination: !!pagination
    });

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }

  /**
   * Create success response with creation confirmation
   */
  created(data, options = {}) {
    return this.success(data, {
      ...options,
      status: 201,
      code: 'CREATED',
      message: options.message || 'Resource created successfully'
    });
  }

  /**
   * Create success response with no content
   */
  noContent(options = {}) {
    const {
      message = 'Operation completed successfully',
      code = 'NO_CONTENT'
    } = options;

    logger.info('API No Content Response', { code, message });

    return new Response(JSON.stringify({
      type: RESPONSE_TYPES.SUCCESS,
      status: 204,
      code,
      message,
      metadata: this.metadata
    }), {
      status: 204,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create error response
   */
  error(error, options = {}) {
    const {
      status = 500,
      code = 'INTERNAL_ERROR',
      message = 'An error occurred',
      details = null,
      userMessage = null
    } = options;

    const response = {
      type: RESPONSE_TYPES.ERROR,
      status,
      code,
      message,
      error: {
        message: userMessage || message,
        details,
        type: error.name || 'Error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      metadata: this.metadata
    };

    logger.error('API Error Response', {
      status,
      code,
      message,
      errorType: error.name,
      hasDetails: !!details
    });

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create validation error response
   */
  validationError(errors, options = {}) {
    const {
      message = 'Validation failed',
      code = 'VALIDATION_ERROR',
      status = 400
    } = options;

    const response = {
      type: RESPONSE_TYPES.VALIDATION_ERROR,
      status,
      code,
      message,
      validation: {
        errors
      },
      metadata: this.metadata
    };

    logger.warn('API Validation Error Response', {
      status,
      code,
      errorCount: Object.keys(errors).length,
      errors
    });

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create unauthorized response
   */
  unauthorized(options = {}) {
    const {
      message = 'Authentication required',
      code = 'UNAUTHORIZED',
      details = null
    } = options;

    const response = {
      type: RESPONSE_TYPES.UNAUTHORIZED,
      status: 401,
      code,
      message,
      metadata: this.metadata
    };

    if (details) {
      response.error = { details };
    }

    logger.warn('API Unauthorized Response', { code, message });

    return new Response(JSON.stringify(response), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer'
      }
    });
  }

  /**
   * Create forbidden response
   */
  forbidden(options = {}) {
    const {
      message = 'Insufficient permissions',
      code = 'FORBIDDEN',
      details = null
    } = options;

    const response = {
      type: RESPONSE_TYPES.ERROR,
      status: 403,
      code,
      message,
      metadata: this.metadata
    };

    if (details) {
      response.error = { details };
    }

    logger.warn('API Forbidden Response', { code, message, details });

    return new Response(JSON.stringify(response), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create not found response
   */
  notFound(options = {}) {
    const {
      message = 'Resource not found',
      code = 'NOT_FOUND',
      resource = null
    } = options;

    const response = {
      type: RESPONSE_TYPES.NOT_FOUND,
      status: 404,
      code,
      message,
      metadata: this.metadata
    };

    if (resource) {
      response.resource = resource;
    }

    logger.warn('API Not Found Response', { code, message, resource });

    return new Response(JSON.stringify(response), {
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create conflict response
   */
  conflict(options = {}) {
    const {
      message = 'Resource conflict',
      code = 'CONFLICT',
      details = null,
      field = null
    } = options;

    const response = {
      type: RESPONSE_TYPES.CONFLICT,
      status: 409,
      code,
      message,
      metadata: this.metadata
    };

    if (details) {
      response.error = { details };
    }
    if (field) {
      response.field = field;
    }

    logger.warn('API Conflict Response', { code, message, field, details });

    return new Response(JSON.stringify(response), {
      status: 409,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create rate limit response
   */
  rateLimit(options = {}) {
    const {
      message = 'Rate limit exceeded',
      code = 'RATE_LIMIT',
      retryAfter = 60
    } = options;

    const response = {
      type: RESPONSE_TYPES.RATE_LIMIT,
      status: 429,
      code,
      message,
      retryAfter,
      metadata: this.metadata
    };

    logger.warn('API Rate Limit Response', { code, message, retryAfter });

    return new Response(JSON.stringify(response), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    });
  }

  /**
   * Create method not allowed response
   */
  methodNotAllowed(options = {}) {
    const {
      message = 'Method not allowed',
      code = 'METHOD_NOT_ALLOWED',
      allowedMethods = []
    } = options;

    const response = {
      type: RESPONSE_TYPES.ERROR,
      status: 405,
      code,
      message,
      metadata: this.metadata
    };

    if (allowedMethods.length > 0) {
      response.allowedMethods = allowedMethods;
    }

    logger.warn('API Method Not Allowed Response', { code, message, allowedMethods });

    return new Response(JSON.stringify(response), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': allowedMethods.join(', ')
      }
    });
  }

  /**
   * Set request metadata
   */
  setMetadata(metadata) {
    Object.assign(this.metadata, metadata);
    return this;
  }

  /**
   * Set processing time
   */
  setProcessingTime(milliseconds) {
    this.metadata.setProcessingTime(milliseconds);
    return this;
  }
}

/**
 * Specific Response Formatters
 */
export class FarmResponseFormatter extends BaseResponseFormatter {
  constructor() {
    super();
  }

  /**
   * Format farm list response
   */
  farmList(farms, options = {}) {
    return this.success(farms, {
      ...options,
      message: options.message || `Retrieved ${farms.length} farms`
    });
  }

  /**
   * Format farm details response
   */
  farmDetails(farm, options = {}) {
    return this.success(farm, {
      ...options,
      message: options.message || 'Farm details retrieved'
    });
  }

  /**
   * Format farm created response
   */
  farmCreated(farm, options = {}) {
    return this.created(farm, {
      ...options,
      message: options.message || 'Farm created successfully'
    });
  }

  /**
   * Format farm access denied response
   */
  farmAccessDenied(farmId) {
    return this.forbidden({
      message: 'Access denied to this farm',
      details: { farmId }
    });
  }
}

export class AnimalResponseFormatter extends BaseResponseFormatter {
  constructor() {
    super();
  }

  /**
   * Format animal list response
   */
  animalList(animals, pagination = null, options = {}) {
    return this.success(animals, {
      ...options,
      message: options.message || `Retrieved ${animals.length} animals`,
      pagination
    });
  }

  /**
   * Format animal details response
   */
  animalDetails(animal, options = {}) {
    return this.success(animal, {
      ...options,
      message: options.message || 'Animal details retrieved'
    });
  }

  /**
   * Format animal created response
   */
  animalCreated(animal, options = {}) {
    return this.created(animal, {
      ...options,
      message: options.message || 'Animal created successfully'
    });
  }
}

export class CropResponseFormatter extends BaseResponseFormatter {
  constructor() {
    super();
  }

  /**
   * Format crop list response
   */
  cropList(crops, options = {}) {
    return this.success(crops, {
      ...options,
      message: options.message || `Retrieved ${crops.length} crops`
    });
  }

  /**
   * Format crop details response
   */
  cropDetails(crop, options = {}) {
    return this.success(crop, {
      ...options,
      message: options.message || 'Crop details retrieved'
    });
  }

  /**
   * Format crop created response
   */
  cropCreated(crop, options = {}) {
    return this.created(crop, {
      ...options,
      message: options.message || 'Crop created successfully'
    });
  }
}

export class TaskResponseFormatter extends BaseResponseFormatter {
  constructor() {
    super();
  }

  /**
   * Format task list response
   */
  taskList(tasks, pagination = null, options = {}) {
    return this.success(tasks, {
      ...options,
      message: options.message || `Retrieved ${tasks.length} tasks`,
      pagination
    });
  }

  /**
   * Format task created response
   */
  taskCreated(task, options = {}) {
    return this.created(task, {
      ...options,
      message: options.message || 'Task created successfully'
    });
  }
}

/**
 * Response utilities
 */
export class ResponseUtils {
  /**
   * Create pagination metadata
   */
  static createPagination(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? parseInt(page) + 1 : null,
      prevPage: page > 1 ? parseInt(page) - 1 : null
    };
  }

  /**
   * Create sorting metadata
   */
  static createSorting(sortBy, sortDirection) {
    return {
      sortBy,
      sortDirection: sortDirection?.toUpperCase() || 'ASC',
      isSorted: !!sortBy
    };
  }

  /**
   * Create filtering metadata
   */
  static createFiltering(filters) {
    const activeFilters = Object.entries(filters)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));
    
    return {
      totalFilters: activeFilters.length,
      activeFilters
    };
  }

  /**
   * Create search metadata
   */
  static createSearch(search, hasResults = null) {
    return {
      search,
      hasQuery: !!search,
      hasResults
    };
  }

  /**
   * Format list response with metadata
   */
  static formatListResponse(items, options = {}) {
    const {
      page = 1,
      limit = 20,
      total = items.length,
      sortBy = null,
      sortDirection = 'ASC',
      filters = {},
      search = null,
      message = 'Items retrieved successfully'
    } = options;

    const response = {
      items,
      pagination: this.createPagination(page, limit, total),
      sorting: this.createSorting(sortBy, sortDirection),
      filtering: this.createFiltering(filters),
      search: this.createSearch(search)
    };

    return {
      data: response,
      metadata: {
        totalItems: total,
        returnedItems: items.length,
        hasMore: page * limit < total
      }
    };
  }

  /**
   * Create error details for common scenarios
   */
  static createErrorDetails(scenario) {
    const details = {
      database_connection: {
        code: 'DB_CONNECTION_ERROR',
        message: 'Database connection error',
        retryable: true
      },
      validation_failed: {
        code: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        retryable: false
      },
      not_found: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Requested resource not found',
        retryable: false
      },
      unauthorized: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        retryable: false
      },
      forbidden: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        retryable: false
      },
      rate_limited: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        retryable: true
      }
    };

    return details[scenario] || details.database_connection;
  }
}

/**
 * Response builder for complex responses
 */
export class ResponseBuilder {
  constructor() {
    this.response = {
      type: RESPONSE_TYPES.SUCCESS,
      status: 200,
      code: 'SUCCESS',
      message: '',
      data: null,
      metadata: new ResponseMetadata(),
      includes: {},
      links: {},
      errors: []
    };
  }

  /**
   * Set basic response properties
   */
  setType(type) {
    this.response.type = type;
    return this;
  }

  setStatus(status) {
    this.response.status = status;
    return this;
  }

  setCode(code) {
    this.response.code = code;
    return this;
  }

  setMessage(message) {
    this.response.message = message;
    return this;
  }

  setData(data) {
    this.response.data = data;
    return this;
  }

  /**
   * Add included data (for RESTful responses)
   */
  addInclude(key, data) {
    this.response.includes[key] = data;
    return this;
  }

  /**
   * Add HATEOAS links
   */
  addLink(rel, href, method = 'GET') {
    if (!this.response.links[rel]) {
      this.response.links[rel] = [];
    }
    this.response.links[rel].push({ href, method });
    return this;
  }

  /**
   * Add error
   */
  addError(error) {
    this.response.errors.push(error);
    return this;
  }

  /**
   * Build and return the response
   */
  build() {
    return this.response;
  }

  /**
   * Convert to HTTP Response
   */
  toHttpResponse() {
    return new Response(JSON.stringify(this.response), {
      status: this.response.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Export all response formatters and utilities
export default {
  RESPONSE_TYPES,
  ResponseMetadata,
  BaseResponseFormatter,
  FarmResponseFormatter,
  AnimalResponseFormatter,
  CropResponseFormatter,
  TaskResponseFormatter,
  ResponseUtils,
  ResponseBuilder
};