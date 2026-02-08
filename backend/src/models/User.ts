import { query } from '../config/database.js';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'user' | 'admin' | 'moderator';
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
  created_at: Date;
}

const SALT_ROUNDS = 10;

export class UserModel {
  // Create a new user
  static async create(userData: UserCreateInput): Promise<UserResponse> {
    const { email, name, password } = userData;

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
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
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  // Verify password
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user
  static async update(id: string, updates: Partial<UserCreateInput>): Promise<UserResponse> {
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
      const password_hash = await bcrypt.hash(updates.password, SALT_ROUNDS);
      fields.push(`password_hash = $${paramCount++}`);
      values.push(password_hash);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, name, role, created_at`,
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
