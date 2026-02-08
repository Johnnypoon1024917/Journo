import { Pool } from 'pg';

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

export class RateLimitService {
  private db: Pool;
  private defaultConfigs: Map<string, RateLimitConfig>;

  constructor(db: Pool) {
    this.db = db;
    
    // Default rate limit configurations
    this.defaultConfigs = new Map([
      ['login', { maxAttempts: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 15 * 60 * 1000 }], // 10 attempts per 15 minutes
      ['register', { maxAttempts: 5, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }], // 5 attempts per hour
      ['password_reset', { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }], // 3 attempts per hour
      ['email_verification', { maxAttempts: 5, windowMs: 60 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }], // 5 attempts per hour
      ['api_general', { maxAttempts: 100, windowMs: 60 * 1000 }], // 100 requests per minute
      ['api_sensitive', { maxAttempts: 20, windowMs: 60 * 1000 }] // 20 requests per minute for sensitive endpoints
    ]);
  }

  /**
   * Check if an action is rate limited
   */
  async checkRateLimit(
    identifier: string,
    action: string,
    maxAttempts?: number,
    windowMs?: number,
    blockDurationMs?: number
  ): Promise<RateLimitResult> {
    try {
      const config = this.getConfig(action, maxAttempts, windowMs, blockDurationMs);
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Get or create rate limit record
      const record = await this.getRateLimitRecord(identifier, action);

      if (record) {
        // Check if currently blocked
        if (record.blocked_until && record.blocked_until > now) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: record.blocked_until.getTime(),
            retryAfter: record.blocked_until.getTime() - now.getTime()
          };
        }

        // Check if we need to reset the window
        if (record.window_start < windowStart) {
          // Reset the window
          await this.resetRateLimitWindow(record.id, now);
          return {
            allowed: true,
            remaining: config.maxAttempts - 1,
            resetTime: now.getTime() + config.windowMs
          };
        }

        // Check if limit exceeded
        if (record.attempts >= config.maxAttempts) {
          // Block if configured
          if (config.blockDurationMs) {
            const blockedUntil = new Date(now.getTime() + config.blockDurationMs);
            await this.blockIdentifier(record.id, blockedUntil);
            
            return {
              allowed: false,
              remaining: 0,
              resetTime: blockedUntil.getTime(),
              retryAfter: config.blockDurationMs
            };
          } else {
            return {
              allowed: false,
              remaining: 0,
              resetTime: record.window_start.getTime() + config.windowMs
            };
          }
        }

        // Increment attempts
        await this.incrementAttempts(record.id);
        
        return {
          allowed: true,
          remaining: config.maxAttempts - record.attempts - 1,
          resetTime: record.window_start.getTime() + config.windowMs
        };
      } else {
        // Create new record
        await this.createRateLimitRecord(identifier, action, now);
        
        return {
          allowed: true,
          remaining: config.maxAttempts - 1,
          resetTime: now.getTime() + config.windowMs
        };
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting fails
      return { allowed: true };
    }
  }

  /**
   * Record a successful action (for rate limiting)
   */
  async recordAttempt(identifier: string, action: string): Promise<void> {
    await this.checkRateLimit(identifier, action);
  }

  /**
   * Clear rate limit for an identifier and action
   */
  async clearRateLimit(identifier: string, action: string): Promise<void> {
    try {
      const query = `
        DELETE FROM rate_limits 
        WHERE identifier = $1 AND action = $2
      `;
      await this.db.query(query, [identifier, action]);
    } catch (error) {
      console.error('Failed to clear rate limit:', error);
    }
  }

  /**
   * Get rate limit status without incrementing
   */
  async getRateLimitStatus(
    identifier: string,
    action: string,
    maxAttempts?: number,
    windowMs?: number
  ): Promise<RateLimitResult> {
    try {
      const config = this.getConfig(action, maxAttempts, windowMs);
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      const record = await this.getRateLimitRecord(identifier, action);

      if (!record) {
        return {
          allowed: true,
          remaining: config.maxAttempts,
          resetTime: now.getTime() + config.windowMs
        };
      }

      // Check if currently blocked
      if (record.blocked_until && record.blocked_until > now) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: record.blocked_until.getTime(),
          retryAfter: record.blocked_until.getTime() - now.getTime()
        };
      }

      // Check if window has expired
      if (record.window_start < windowStart) {
        return {
          allowed: true,
          remaining: config.maxAttempts,
          resetTime: now.getTime() + config.windowMs
        };
      }

      const remaining = Math.max(0, config.maxAttempts - record.attempts);
      const allowed = remaining > 0;

      return {
        allowed,
        remaining,
        resetTime: record.window_start.getTime() + config.windowMs
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return { allowed: true };
    }
  }

  /**
   * Get all active rate limits for monitoring
   */
  async getActiveRateLimits(limit: number = 100): Promise<Array<{
    identifier: string;
    action: string;
    attempts: number;
    windowStart: Date;
    blockedUntil?: Date;
    isBlocked: boolean;
  }>> {
    try {
      const query = `
        SELECT identifier, action, attempts, window_start, blocked_until
        FROM rate_limits 
        WHERE (blocked_until IS NULL OR blocked_until > NOW())
          AND window_start > NOW() - INTERVAL '24 hours'
        ORDER BY attempts DESC, window_start DESC
        LIMIT $1
      `;

      const result = await this.db.query(query, [limit]);
      const now = new Date();

      return result.rows.map(row => ({
        identifier: row.identifier,
        action: row.action,
        attempts: row.attempts,
        windowStart: row.window_start,
        blockedUntil: row.blocked_until,
        isBlocked: row.blocked_until && row.blocked_until > now
      }));
    } catch (error) {
      console.error('Failed to get active rate limits:', error);
      return [];
    }
  }

  /**
   * Clean up expired rate limit records
   */
  async cleanupExpiredRecords(): Promise<number> {
    try {
      const query = `
        DELETE FROM rate_limits 
        WHERE (blocked_until IS NULL OR blocked_until < NOW())
          AND window_start < NOW() - INTERVAL '24 hours'
      `;

      const result = await this.db.query(query);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to cleanup expired rate limit records:', error);
      return 0;
    }
  }

  // Private helper methods

  private getConfig(
    action: string,
    maxAttempts?: number,
    windowMs?: number,
    blockDurationMs?: number
  ): RateLimitConfig {
    const defaultConfig = this.defaultConfigs.get(action) || this.defaultConfigs.get('api_general')!;
    
    return {
      maxAttempts: maxAttempts || defaultConfig.maxAttempts,
      windowMs: windowMs || defaultConfig.windowMs,
      blockDurationMs: blockDurationMs || defaultConfig.blockDurationMs
    };
  }

  private async getRateLimitRecord(identifier: string, action: string): Promise<any> {
    const query = `
      SELECT id, identifier, action, attempts, window_start, blocked_until, created_at, updated_at
      FROM rate_limits 
      WHERE identifier = $1 AND action = $2
    `;

    const result = await this.db.query(query, [identifier, action]);
    return result.rows[0] || null;
  }

  private async createRateLimitRecord(
    identifier: string,
    action: string,
    windowStart: Date
  ): Promise<void> {
    const query = `
      INSERT INTO rate_limits (identifier, action, attempts, window_start, created_at, updated_at)
      VALUES ($1, $2, 1, $3, NOW(), NOW())
      ON CONFLICT (identifier, action) 
      DO UPDATE SET 
        attempts = 1,
        window_start = $3,
        blocked_until = NULL,
        updated_at = NOW()
    `;

    await this.db.query(query, [identifier, action, windowStart]);
  }

  private async resetRateLimitWindow(recordId: number, windowStart: Date): Promise<void> {
    const query = `
      UPDATE rate_limits 
      SET attempts = 1, 
          window_start = $1, 
          blocked_until = NULL,
          updated_at = NOW()
      WHERE id = $2
    `;

    await this.db.query(query, [windowStart, recordId]);
  }

  private async incrementAttempts(recordId: number): Promise<void> {
    const query = `
      UPDATE rate_limits 
      SET attempts = attempts + 1, 
          updated_at = NOW()
      WHERE id = $1
    `;

    await this.db.query(query, [recordId]);
  }

  private async blockIdentifier(recordId: number, blockedUntil: Date): Promise<void> {
    const query = `
      UPDATE rate_limits 
      SET blocked_until = $1, 
          updated_at = NOW()
      WHERE id = $2
    `;

    await this.db.query(query, [blockedUntil, recordId]);
  }
}