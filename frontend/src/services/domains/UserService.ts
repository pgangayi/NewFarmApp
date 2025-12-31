import { DatabaseAdapter } from '../../core/DatabaseAdapter';
import bcrypt from 'bcryptjs';

/**
 * DOMAIN SERVICE: User
 * --------------------
 * Handles business logic for user management, hashing, and database interaction.
 */

export class UserService {
  static async findByEmail(email: string) {
    // Simulate async DB call
    await new Promise(r => setTimeout(r, 50));
    return DatabaseAdapter.findOne('users', u => u.email === email);
  }

  static async findById(id: string) {
    await new Promise(r => setTimeout(r, 50));
    return DatabaseAdapter.findOne('users', u => u.id === id);
  }

  static async createUser(payload: { email: string; password: string; name: string }) {
    const existing = await this.findByEmail(payload.email);
    if (existing) {
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(payload.password, salt);

    const newUser = {
      id: crypto.randomUUID(),
      email: payload.email,
      full_name: payload.name,
      password_hash,
      role: 'owner', // Default role
      created_at: new Date().toISOString(),
      mfa_secret: null,
    };

    DatabaseAdapter.insert('users', newUser);
    return newUser;
  }

  static async verifyPassword(user: any, plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, user.password_hash);
  }
}
