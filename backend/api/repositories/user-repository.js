/**
 * User Repository - Handles all user-related database operations
 */

import { BaseRepository } from "../_database.js";

export class UserRepository extends BaseRepository {
  constructor(dbOperations) {
    super(dbOperations, "users");
  }

  /**
   * Find user by email
   */
  async findByEmail(email, options = {}) {
    const result = await this.db.findMany(
      "users",
      { email },
      { ...options, limit: 1 }
    );
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find user by ID with profile data
   */
  async findByIdWithProfile(id, options = {}) {
    return await this.findById(id, "*", options);
  }

  /**
   * Create new user
   */
  async createUser(userData, options = {}) {
    const { email, password_hash, name } = userData;

    if (!email || !password_hash || !name) {
      throw new Error("Email, password hash, and name are required");
    }

    // Generate UUID for id since users table uses TEXT PRIMARY KEY
    const id = crypto.randomUUID();

    return await this.create(
      {
        id,
        email: email.toLowerCase().trim(),
        password_hash,
        name: name.trim(),
        created_at: new Date().toISOString(),
      },
      options
    );
  }

  /**
   * Update user password
   */
  async updatePassword(id, newPasswordHash, options = {}) {
    return await this.updateById(
      id,
      {
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      },
      options
    );
  }

  /**
   * Check if email exists
   */
  async emailExists(email) {
    const count = await this.count({ email: email.toLowerCase().trim() });
    return count > 0;
  }

  /**
   * Find user with farm count
   */
  async findWithFarmCount(userId, options = {}) {
    const result = await this.db.executeQuery(
      `
      SELECT
        u.*,
        COUNT(f.id) as farm_count
      FROM users u
      LEFT JOIN farms f ON f.owner_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `,
      [userId],
      {
        operation: "first",
        table: "users",
        context: { findWithFarmCount: true, userId, ...options.context },
      }
    );

    return result.data;
  }

  /**
   * Get user authentication data
   */
  async findAuthData(userId, options = {}) {
    const result = await this.db.executeQuery(
      `
      SELECT
        id,
        email,
        password_hash,
        name,
        is_active,
        created_at,
        updated_at,
        last_login
      FROM users
      WHERE id = ? AND is_active = 1
    `,
      [userId],
      {
        operation: "first",
        table: "users",
        context: { findAuthData: true, userId, ...options.context },
      }
    );

    return result.data;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId, options = {}) {
    return await this.updateById(
      userId,
      { last_login: new Date().toISOString() },
      options
    );
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT
        u.*,
        COUNT(DISTINCT f.id) as farm_count,
        COUNT(DISTINCT fm.farm_id) as accessible_farm_count,
        COUNT(DISTINCT t.id) as assigned_task_count,
        COUNT(DISTINCT a.id) as audit_log_count
      FROM users u
      LEFT JOIN farms f ON f.owner_id = u.id
      LEFT JOIN farm_members fm ON fm.user_id = u.id
      LEFT JOIN tasks t ON t.assigned_to = u.id
      LEFT JOIN audit_logs a ON a.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `,
      [userId],
      {
        operation: "first",
        table: "users",
        context: { getUserStats: true, userId },
      }
    );

    return result.data;
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(id, options = {}) {
    return await this.updateById(
      id,
      {
        is_active: 0,
        updated_at: new Date().toISOString()
      },
      options
    );
  }

  /**
   * Get user data for GDPR export
   */
  async getUserDataForExport(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT
        id,
        email,
        name,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
    `,
      [userId],
      {
        operation: "first",
        table: "users",
        context: { getUserDataForExport: true, userId },
      }
    );

    return result.data;
  }

  /**
   * Get farms owned by user for GDPR export
   */
  async getOwnedFarmsForExport(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT
        id,
        name,
        location,
        area_hectares,
        created_at
      FROM farms
      WHERE owner_id = ?
    `,
      [userId],
      {
        operation: "query",
        table: "farms",
        context: { getOwnedFarmsForExport: true, userId },
      }
    );

    return result.data;
  }

  /**
   * Get animals owned by user for GDPR export
   */
  async getOwnedAnimalsForExport(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT
        a.id,
        a.name,
        a.species,
        a.breed,
        a.sex,
        a.health_status,
        a.created_at
      FROM animals a
      JOIN farms f ON a.farm_id = f.id
      WHERE f.owner_id = ?
    `,
      [userId],
      {
        operation: "query",
        table: "animals",
        context: { getOwnedAnimalsForExport: true, userId },
      }
    );

    return result.data;
  }

  /**
   * Get crops owned by user for GDPR export
   */
  async getOwnedCropsForExport(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT
        c.id,
        c.crop_type,
        c.planting_date,
        c.status,
        c.created_at
      FROM crops c
      JOIN farms f ON c.farm_id = f.id
      WHERE f.owner_id = ?
    `,
      [userId],
      {
        operation: "query",
        table: "crops",
        context: { getOwnedCropsForExport: true, userId },
      }
    );

    return result.data;
  }

  /**
   * Get audit logs for user for GDPR export
   */
  async getAuditLogsForExport(userId, daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.db.executeQuery(
      `
      SELECT
        action,
        resource_type,
        created_at
      FROM audit_logs
      WHERE user_id = ? AND created_at > ?
      ORDER BY created_at DESC
    `,
      [userId, cutoffDate.toISOString()],
      {
        operation: "query",
        table: "audit_logs",
        context: { getAuditLogsForExport: true, userId, daysOld },
      }
    );

    return result.data;
  }

  /**
   * Count farms owned by user
   */
  async countOwnedFarms(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT COUNT(*) as count FROM farms WHERE owner_id = ?
    `,
      [userId],
      {
        operation: "first",
        table: "farms",
        context: { countOwnedFarms: true, userId },
      }
    );

    return result.data?.count || 0;
  }

  /**
   * Count animals owned by user
   */
  async countOwnedAnimals(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT COUNT(*) as count
      FROM animals a
      JOIN farms f ON a.farm_id = f.id
      WHERE f.owner_id = ?
    `,
      [userId],
      {
        operation: "first",
        table: "animals",
        context: { countOwnedAnimals: true, userId },
      }
    );

    return result.data?.count || 0;
  }

  /**
   * Count crops owned by user
   */
  async countOwnedCrops(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT COUNT(*) as count
      FROM crops c
      JOIN farms f ON c.farm_id = f.id
      WHERE f.owner_id = ?
    `,
      [userId],
      {
        operation: "first",
        table: "crops",
        context: { countOwnedCrops: true, userId },
      }
    );

    return result.data?.count || 0;
  }

  /**
   * Count audit logs for user
   */
  async countAuditLogs(userId) {
    const result = await this.db.executeQuery(
      `
      SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?
    `,
      [userId],
      {
        operation: "first",
        table: "audit_logs",
        context: { countAuditLogs: true, userId },
      }
    );

    return result.data?.count || 0;
  }

  /**
   * Permanently delete user account and all associated data
   */
  async deleteUserAccount(userId) {
    // This would be a complex operation requiring transaction
    // For now, we'll mark as deleted and let cleanup handle it
    return await this.updateById(
      userId,
      {
        is_active: 0,
        email: `deleted_${userId}@deleted.local`,
        name: 'Deleted User',
        updated_at: new Date().toISOString()
      }
    );
  }
}
