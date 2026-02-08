import { query } from '../config/database.js';

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export class RefreshTokenModel {
  // Create a new refresh token
  static async create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const result = await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, token, expiresAt]
    );

    return result.rows[0];
  }

  // Find refresh token
  static async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    return result.rows[0] || null;
  }

  // Delete refresh token
  static async delete(token: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE token = $1',
      [token]
    );

    return (result.rowCount ?? 0) > 0;
  }

  // Delete all tokens for a user
  static async deleteAllForUser(userId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  // Clean up expired tokens
  static async cleanupExpired(): Promise<number> {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE expires_at <= NOW()'
    );

    return result.rowCount ?? 0;
  }
}

export default RefreshTokenModel;
