// Centralized Access Control and Permission Management
// Provides consistent authorization, farm access control, and permission checking
// Date: November 7, 2025
// SECURITY ENHANCED: November 10, 2025

import { DatabaseOperations } from "./_database.js";
import {
  AuthorizationError,
  createNotFoundError,
  logError,
} from "./_errors.js";

const ROLE_PERMISSIONS = {
  owner: {
    canRead: ["*"],
    canWrite: ["*"],
    canDelete: ["*"],
    canManage: ["*"],
  },
  manager: {
    canRead: ["*"],
    canWrite: ["*"],
    canDelete: ["farms", "animals", "crops", "tasks", "inventory", "finance"],
    canManage: ["animals", "crops", "tasks", "inventory", "finance"],
  },
  admin: {
    canRead: ["*"],
    canWrite: ["*"],
    canDelete: ["animals", "crops", "tasks", "inventory", "finance"],
    canManage: ["animals", "crops", "tasks", "inventory"],
  },
  member: {
    canRead: ["*"],
    canWrite: ["animals", "crops", "tasks", "inventory"],
    canDelete: [],
    canManage: [],
  },
  worker: {
    canRead: ["animals", "crops", "tasks"],
    canWrite: ["tasks", "observations"],
    canDelete: [],
    canManage: [],
  },
};

const RESOURCE_ACTIONS = {
  farm: ["read", "write", "delete", "manage"],
  animal: ["read", "write", "delete", "manage"],
  crop: ["read", "write", "delete", "manage"],
  task: ["read", "write", "delete", "manage"],
  inventory: ["read", "write", "delete", "manage"],
  finance: ["read", "write", "delete", "manage"],
  field: ["read", "write", "delete", "manage"],
  user: ["read", "write", "manage"],
};

/**
 * Centralized Access Control Manager
 */
export class AccessControlManager {
  constructor(dbOperations) {
    this.db = dbOperations;
  }

  /**
   * Check if user has permission to perform action on resource
   * SECURITY: Enhanced with additional validation and audit logging
   */
  async hasPermission(userId, resource, action, farmId = null, context = {}) {
    try {
      // SECURITY: Input validation
      if (!userId || !resource || !action) {
        console.warn("SECURITY: Invalid permission check parameters", {
          userId,
          resource,
          action,
        });
        return {
          authorized: false,
          reason: "Invalid permission check parameters",
          context: { userId, resource, action, farmId, context },
        };
      }

      // SECURITY: Validate resource and action are whitelisted
      if (
        !this.isValidResource(resource) ||
        !this.isValidAction(resource, action)
      ) {
        console.warn("SECURITY: Invalid resource/action combination", {
          resource,
          action,
        });
        return {
          authorized: false,
          reason: "Invalid resource or action",
          context: { userId, resource, action, farmId, context },
        };
      }

      // SECURITY: Audit logging for permission checks
      const permissionCheck = {
        userId,
        resource,
        action,
        farmId,
        timestamp: new Date().toISOString(),
        clientIP: context.clientIP || "unknown",
        userAgent: context.userAgent || "unknown",
      };

      // If no farmId provided, check global permissions
      if (!farmId) {
        const result = this.checkGlobalPermission(
          userId,
          resource,
          action,
          context
        );
        this.logPermissionCheck(permissionCheck, result, "global");
        return result;
      }

      // Get user's role in the specific farm with additional validation
      const role = await this.getUserFarmRole(userId, farmId);
      if (!role) {
        const result = {
          authorized: false,
          reason: "User is not a member of this farm",
          context: { userId, resource, action, farmId },
        };
        this.logPermissionCheck(permissionCheck, result, "farm_access_denied");
        return result;
      }

      // Check permission based on role
      const permissions = ROLE_PERMISSIONS[role];
      if (!permissions) {
        const result = {
          authorized: false,
          reason: `Unknown role: ${role}`,
          context: { userId, resource, action, farmId, role },
        };
        this.logPermissionCheck(permissionCheck, result, "unknown_role");
        return result;
      }

      // Check if role has permission for this action on this resource
      const hasPermission = this.roleHasPermission(
        permissions,
        resource,
        action
      );

      const result = {
        authorized: hasPermission,
        role,
        reason: hasPermission
          ? "Permission granted"
          : `Role ${role} does not have ${action} permission on ${resource}`,
        context: { userId, resource, action, farmId, role },
      };

      this.logPermissionCheck(
        permissionCheck,
        result,
        hasPermission ? "granted" : "denied"
      );
      return result;
    } catch (error) {
      logError(error, {
        operation: "hasPermission",
        userId,
        resource,
        action,
        farmId,
        context,
      });

      return {
        authorized: false,
        reason: "Error checking permission",
        error: error.message,
        context: { userId, resource, action, farmId, context },
      };
    }
  }

