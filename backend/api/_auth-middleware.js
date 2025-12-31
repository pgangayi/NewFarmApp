// Authentication Middleware
// Provides reusable authentication checks for protected routes
// Date: November 25, 2025

import { SimpleAuth, createErrorResponse } from "./_auth.js";
import { CSRFProtection } from "./_csrf.js";
import { TokenManager } from "./_token-management.js";

export class AuthMiddleware {
  constructor(env) {
    this.env = env;
    this.auth = new SimpleAuth(env);
    this.csrf = new CSRFProtection(env);
    this.tokenManager = new TokenManager(env);
  }

  /**
   * Authenticate a request and return the user
   * @param {Request} request - The HTTP request
   * @param {Object} options - Configuration options
   * @returns {Promise<{user: User|null, error: Response|null}>}
   */
  async authenticate(request, options = {}) {
    try {
      const user = await this.auth.getUserFromToken(request);

      if (!user) {
        return {
          user: null,
          error: createErrorResponse(
            "Unauthorized: Invalid or missing token",
            401
          ),
        };
      }

      return { user, error: null };
    } catch (error) {
      console.error("Authentication error:", error);
      return {
        user: null,
        error: createErrorResponse("Internal server error", 500),
      };
    }
  }

  /**
   * Check CSRF protection for state-changing requests
   * @param {Request} request - The HTTP request
   * @param {Object} requestContext - IP, userAgent, etc.
   * @returns {Promise<{valid: boolean, error: Response|null}>}
   */
  async validateCSRF(request, requestContext = {}) {
    const method = request.method.toUpperCase();

    // Skip CSRF check for safe methods
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      return { valid: true, error: null };
    }

    try {
      const validation = await this.csrf.validateCSRFToken(request);

      if (!validation.valid) {
        console.warn("CSRF validation failed:", {
          error: validation.error,
          ip: requestContext.ipAddress,
          method,
        });

        // Log security event
        await this.csrf.logSecurityEvent(
          "csrf_validation_failed",
          null,
          requestContext,
          { error: validation.error, method }
        );

        return {
          valid: false,
          error: createErrorResponse("CSRF validation failed", 403),
        };
      }

      return { valid: true, error: null };
    } catch (error) {
      console.error("CSRF check error:", error);
      return {
        valid: false,
        error: createErrorResponse(
          "Internal server error during CSRF validation",
          500
        ),
      };
    }
  }

  /**
   * Require authentication for a route
   * Returns early with 401 if not authenticated
   * @param {Request} request - The HTTP request
   * @returns {Promise<{user: User|null, response: Response|null}>}
   */
  async requireAuth(request) {
    const { user, error } = await this.authenticate(request);
    if (!user) {
      return { user: null, response: error };
    }
    return { user, response: null };
  }

  /**
   * Create protection middleware that checks auth and CSRF
   * @param {Object} options - Configuration options
   * @returns {Function} Middleware function
   */
  createProtectedRoute(options = {}) {
    return async (request, context = {}) => {
      // Authenticate
      const { user, response: authError } = await this.requireAuth(request);
      if (!user) {
        return { authenticated: false, response: authError };
      }

      // Check CSRF if needed
      const ipAddress = this.auth.getClientIP(request);
      const userAgent = request.headers.get("user-agent") || "unknown";
      const requestContext = { ipAddress, userAgent };

      const { valid: csrfValid, error: csrfError } = await this.validateCSRF(
        request,
        requestContext
      );

      if (!csrfValid && options.requireCSRF !== false) {
        return { authenticated: true, user, response: csrfError };
      }

      // All checks passed
      return {
        authenticated: true,
        user,
        response: null,
        requestContext,
      };
    };
  }

  /**
   * Verify farm access for a user
   * @param {string} userId - The user ID
   * @param {string} farmId - The farm ID
   * @returns {Promise<boolean>}
   */
  async verifyFarmAccess(userId, farmId) {
    return await this.auth.hasFarmAccess(userId, farmId);
  }

  /**
   * Create a request handler wrapper that applies auth and CSRF checks
   * @param {Function} handler - The actual handler function
   * @param {Object} options - Configuration options
   * @returns {Function} Wrapped handler
   */
  createHandler(handler, options = {}) {
    return async (context) => {
      const { request } = context;
      const ipAddress = this.auth.getClientIP(request);
      const userAgent = request.headers.get("user-agent") || "unknown";
      const requestContext = { ipAddress, userAgent };

      // Authenticate if required
      if (options.requireAuth !== false) {
        const { user, response: authError } = await this.requireAuth(request);
        if (!user) {
          return authError;
        }

        // Verify farm access if needed
        if (options.farmId) {
          const hasAccess = await this.verifyFarmAccess(
            user.id,
            options.farmId
          );
          if (!hasAccess) {
            return createErrorResponse("Access denied: No farm access", 403);
          }
        }

        // Check CSRF if needed
        const method = request.method.toUpperCase();
        const needsCSRF =
          options.requireCSRF !== false &&
          !["GET", "HEAD", "OPTIONS"].includes(method);

        if (needsCSRF) {
          const { valid: csrfValid, error: csrfError } =
            await this.validateCSRF(request, requestContext);

          if (!csrfValid) {
            return csrfError;
          }
        }

        // Pass user and requestContext to handler
        context.user = user;
        context.requestContext = requestContext;
      }

      // Call the actual handler
      return await handler(context);
    };
  }

  /**
   * Log security event
   * @param {string} eventType - Type of event
   * @param {string|null} userId - User ID if applicable
   * @param {Object} requestContext - IP, userAgent, etc.
   * @param {Object} eventData - Additional event data
   */
  async logSecurityEvent(eventType, userId, requestContext, eventData = {}) {
    return await this.tokenManager.logSecurityEvent(
      eventType,
      userId,
      requestContext,
      eventData
    );
  }
}

/**
 * Create a simple auth check utility
 * Usage: const { user, error } = await requireAuth(request, env);
 */
export async function requireAuth(request, env) {
  const auth = new SimpleAuth(env);
  const user = await auth.getUserFromToken(request);

  if (!user) {
    return {
      user: null,
      error: createErrorResponse("Unauthorized", 401),
    };
  }

  return { user, error: null };
}

/**
 * Create a simple protected route wrapper
 * Usage: const handler = protectedRoute(async (context) => { ... }, env);
 */
export function protectedRoute(handler, env, options = {}) {
  return async (context) => {
    const { request } = context;
    const middleware = new AuthMiddleware(env);

    const result = await middleware.createProtectedRoute(options)(request);

    if (!result.authenticated) {
      return result.response;
    }

    // Add user and requestContext to context
    context.user = result.user;
    context.requestContext = result.requestContext;

    return await handler(context);
  };
}
