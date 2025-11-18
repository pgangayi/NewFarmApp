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
}
