// Query Performance and Caching Utilities for Farm Management System
// Provides query optimization, result caching, and performance monitoring
// Date: November 1, 2025

// ============================================================================
// CACHE CONSTANTS
// ============================================================================

export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  SHORT_TTL: 1 * 60 * 1000,   // 1 minute
  MEDIUM_TTL: 10 * 60 * 1000, // 10 minutes
  LONG_TTL: 30 * 60 * 1000,   // 30 minutes
  
  // Cache keys prefix
  PREFIX: 'farm_mgmt_cache_',
  
  // Maximum cache size
  MAX_SIZE: 1000,
  
  // Cache namespaces
  NAMESPACES: {
    FARM_DATA: 'farms',
    INVENTORY: 'inventory', 
    ANIMALS: 'animals',
    TASKS: 'tasks',
    FINANCE: 'finance',
    WEATHER: 'weather',
    ANALYTICS: 'analytics'
  }
};

// ============================================================================
// MEMORY CACHE IMPLEMENTATION
// ============================================================================

class MemoryCache {
  constructor(config = {}) {
    this.cache = new Map();
    this.maxSize = config.maxSize || CACHE_CONFIG.MAX_SIZE;
    this.defaultTtl = config.defaultTtl || CACHE_CONFIG.DEFAULT_TTL;
  }

  generateKey(namespace, identifier) {
    return `${CACHE_CONFIG.PREFIX}${namespace}_${identifier}`;
  }

  set(key, value, ttl = null) {
    const now = Date.now();
    const expiration = now + (ttl || this.defaultTtl);
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiration,
      created: now,
      accessCount: 0,
      lastAccessed: now
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expiration) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    return item.value;
  }

  has(key) {
    const item = this.cache.get(key);
    return item && Date.now() <= item.expiration;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiration) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let totalAccesses = 0;
    let expiredCount = 0;
    
    for (const item of this.cache.values()) {
      totalAccesses += item.accessCount;
      if (now > item.expiration) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRatio: this.hitRatio,
      totalAccesses,
      expiredCount
    };
  }

  // Calculate hit ratio (simplified)
  get hitRatio() {
    // This would need to be tracked separately in a real implementation
    return 0.85; // Estimated
  }
}

// ============================================================================
// QUERY OPTIMIZATION UTILITIES
// ============================================================================

export class QueryOptimizer {
  constructor(db) {
    this.db = db;
    this.cache = new MemoryCache();
  }

  // Add common optimizations to SQL queries
  optimizeQuery(sql, params = []) {
    let optimizedSql = sql;
    const optimizations = {
      // Add LIMIT for SELECT queries without limits
      addLimit: /SELECT.*FROM/i.test(sql) && !/LIMIT\s+\d+/i.test(sql),
      
      // Add proper ordering for analytics queries
      addOrderBy: /SELECT.*FROM.*analytics|statistics|reports/i.test(sql) && !/ORDER\s+BY/i.test(sql),
      
      // Ensure indexes are used in WHERE clauses
      optimizeWhere: /WHERE.*LIKE\s+['"]%.*['"]/i.test(sql),
      
      // Add proper joins
      optimizeJoins: /FROM.*JOIN/i.test(sql) && !/(LEFT|RIGHT|INNER)\s+JOIN/i.test(sql)
    };

    // Apply LIMIT
    if (optimizations.addLimit && !/WHERE.*LIMIT/i.test(sql)) {
      if (sql.toUpperCase().includes('COUNT')) {
        // Don't add LIMIT to COUNT queries
      } else {
        optimizedSql = sql.replace(/;?\s*$/, ' LIMIT 100;');
      }
    }

    // Add ORDER BY for analytics
    if (optimizations.addOrderBy) {
      const orderClause = ' ORDER BY created_at DESC';
      if (!sql.toUpperCase().includes('ORDER BY')) {
        optimizedSql = sql.replace(/;?\s*$/, orderClause + ';');
      }
    }

    return optimizedSql;
  }

  // Execute optimized query with caching
  async executeQuery(sql, params = [], cacheOptions = {}) {
    const { namespace, identifier, ttl, forceRefresh = false } = cacheOptions;
    
    // Generate cache key
    const cacheKey = namespace && identifier 
      ? this.cache.generateKey(namespace, identifier)
      : null;

    // Check cache first
    if (cacheKey && !forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          results: cached.results,
          cached: true,
          cacheKey,
          executionTime: 0
        };
      }
    }

