// Refactored Farms API using Centralized Functions
// Demonstrates improved maintainability and bug identification
// Date: November 7, 2025

import { DatabaseOperations } from './_database.js';
import { FarmRepository } from './_repositories.js';
import { AccessControlManager } from './_access-control.js';
import { ValidationUtils } from './_validation.js';
import { FarmResponseFormatter } from './_response-formatter.js';
import { handleError } from './_errors.js';
import { createLogger } from './_logger.js';

const logger = createLogger(process.env.NODE_ENV || 'development');

/**
 * Enhanced Farms API using Centralized Functions
 */
export async function onRequest(context) {
  const { request, env } = context;
  const startTime = Date.now();
  const url = new URL(request.url);
  const method = request.method;

  // Initialize centralized services
  const db = new DatabaseOperations(env);
  const farmRepo = new FarmRepository(db);
  const accessControl = new AccessControlManager(db);
  const responseFormatter = new FarmResponseFormatter();

  try {
    // Get user from token
    const user = await getUserFromToken(request, env);
    if (!user) {
      return responseFormatter.unauthorized();
    }

    // Route to appropriate handler
    const result = await handleFarmRequest(
      method, url, request, user, farmRepo, accessControl, responseFormatter
    );

    // Log successful operation
    logger.logPerformance(`Farms API ${method}`, startTime);
    
    return result;

  } catch (error) {
    // Centralized error handling
    logger.error('Farms API error', {
      method,
      url: url.pathname,
      error: error.message,
      userId: context.userId
    });

    return handleError(error, {
      operation: 'farms_api',
      method,
      url: url.pathname,
      userId: context.userId
    });
  }
}

/**
 * Main request handler using centralized patterns
 */
async function handleFarmRequest(method, url, request, user, farmRepo, accessControl, responseFormatter) {
  const farmId = url.searchParams.get('id');
  const includeStats = url.searchParams.get('stats') === 'true';
  const includeOperations = url.searchParams.get('operations') === 'true';
  const analytics = url.searchParams.get('analytics') === 'true';

  switch (method) {
    case 'GET':
      return await handleGetFarms(farmId, includeStats, includeOperations, analytics, user, farmRepo, accessControl, responseFormatter);
    
    case 'POST':
      return await handleCreateFarm(request, user, farmRepo, accessControl, responseFormatter);
    
    case 'PUT':
      return await handleUpdateFarm(request, user, farmRepo, accessControl, responseFormatter);
    
    case 'DELETE':
      return await handleDeleteFarm(farmId, user, farmRepo, accessControl, responseFormatter);
    
    default:
      return responseFormatter.methodNotAllowed({
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE']
      });
  }
}

/**
 * GET /farms - List farms with centralized patterns
 */
async function handleGetFarms(farmId, includeStats, includeOperations, analytics, user, farmRepo, accessControl, responseFormatter) {
  if (farmId) {
    // Get specific farm with access control
    const farm = await farmRepo.findWithStatistics(farmId, user.id);
    if (!farm) {
      return responseFormatter.notFound({
        message: 'Farm not found or access denied',
        resource: 'farm'
      });
    }

    // Add statistics if requested
    if (includeStats) {
      farm.statistics = await farmRepo.getStatistics(farmId, '12months', user.id);
    }

    // Add operations if requested
    if (includeOperations) {
      farm.operations = await getFarmOperations(farmId, user, accessControl);
    }

    return responseFormatter.farmDetails(farm);
  }

  if (analytics) {
    // Get farms with analytics data
    const farms = await farmRepo.findByUserAccess(user.id);
    
    // Add analytics data
    for (const farm of farms) {
      farm.analytics = await getFarmAnalytics(farm.id);
    }

    return responseFormatter.farmList(farms, {
      message: 'Retrieved farms with analytics'
    });
  }

  // Standard farm list
  const farms = await farmRepo.findByUserAccess(user.id);
  return responseFormatter.farmList(farms);
}

/**
 * POST /farms - Create farm with centralized validation
 */
async function handleCreateFarm(request, user, farmRepo, accessControl, responseFormatter) {
  // Centralized input validation
  const body = await request.json();
  const farmData = ValidationUtils.validateFarm(body);

  // Check permissions
  const permission = await accessControl.hasPermission(
    user.id, 'farm', 'create', null, 
    { request, operation: 'create_farm' }
  );
  
  if (!permission.authorized) {
    return responseFormatter.forbidden({
      message: 'Insufficient permissions to create farms',
      details: { reason: permission.reason }
    });
  }

  // Create farm with repository pattern
  const newFarm = await farmRepo.createWithSetup(farmData, user.id);

  return responseFormatter.farmCreated(newFarm);
}

/**
 * PUT /farms - Update farm with centralized patterns
 */