  /**
   * Get user's role in a specific farm
   */
  async getUserFarmRole(userId, farmId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT role FROM farm_members
      WHERE farm_id = ? AND user_id = ?
    `,
      [farmId, userId],
      {
        operation: "query",
        table: "farm_members",
        context: { getUserFarmRole: true, userId, farmId },
      }
    );

    return results[0]?.role || null;
  }

  /**
   * Get all farms user has access to with their roles
   */
  async getUserAccessibleFarms(userId) {
    const { results } = await this.db.executeQuery(
      `
      SELECT 
        f.*,
        fm.role,
        fm.joined_at
      FROM farms f
      JOIN farm_members fm ON f.id = fm.farm_id
      WHERE fm.user_id = ?
      ORDER BY f.created_at DESC
    `,
      [userId],
      {
        operation: "query",
        table: "farms",
        context: { getUserAccessibleFarms: true, userId },
      }
    );

    return results || [];
  }

  /**
   * Get users with access to a specific farm
   */
  async getFarmMembers(farmId, userId) {
    // Check if requesting user has access
    const hasAccess = await this.hasPermission(
      userId,
      "farm",
      "manage",
      farmId
    );
    if (!hasAccess.authorized) {
      throw new AuthorizationError(
        "Insufficient permissions to view farm members"
      );
    }

    const { results } = await this.db.executeQuery(
      `
      SELECT 
        fm.*,
        u.name,
        u.email,
        u.created_at as user_created_at
      FROM farm_members fm
      JOIN users u ON fm.user_id = u.id
      WHERE fm.farm_id = ?
      ORDER BY 
        CASE fm.role
          WHEN 'owner' THEN 1
          WHEN 'manager' THEN 2
          WHEN 'admin' THEN 3
          WHEN 'member' THEN 4
          WHEN 'worker' THEN 5
          ELSE 6
        END,
        u.name
    `,
      [farmId],
      {
        operation: "query",
        table: "farm_members",
        context: { getFarmMembers: true, farmId, requesterId: userId },
      }
    );

    return results;
  }

  /**
   * Add user to farm with specific role
   */
  async addUserToFarm(farmId, userId, targetUserId, role, context = {}) {
    // Check if user has permission to manage farm members
    const hasPermission = await this.hasPermission(
      userId,
      "farm",
      "manage",
      farmId,
      context
    );
    if (!hasPermission.authorized) {
      throw new AuthorizationError(
        "Insufficient permissions to add users to farm"
      );
    }

    // Validate role
    if (!Object.keys(ROLE_PERMISSIONS).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Check if user is already a member
    const { results: existing } = await this.db.executeQuery(
      "SELECT role FROM farm_members WHERE farm_id = ? AND user_id = ?",
      [farmId, targetUserId],
      {
        operation: "query",
        table: "farm_members",
        context: { checkExistingMember: true },
      }
    );

    if (existing.length > 0) {
      throw new Error("User is already a member of this farm");
    }

    // Add user to farm
    const { results } = await this.db.executeQuery(
      "INSERT INTO farm_members (farm_id, user_id, role) VALUES (?, ?, ?)",
      [farmId, targetUserId, role],
      {
        operation: "run",
        table: "farm_members",
        context: {
          addUserToFarm: true,
          farmId,
          targetUserId,
          role,
          addedBy: userId,
        },
      }
    );

    return {
      success: true,
      farmId,
      userId: targetUserId,
      role,
      addedBy: userId,
    };
  }

  /**
   * Update user's role in farm
   */
  async updateUserRole(farmId, userId, targetUserId, newRole, context = {}) {
    // Check if user has permission to manage farm members
    const hasPermission = await this.hasPermission(
      userId,
      "farm",
      "manage",
      farmId,
      context
    );
    if (!hasPermission.authorized) {
      throw new AuthorizationError(
        "Insufficient permissions to update user roles"
      );
    }

    // Validate role
    if (!Object.keys(ROLE_PERMISSIONS).includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    // Check if target user is a member
    const { results: existing } = await this.db.executeQuery(
      "SELECT role FROM farm_members WHERE farm_id = ? AND user_id = ?",
      [farmId, targetUserId],
      {
        operation: "query",
        table: "farm_members",
        context: { checkExistingMember: true },
      }
    );

    if (existing.length === 0) {
      throw new Error("User is not a member of this farm");
    }

    // Don't allow changing owner role unless current user is owner
    if (existing[0].role === "owner" && newRole !== "owner") {
      const requesterRole = await this.getUserFarmRole(userId, farmId);
      if (requesterRole !== "owner") {
        throw new AuthorizationError(
          "Only the farm owner can change ownership"
        );
      }
    }

    // Update role
    const { changes } = await this.db.executeQuery(
      "UPDATE farm_members SET role = ? WHERE farm_id = ? AND user_id = ?",
      [newRole, farmId, targetUserId],
      {
        operation: "run",
        table: "farm_members",
        context: {
          updateUserRole: true,
          farmId,
          targetUserId,
          newRole,
          updatedBy: userId,
        },
      }
    );

    return {
      success: true,
      farmId,
      userId: targetUserId,
      oldRole: existing[0].role,
      newRole,
      updatedBy: userId,
    };
  }

  /**
   * Remove user from farm
   */
  async removeUserFromFarm(farmId, userId, targetUserId, context = {}) {
    // Check if user has permission
    const hasPermission = await this.hasPermission(
      userId,
      "farm",
      "manage",
      farmId,
      context
    );
    if (!hasPermission.authorized) {
      throw new AuthorizationError(
        "Insufficient permissions to remove users from farm"
      );
    }

    // Get target user's role
    const { results: existing } = await this.db.executeQuery(
      "SELECT role FROM farm_members WHERE farm_id = ? AND user_id = ?",
      [farmId, targetUserId],
      {
        operation: "query",
        table: "farm_members",
        context: { checkExistingMember: true },
      }
    );

    if (existing.length === 0) {
      throw new Error("User is not a member of this farm");
    }

    // Don't allow removing owner unless current user is also owner
    if (existing[0].role === "owner") {
      const requesterRole = await this.getUserFarmRole(userId, farmId);
      if (requesterRole !== "owner") {
        throw new AuthorizationError(
          "Only the farm owner can remove ownership"
        );
      }
    }

    // Remove user from farm
    const { changes } = await this.db.executeQuery(
      "DELETE FROM farm_members WHERE farm_id = ? AND user_id = ?",
      [farmId, targetUserId],
      {
        operation: "run",
        table: "farm_members",
        context: {
          removeUserFromFarm: true,
          farmId,
          targetUserId,
          removedBy: userId,
        },
      }
    );

    return {
      success: true,
      farmId,
      userId: targetUserId,
      removedRole: existing[0].role,
      removedBy: userId,
    };
  }

  /**
   * Check if user owns farm
   */
  async isFarmOwner(userId, farmId) {
    const role = await this.getUserFarmRole(userId, farmId);
    return role === "owner";
  }

  /**
   * Check if user can perform administrative actions
   */
  async canPerformAdminActions(userId, farmId) {
    const role = await this.getUserFarmRole(userId, farmId);
    return ["owner", "manager", "admin"].includes(role);
  }

  /**
   * Get all available roles and their permissions
   */
  getAvailableRoles() {
    return Object.keys(ROLE_PERMISSIONS).map((role) => ({
      name: role,
      permissions: ROLE_PERMISSIONS[role],
    }));
  }

  /**
   * Check resource and action validity
   */
  isValidResource(resource) {
    return Object.keys(RESOURCE_ACTIONS).includes(resource);
  }

  isValidAction(resource, action) {
    return RESOURCE_ACTIONS[resource]?.includes(action) || false;
  }

  /**
   * Get resource permissions for a role
   */
  getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || null;
  }

  /**
   * Batch permission check for multiple actions
   */
  async batchPermissionCheck(userId, permissions, context = {}) {
    const results = {};

    for (const { resource, action, farmId } of permissions) {
      const result = await this.hasPermission(
        userId,
        resource,
        action,
        farmId,
        context
      );
      results[`${resource}:${action}${farmId ? `:${farmId}` : ""}`] = result;
    }

    return results;
  }

  /**
   * Check global permissions (outside farm context)
   */
  checkGlobalPermission(userId, resource, action, context = {}) {
    // For now, only users can perform actions outside farm context
    if (resource === "user") {
      return {
        authorized:
          userId === context.targetUserId || userId === context.currentUserId,
        reason: "Global user permission check",
        context: { userId, resource, action, ...context },
      };
    }

    return {
      authorized: false,
      reason: "Resource requires farm context",
      context: { userId, resource, action, ...context },
    };
  }

  // SECURITY: Log permission checks for audit trail
  logPermissionCheck(permissionCheck, result, outcome) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      permissionCheck,
      result: {
        authorized: result.authorized,
        reason: result.reason,
        role: result.role,
      },
      outcome,
      severity: result.authorized
        ? "info"
        : outcome === "denied"
        ? "warning"
        : "info",
    };

    console.log("PERMISSION_CHECK:", JSON.stringify(logEntry));

    // Additional logging for denied permissions (security monitoring)
    if (!result.authorized && outcome === "denied") {
      console.warn("SECURITY: Permission denied", {
        userId: permissionCheck.userId,
        resource: permissionCheck.resource,
        action: permissionCheck.action,
        farmId: permissionCheck.farmId,
        clientIP: permissionCheck.clientIP,
        timestamp: permissionCheck.timestamp,
      });
    }

    // Log potential privilege escalation attempts
    if (
      result.authorized &&
      result.role &&
      ["owner", "manager", "admin"].includes(result.role)
    ) {
      console.info("PRIVILEGED_ACCESS:", {
        userId: permissionCheck.userId,
        role: result.role,
        resource: permissionCheck.resource,
        action: permissionCheck.action,
        farmId: permissionCheck.farmId,
        clientIP: permissionCheck.clientIP,
        timestamp: permissionCheck.timestamp,
      });
    }
  }

  // SECURITY: Enhanced role validation to prevent privilege escalation
  validateRoleTransition(userId, currentRole, newRole, farmId) {
    // Define role hierarchy for security
    const roleHierarchy = {
      owner: 5,
      manager: 4,
      admin: 3,
      member: 2,
      worker: 1,
    };

    const currentLevel = roleHierarchy[currentRole] || 0;
    const newLevel = roleHierarchy[newRole] || 0;

    // Prevent privilege escalation (users cannot upgrade their own role)
    if (newLevel > currentLevel) {
      return {
        valid: false,
        reason: "Users cannot escalate their own privileges",
        blocked: "privilege_escalation",
      };
    }

    // Only owners can assign owner role
    if (newRole === "owner" && currentRole !== "owner") {
      return {
        valid: false,
        reason: "Only farm owners can assign owner role",
        blocked: "unauthorized_ownership",
      };
    }

    return { valid: true };
  }

  // SECURITY: Comprehensive access control validation
  async validateFarmAccess(userId, farmId, requiredLevel = "member") {
    try {
      if (!userId || !farmId) {
        return { valid: false, reason: "Missing userId or farmId" };
      }

      // Check if user is a member of the farm
      const userRole = await this.getUserFarmRole(userId, farmId);
      if (!userRole) {
        return { valid: false, reason: "User is not a member of this farm" };
      }

      // Check if role meets required level
      const roleHierarchy = {
        owner: 5,
        manager: 4,
        admin: 3,
        member: 2,
        worker: 1,
      };

      const userLevel = roleHierarchy[userRole] || 0;
      const requiredLevelNum = roleHierarchy[requiredLevel] || 1;

      if (userLevel < requiredLevelNum) {
        return {
          valid: false,
          reason: `Access requires ${requiredLevel} role or higher`,
          currentRole: userRole,
          requiredRole: requiredLevel,
        };
      }

      return {
        valid: true,
        role: userRole,
        level: userLevel,
      };
    } catch (error) {
      console.error("SECURITY: Error validating farm access", {
        userId,
        farmId,
        error: error.message,
      });
      return { valid: false, reason: "Error validating access" };
    }
  }

  // Private helper methods
  roleHasPermission(rolePermissions, resource, action) {
    // Check if role has wildcard permission
    if (
      rolePermissions[
        `can${action.charAt(0).toUpperCase() + action.slice(1)}`
      ]?.includes("*")
    ) {
      return true;
    }

    // Check if role has specific permission for this resource
    return (
      rolePermissions[
        `can${action.charAt(0).toUpperCase() + action.slice(1)}`
      ]?.includes(resource) || false
    );
  }
}

/**
 * Middleware for Express-like request handling
 */
export class AccessControlMiddleware {
  constructor(accessControl) {
    this.accessControl = accessControl;
  }

  /**
   * Require authentication middleware
   */
  requireAuth() {
    return async (request) => {
      const user = request.user;
      if (!user) {
        throw new AuthorizationError("Authentication required");
      }
      return user;
    };
  }

  /**
   * Permission middleware
   */
  requirePermission(resource, action, getFarmId = null) {
    return async (request) => {
      const user = request.user;
      const farmId = getFarmId ? await getFarmId(request) : null;

      const result = await this.accessControl.hasPermission(
        user.id,
        resource,
        action,
        farmId,
        { request }
      );

      if (!result.authorized) {
        throw new AuthorizationError(result.reason);
      }

      return result;
    };
  }

  /**
   * Farm ownership middleware
   */
  requireFarmOwnership() {
    return async (request) => {
      const user = request.user;
      const farmId = request.params.farmId || request.body.farm_id;

      if (!farmId) {
        throw new Error("Farm ID is required");
      }

      const isOwner = await this.accessControl.isFarmOwner(user.id, farmId);
      if (!isOwner) {
        throw new AuthorizationError("Farm ownership required");
      }

      return { user, farmId };
    };
  }
}

/**
 * Utility functions for access control
 */
export const AccessControlUtils = {
  /**
   * Create access control context from request
   */
  createContextFromRequest(request) {
    return {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    };
  },

  /**
   * Log access control decision
   */
  logAccessDecision(decision, context = {}) {
    console.log("ACCESS_DECISION:", {
      timestamp: new Date().toISOString(),
      userId: context.userId,
      resource: context.resource,
      action: context.action,
      farmId: context.farmId,
      authorized: decision.authorized,
      reason: decision.reason,
      role: decision.role,
      requestContext: context.requestContext,
    });
  },
};

// Export everything
export default {
  AccessControlManager,
  AccessControlMiddleware,
  AccessControlUtils,
  ROLE_PERMISSIONS,
  RESOURCE_ACTIONS,
};
