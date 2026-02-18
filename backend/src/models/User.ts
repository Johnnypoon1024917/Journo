import { query } from '../config/database.js';
import argon2 from 'argon2';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'user' | 'admin' | 'moderator';
  language?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  language?: string;
  created_at: Date;
}

export class UserModel {
  // Create a new user
  static async create(userData: UserCreateInput): Promise<UserResponse> {
    const { email, name, password } = userData;

    // Hash password using Argon2 (more secure than bcrypt)
    const password_hash = await argon2.hash(password, {
      type: argon2.argon2id, // Use Argon2id variant (recommended)
      memoryCost: 65536, // 64 MB
      timeCost: 3, // 3 iterations
      parallelism: 4, // 4 parallel threads
    });

    const result = await query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, language, created_at`,
      [email, name, password_hash, 'user']
    );

    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id: string): Promise<UserResponse | null> {
    const result = await query(
      'SELECT id, email, name, role, language, created_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  // Verify password using Argon2
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      // If verification fails (e.g., invalid hash format), return false
      return false;
    }
  }

  // Update user
  static async update(id: string, updates: Partial<UserCreateInput & { language?: string }>): Promise<UserResponse> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.password) {
      const password_hash = await argon2.hash(updates.password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
      fields.push(`password_hash = $${paramCount++}`);
      values.push(password_hash);
    }

    if (updates.language !== undefined) {
      fields.push(`language = $${paramCount++}`);
      values.push(updates.language);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, name, role, language, created_at`,
      values
    );

    return result.rows[0];
  }

  // Delete user
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  }
}

export default UserModel;