async function handleUpdateFarm(request, user, farmRepo, accessControl, responseFormatter) {
  const body = await request.json();
  const { id: farmId, ...updateData } = body;

  // Input validation
  if (!farmId) {
    return responseFormatter.validationError({
      id: 'Farm ID is required'
    });
  }

  // Validate update data
  const validatedData = ValidationUtils.validateFarm(updateData);

  // Check permissions
  const permission = await accessControl.hasPermission(
    user.id, 'farm', 'write', farmId, 
    { request, operation: 'update_farm' }
  );
  
  if (!permission.authorized) {
    return responseFormatter.farmAccessDenied(farmId);
  }

  // Update using repository
  const updatedFarm = await farmRepo.updateWithDependencies(farmId, validatedData, user.id);

  return responseFormatter.farmDetails(updatedFarm, {
    message: 'Farm updated successfully'
  });
}

/**
 * DELETE /farms - Delete farm with dependency checking
 */
async function handleDeleteFarm(farmId, user, farmRepo, accessControl, responseFormatter) {
  if (!farmId) {
    return responseFormatter.validationError({
      id: 'Farm ID is required'
    });
  }

  // Check permissions - only owners can delete farms
  const permission = await accessControl.hasPermission(
    user.id, 'farm', 'delete', farmId, 
    { request, operation: 'delete_farm' }
  );
  
  if (!permission.authorized) {
    return responseFormatter.farmAccessDenied(farmId);
  }

  // Perform deletion with dependency checking
  const result = await farmRepo.deleteWithDependencies(farmId, user.id);

  return responseFormatter.success(result, {
    message: 'Farm deleted successfully',
    code: 'FARM_DELETED'
  });
}

/**
 * Get farm operations (centralized)
 */
async function getFarmOperations(farmId, user, accessControl) {
  // This would use another repository for operations
  // For now, simplified example
  return []; // Placeholder
}

/**
 * Get farm analytics (centralized)
 */
async function getFarmAnalytics(farmId) {
  // This would use analytics services
  // For now, simplified example
  return {
    revenue: 0,
    expenses: 0,
    productivity: 0
  }; // Placeholder
}

/**
 * Get user from token (centralized authentication)
 */
async function getUserFromToken(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const jwt = await import('jsonwebtoken');
    const payload = jwt.verify(token, env.JWT_SECRET);
    
    // Get user details from database
    const { results } = await env.DB.prepare(
      'SELECT id, email, name FROM users WHERE id = ?'
    ).bind(payload.userId).all();

    return results[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Farm Statistics Management (Enhanced)
 */
export async function onRequestStats(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Initialize centralized services
  const db = new DatabaseOperations(env);
  const farmRepo = new FarmRepository(db);
  const accessControl = new AccessControlManager(db);
  const responseFormatter = new FarmResponseFormatter();

  try {
    const user = await getUserFromToken(request, env);
    if (!user) {
      return responseFormatter.unauthorized();
    }

    const farmId = url.searchParams.get('farm_id');
    const period = url.searchParams.get('period') || '12months';

    if (!farmId) {
      return responseFormatter.validationError({
        farm_id: 'Farm ID is required'
      });
    }

    // Check access
    const permission = await accessControl.hasPermission(
      user.id, 'farm', 'read', farmId
    );
    
    if (!permission.authorized) {
      return responseFormatter.farmAccessDenied(farmId);
    }

    if (method === 'GET') {
      const statistics = await farmRepo.getStatistics(farmId, period);
      return responseFormatter.success(statistics);
    }

    if (method === 'POST') {
      // Validate and create statistics
      const body = await request.json();
      const statsData = validateStatsData(body);
      
      const result = await createFarmStatistics(farmId, statsData, db);
      return responseFormatter.success(result, {
        message: 'Statistics created successfully',
        code: 'STATS_CREATED'
      });
    }

    return responseFormatter.methodNotAllowed();

  } catch (error) {
    return handleError(error, {
      operation: 'farm_stats',
      farmId: url.searchParams.get('farm_id')
    });
  }
}

// Local validation functions (not part of ValidationUtils class)
function validateStatsData(data) {
  const validated = {};
  
  if (data.total_animals !== undefined) {
    validated.total_animals = Math.max(0, parseInt(data.total_animals) || 0);
  }
  
  if (data.annual_revenue !== undefined) {
    validated.annual_revenue = Math.max(0, parseFloat(data.annual_revenue) || 0);
  }
  
  if (data.productivity_score !== undefined) {
    validated.productivity_score = Math.max(0, Math.min(100, parseFloat(data.productivity_score) || 0));
  }
  
  // Add more validations as needed
  
  return validated;
}

/**
 * Create farm statistics (centralized)
 */
async function createFarmStatistics(farmId, statsData, db) {
  const { results } = await db.executeQuery(`
    INSERT INTO farm_statistics (
      farm_id, report_date, total_animals, annual_revenue, productivity_score
    ) VALUES (?, ?, ?, ?, ?)
  `, [
    farmId,
    new Date().toISOString().split('T')[0],
    statsData.total_animals || 0,
    statsData.annual_revenue || 0,
    statsData.productivity_score || 0
  ], {
    operation: 'run',
    table: 'farm_statistics',
    context: { createStats: true, farmId }
  });

  return {
    id: results.lastInsertRowId,
    farm_id: farmId,
    ...statsData
  };
}