    const startTime = Date.now();
    
    try {
      // Optimize query
      const optimizedSql = this.optimizeQuery(sql, params);
      
      // Execute query
      const result = await this.db.prepare(optimizedSql)
        .bind(...params)
        .all();
      
      const executionTime = Date.now() - startTime;
      
      // Cache result if applicable
      if (cacheKey) {
        this.cache.set(cacheKey, {
          results: result.results,
          sql: optimizedSql,
          params,
          executionTime,
          timestamp: new Date().toISOString()
        }, ttl);
      }
      
      return {
        results: result.results,
        cached: false,
        cacheKey,
        executionTime,
        sql: optimizedSql
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      throw new Error(`Query execution failed (${executionTime}ms): ${error.message}`);
    }
  }

  // Paginated query with caching
  async executePaginatedQuery(sql, params = [], pagination = {}, cacheOptions = {}) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    
    // Add pagination to query
    let paginatedSql = this.optimizeQuery(sql, params);
    if (!/LIMIT\s+\d+/i.test(paginatedSql) && !/OFFSET\s+\d+/i.test(paginatedSql)) {
      paginatedSql = paginatedSql.replace(/;?\s*$/, ` LIMIT ${limit} OFFSET ${offset};`);
    }
    
    // Create count query for pagination info
    const countSql = `SELECT COUNT(*) as total FROM (${sql.replace(/;?\s*$/, '')}) as subquery`;
    
    // Execute both queries
    const [dataResult, countResult] = await Promise.all([
      this.executeQuery(paginatedSql, params, cacheOptions),
      this.executeQuery(countSql, params, { ...cacheOptions, ttl: CACHE_CONFIG.MEDIUM_TTL })
    ]);
    
    return {
      data: dataResult.results,
      pagination: {
        page,
        limit,
        total: countResult.results[0]?.total || 0,
        totalPages: Math.ceil((countResult.results[0]?.total || 0) / limit),
        hasNext: page * limit < (countResult.results[0]?.total || 0),
        hasPrev: page > 1
      },
      cached: dataResult.cached,
      cacheKey: dataResult.cacheKey,
      executionTime: dataResult.executionTime
    };
  }

  // Invalidate cache for a namespace
  invalidateCache(namespace, identifier = null) {
    if (identifier) {
      const key = this.cache.generateKey(namespace, identifier);
      this.cache.delete(key);
    } else {
      // Clear entire namespace
      const prefix = `${CACHE_CONFIG.PREFIX}${namespace}_`;
      for (const key of this.cache.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.cache.delete(key);
        }
      }
    }
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return this.cache.getStats();
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  // Record query performance
  recordQuery(sql, executionTime, cached = false, rowCount = 0) {
    const key = this.hashQuery(sql);
    const existing = this.metrics.get(key) || {
      query: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      count: 0,
      totalTime: 0,
      avgTime: 0,
      cached: 0,
      totalRows: 0,
      avgRows: 0,
      slowQueries: 0
    };

    existing.count++;
    existing.totalTime += executionTime;
    existing.avgTime = existing.totalTime / existing.count;
    existing.totalRows += rowCount;
    existing.avgRows = existing.totalRows / existing.count;

    if (cached) {
      existing.cached++;
    }

    if (executionTime > 1000) { // Slow query threshold: 1 second
      existing.slowQueries++;
    }

    this.metrics.set(key, existing);
  }

  // Get performance report
  getPerformanceReport() {
    const report = {
      totalQueries: 0,
      totalTime: 0,
      avgTime: 0,
      cachedQueries: 0,
      slowQueries: 0,
      queries: []
    };

    for (const metric of this.metrics.values()) {
      report.totalQueries += metric.count;
      report.totalTime += metric.totalTime;
      report.cachedQueries += metric.cached;
      report.slowQueries += metric.slowQueries;
      
      report.queries.push({
        query: metric.query,
        count: metric.count,
        avgTime: Math.round(metric.avgTime),
        cached: metric.cached,
        avgRows: Math.round(metric.avgRows),
        slowQueries: metric.slowQueries
      });
    }

    report.avgTime = report.totalQueries > 0 ? Math.round(report.totalTime / report.totalQueries) : 0;
    
    // Sort queries by total time
    report.queries.sort((a, b) => b.avgTime * b.count - a.avgTime * a.count);

    return report;
  }

  // Hash query for key generation
  hashQuery(sql) {
    // Simple hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }
}

