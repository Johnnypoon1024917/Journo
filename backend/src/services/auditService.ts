import { Pool } from 'pg';

export interface AuditLogEntry {
  userId?: string; // UUID as string
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export interface AuditLogQuery {
  userId?: string; // UUID as string
  action?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResult {
  id: number;
  userId?: string; // UUID as string
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export class AuditService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, action, details, ip_address, user_agent, 
          success, error_message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `;

      await this.db.query(query, [
        entry.userId || null,
        entry.action,
        JSON.stringify(entry.details || {}),
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.success !== false, // Default to true if not specified
        entry.errorMessage || null
      ]);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(query: AuditLogQuery): Promise<{
    logs: AuditLogResult[];
    total: number;
  }> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (query.userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        params.push(query.userId);
      }

      if (query.action) {
        conditions.push(`action = $${paramIndex++}`);
        params.push(query.action);
      }

      if (query.startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(query.startDate);
      }

      if (query.endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(query.endDate);
      }

      if (query.success !== undefined) {
        conditions.push(`success = $${paramIndex++}`);
        params.push(query.success);
      }

      if (query.ipAddress) {
        conditions.push(`ip_address = $${paramIndex++}`);
        params.push(query.ipAddress);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM audit_logs 
        ${whereClause}
      `;
      const countResult = await this.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get logs with pagination
      const limit = query.limit || 50;
      const offset = query.offset || 0;

      const logsQuery = `
        SELECT 
          id, user_id, action, details, ip_address, user_agent,
          success, error_message, created_at
        FROM audit_logs 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      params.push(limit, offset);

      const logsResult = await this.db.query(logsQuery, params);

      const logs: AuditLogResult[] = logsResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        action: row.action,
        details: row.details || {},
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        success: row.success,
        errorMessage: row.error_message,
        createdAt: row.created_at
      }));

      return { logs, total };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get security events for a user
   */
  async getSecurityEvents(userId: string, limit: number = 20): Promise<AuditLogResult[]> {
    const securityActions = [
      'login_successful',
      'login_failed',
      'login_invalid_password',
      'login_account_locked',
      'password_reset_requested',
      'password_reset_successful',
      'password_changed',
      'email_verified',
      'account_locked',
      'account_unlocked',
      'two_factor_enabled',
      'two_factor_disabled'
    ];

    const query = `
      SELECT 
        id, user_id, action, details, ip_address, user_agent,
        success, error_message, created_at
      FROM audit_logs 
      WHERE user_id = $1 AND action = ANY($2)
      ORDER BY created_at DESC
      LIMIT $3
    `;

    try {
      const result = await this.db.query(query, [userId, securityActions, limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        action: row.action,
        details: row.details || {},
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        success: row.success,
        errorMessage: row.error_message,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  /**
   * Get failed login attempts for monitoring
   */
  async getFailedLoginAttempts(
    timeWindow: number = 60 * 60 * 1000, // 1 hour
    limit: number = 100
  ): Promise<{
    byIp: Array<{ ipAddress: string; count: number; lastAttempt: Date }>;
    byUser: Array<{ userId: number; email: string; count: number; lastAttempt: Date }>;
  }> {
    const startTime = new Date(Date.now() - timeWindow);

    try {
      // Failed attempts by IP
      const ipQuery = `
        SELECT 
          ip_address,
          COUNT(*) as count,
          MAX(created_at) as last_attempt
        FROM audit_logs 
        WHERE action IN ('login_invalid_password', 'login_user_not_found', 'login_rate_limited')
          AND created_at >= $1
          AND ip_address IS NOT NULL
        GROUP BY ip_address
        ORDER BY count DESC, last_attempt DESC
        LIMIT $2
      `;

      const ipResult = await this.db.query(ipQuery, [startTime, limit]);
      const byIp = ipResult.rows.map(row => ({
        ipAddress: row.ip_address,
        count: parseInt(row.count),
        lastAttempt: row.last_attempt
      }));

      // Failed attempts by user
      const userQuery = `
        SELECT 
          al.user_id,
          u.email,
          COUNT(*) as count,
          MAX(al.created_at) as last_attempt
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.action IN ('login_invalid_password', 'login_account_locked')
          AND al.created_at >= $1
          AND al.user_id IS NOT NULL
        GROUP BY al.user_id, u.email
        ORDER BY count DESC, last_attempt DESC
        LIMIT $2
      `;

      const userResult = await this.db.query(userQuery, [startTime, limit]);
      const byUser = userResult.rows.map(row => ({
        userId: row.user_id,
        email: row.email,
        count: parseInt(row.count),
        lastAttempt: row.last_attempt
      }));

      return { byIp, byUser };
    } catch (error) {
      console.error('Failed to get failed login attempts:', error);
      return { byIp: [], byUser: [] };
    }
  }

  /**
   * Get suspicious activity patterns
   */
  async getSuspiciousActivity(limit: number = 50): Promise<{
    multipleFailedLogins: AuditLogResult[];
    unusualLocations: AuditLogResult[];
    rapidPasswordResets: AuditLogResult[];
  }> {
    try {
      // Multiple failed logins from same IP in short time
      const multipleFailedQuery = `
        SELECT 
          id, user_id, action, details, ip_address, user_agent,
          success, error_message, created_at
        FROM audit_logs 
        WHERE action IN ('login_invalid_password', 'login_user_not_found')
          AND created_at >= NOW() - INTERVAL '1 hour'
          AND ip_address IN (
            SELECT ip_address 
            FROM audit_logs 
            WHERE action IN ('login_invalid_password', 'login_user_not_found')
              AND created_at >= NOW() - INTERVAL '1 hour'
            GROUP BY ip_address 
            HAVING COUNT(*) >= 5
          )
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const multipleFailedResult = await this.db.query(multipleFailedQuery, [limit]);
      const multipleFailedLogins = multipleFailedResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        action: row.action,
        details: row.details || {},
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        success: row.success,
        errorMessage: row.error_message,
        createdAt: row.created_at
      }));

      // Unusual login locations (simplified - in production, use GeoIP)
      const unusualLocationsQuery = `
        SELECT 
          id, user_id, action, details, ip_address, user_agent,
          success, error_message, created_at
        FROM audit_logs 
        WHERE action = 'login_successful'
          AND created_at >= NOW() - INTERVAL '24 hours'
          AND user_id IN (
            SELECT user_id 
            FROM audit_logs 
            WHERE action = 'login_successful'
              AND created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY user_id 
            HAVING COUNT(DISTINCT ip_address) > 3
          )
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const unusualLocationsResult = await this.db.query(unusualLocationsQuery, [limit]);
      const unusualLocations = unusualLocationsResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        action: row.action,
        details: row.details || {},
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        success: row.success,
        errorMessage: row.error_message,
        createdAt: row.created_at
      }));

      // Rapid password reset requests
      const rapidPasswordResetsQuery = `
        SELECT 
          id, user_id, action, details, ip_address, user_agent,
          success, error_message, created_at
        FROM audit_logs 
        WHERE action = 'password_reset_requested'
          AND created_at >= NOW() - INTERVAL '1 hour'
          AND (user_id IN (
            SELECT user_id 
            FROM audit_logs 
            WHERE action = 'password_reset_requested'
              AND created_at >= NOW() - INTERVAL '1 hour'
            GROUP BY user_id 
            HAVING COUNT(*) > 3
          ) OR ip_address IN (
            SELECT ip_address 
            FROM audit_logs 
            WHERE action = 'password_reset_requested'
              AND created_at >= NOW() - INTERVAL '1 hour'
            GROUP BY ip_address 
            HAVING COUNT(*) > 5
          ))
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const rapidPasswordResetsResult = await this.db.query(rapidPasswordResetsQuery, [limit]);
      const rapidPasswordResets = rapidPasswordResetsResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        action: row.action,
        details: row.details || {},
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        success: row.success,
        errorMessage: row.error_message,
        createdAt: row.created_at
      }));

      return {
        multipleFailedLogins,
        unusualLocations,
        rapidPasswordResets
      };
    } catch (error) {
      console.error('Failed to get suspicious activity:', error);
      return {
        multipleFailedLogins: [],
        unusualLocations: [],
        rapidPasswordResets: []
      };
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(timeWindow: number = 24 * 60 * 60 * 1000): Promise<{
    totalEvents: number;
    successfulLogins: number;
    failedLogins: number;
    passwordResets: number;
    newRegistrations: number;
    securityAlerts: number;
  }> {
    const startTime = new Date(Date.now() - timeWindow);

    try {
      const query = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(*) FILTER (WHERE action = 'login_successful') as successful_logins,
          COUNT(*) FILTER (WHERE action IN ('login_invalid_password', 'login_user_not_found', 'login_account_locked')) as failed_logins,
          COUNT(*) FILTER (WHERE action = 'password_reset_requested') as password_resets,
          COUNT(*) FILTER (WHERE action = 'user_registered') as new_registrations,
          COUNT(*) FILTER (WHERE action LIKE '%_security_%' OR action LIKE '%_locked%') as security_alerts
        FROM audit_logs 
        WHERE created_at >= $1
      `;

      const result = await this.db.query(query, [startTime]);
      const row = result.rows[0];

      return {
        totalEvents: parseInt(row.total_events) || 0,
        successfulLogins: parseInt(row.successful_logins) || 0,
        failedLogins: parseInt(row.failed_logins) || 0,
        passwordResets: parseInt(row.password_resets) || 0,
        newRegistrations: parseInt(row.new_registrations) || 0,
        securityAlerts: parseInt(row.security_alerts) || 0
      };
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      return {
        totalEvents: 0,
        successfulLogins: 0,
        failedLogins: 0,
        passwordResets: 0,
        newRegistrations: 0,
        securityAlerts: 0
      };
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
      
      const query = `
        DELETE FROM audit_logs 
        WHERE created_at < $1
      `;

      const result = await this.db.query(query, [cutoffDate]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      return 0;
    }
  }
}