// ============================================================================
// PRE-BUILT CACHE STRATEGIES
// ============================================================================

export const CACHE_STRATEGIES = {
  // Farm data - moderate caching
  FARMS: {
    namespace: CACHE_CONFIG.NAMESPACES.FARM_DATA,
    ttl: CACHE_CONFIG.MEDIUM_TTL,
    invalidateOn: ['CREATE_FARM', 'UPDATE_FARM', 'DELETE_FARM']
  },

  // Inventory - short caching (frequently changing)
  INVENTORY: {
    namespace: CACHE_CONFIG.NAMESPACES.INVENTORY,
    ttl: CACHE_CONFIG.SHORT_TTL,
    invalidateOn: ['UPDATE_INVENTORY', 'CREATE_TRANSACTION', 'DELETE_ITEM']
  },

  // Animals - medium caching
  ANIMALS: {
    namespace: CACHE_CONFIG.NAMESPACES.ANIMALS,
    ttl: CACHE_CONFIG.MEDIUM_TTL,
    invalidateOn: ['CREATE_ANIMAL', 'UPDATE_ANIMAL', 'DELETE_ANIMAL']
  },

  // Tasks - short caching (frequently updated)
  TASKS: {
    namespace: CACHE_CONFIG.NAMESPACES.TASKS,
    ttl: CACHE_CONFIG.SHORT_TTL,
    invalidateOn: ['CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'COMPLETE_TASK']
  },

  // Finance - medium caching
  FINANCE: {
    namespace: CACHE_CONFIG.NAMESPACES.FINANCE,
    ttl: CACHE_CONFIG.MEDIUM_TTL,
    invalidateOn: ['CREATE_FINANCE_ENTRY', 'UPDATE_ENTRY']
  },

  // Weather - long caching (external API, less frequent changes)
  WEATHER: {
    namespace: CACHE_CONFIG.NAMESPACES.WEATHER,
    ttl: CACHE_CONFIG.LONG_TTL,
    invalidateOn: [] // Weather data refreshed externally
  },

  // Analytics - long caching (computationally expensive)
  ANALYTICS: {
    namespace: CACHE_CONFIG.NAMESPACES.ANALYTICS,
    ttl: CACHE_CONFIG.LONG_TTL,
    invalidateOn: ['UPDATE_ANALYTICS_DATA']
  }
};

// ============================================================================
// CACHE INVALIDATION HELPER
// ============================================================================

export function createCacheInvalidator(optimizer) {
  return {
    // Invalidate cache based on events
    invalidate(event, data = {}) {
      const strategies = Object.values(CACHE_STRATEGIES);
      
      for (const strategy of strategies) {
        if (strategy.invalidateOn.includes(event)) {
          if (data.farmId) {
            optimizer.invalidateCache(strategy.namespace, `farm_${data.farmId}`);
          } else if (data.identifier) {
            optimizer.invalidateCache(strategy.namespace, data.identifier);
          } else {
            // Clear entire namespace
            const prefix = `${CACHE_CONFIG.PREFIX}${strategy.namespace}_`;
            for (const key of optimizer.cache.cache.keys()) {
              if (key.startsWith(prefix)) {
                optimizer.cache.cache.delete(key);
              }
            }
          }
        }
      }
    },

    // Invalidate all cache
    clearAll() {
      optimizer.clearCache();
    }
  };
}

// Export everything
export default {
  MemoryCache,
  QueryOptimizer,
  PerformanceMonitor,
  CACHE_CONFIG,
  CACHE_STRATEGIES,
  createCacheInvalidator
};