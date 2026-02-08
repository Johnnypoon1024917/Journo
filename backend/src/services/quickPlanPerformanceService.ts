import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface PerformanceMetrics {
  generationTime: number;
  placesFound: number;
  routeOptimizationTime: number;
  weatherApiTime: number;
  cacheHitRate: number;
  externalApiCalls: number;
  errorCount: number;
  userSatisfactionScore?: number;
}

export interface QuickPlanPerformanceData {
  sessionId: string;
  userId: string;
  destination: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  stage: 'form_submission' | 'place_search' | 'route_optimization' | 'trip_creation' | 'completed' | 'error';
  metrics: PerformanceMetrics;
  errorDetails?: string;
  userFeedback?: {
    rating: number;
    comments?: string;
  };
}

export interface PerformanceAlert {
  id: string;
  alertType: 'slow_generation' | 'high_error_rate' | 'low_cache_hit' | 'api_timeout' | 'user_satisfaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  actualValue: number;
  destination?: string;
  createdAt: Date;
  resolved: boolean;
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  averageResponseTime: number;
  popularDestinations: Array<{
    destination: string;
    requestCount: number;
    hitRate: number;
  }>;
}

export interface ExternalApiMetrics {
  service: 'google_places' | 'google_directions' | 'weather_api' | 'location_scraper';
  totalCalls: number;
  averageResponseTime: number;
  errorRate: number;
  timeoutRate: number;
  lastError?: string;
  lastErrorTime?: Date;
}

export class QuickPlanPerformanceService {
  private static performanceThresholds = {
    maxGenerationTime: 10000, // 10 seconds
    maxRouteOptimizationTime: 5000, // 5 seconds
    minCacheHitRate: 0.7, // 70%
    maxErrorRate: 0.05, // 5%
    minUserSatisfactionScore: 3.5, // out of 5
    maxApiResponseTime: 3000 // 3 seconds
  };

  // Start performance tracking for a Quick Plan session
  static async startPerformanceTracking(
    userId: string,
    destination: string,
    sessionMetadata?: Record<string, any>
  ): Promise<string> {
    const sessionId = uuidv4();
    
    try {
      const query = `
        INSERT INTO quick_plan_performance_sessions (
          id, user_id, destination, start_time, stage, 
          session_metadata, created_at
        )
        VALUES ($1, $2, $3, NOW(), 'form_submission', $4, NOW())
        RETURNING id
      `;
      
      await pool.query(query, [
        sessionId,
        userId,
        destination,
        sessionMetadata ? JSON.stringify(sessionMetadata) : null
      ]);

      console.log(`Started performance tracking for session ${sessionId}`);
      return sessionId;
    } catch (error) {
      console.error('Error starting performance tracking:', error);
      return sessionId; // Return sessionId even if DB insert fails
    }
  }

  // Update performance metrics for a session stage
  static async updatePerformanceMetrics(
    sessionId: string,
    stage: QuickPlanPerformanceData['stage'],
    metrics: Partial<PerformanceMetrics>,
    errorDetails?: string
  ): Promise<void> {
    try {
      const query = `
        UPDATE quick_plan_performance_sessions 
        SET 
          stage = $2,
          generation_time = COALESCE($3, generation_time),
          places_found = COALESCE($4, places_found),
          route_optimization_time = COALESCE($5, route_optimization_time),
          weather_api_time = COALESCE($6, weather_api_time),
          cache_hit_rate = COALESCE($7, cache_hit_rate),
          external_api_calls = COALESCE($8, external_api_calls),
          error_count = COALESCE($9, error_count),
          error_details = COALESCE($10, error_details),
          updated_at = NOW()
        WHERE id = $1
      `;
      
      await pool.query(query, [
        sessionId,
        stage,
        metrics.generationTime,
        metrics.placesFound,
        metrics.routeOptimizationTime,
        metrics.weatherApiTime,
        metrics.cacheHitRate,
        metrics.externalApiCalls,
        metrics.errorCount,
        errorDetails
      ]);

      // Check for performance alerts
      await this.checkPerformanceAlerts(sessionId, metrics);
      
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  // Complete performance tracking session
  static async completePerformanceTracking(
    sessionId: string,
    success: boolean,
    userFeedback?: { rating: number; comments?: string }
  ): Promise<void> {
    try {
      const query = `
        UPDATE quick_plan_performance_sessions 
        SET 
          end_time = NOW(),
          total_duration = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
          stage = $2,
          user_satisfaction_score = $3,
          user_feedback = $4,
          completed_at = NOW()
        WHERE id = $1
      `;
      
      await pool.query(query, [
        sessionId,
        success ? 'completed' : 'error',
        userFeedback?.rating,
        userFeedback ? JSON.stringify(userFeedback) : null
      ]);

      // Track completion analytics
      await this.trackCompletionAnalytics(sessionId, success);
      
    } catch (error) {
      console.error('Error completing performance tracking:', error);
    }
  }

  // Get cache performance metrics
  static async getCachePerformanceMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<CachePerformanceMetrics> {
    try {
      const timeCondition = this.getTimeCondition(timeframe);
      
      const query = `
        WITH cache_stats AS (
          SELECT 
            destination,
            COUNT(*) as total_requests,
            SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END) as cache_hits,
            AVG(response_time_ms) as avg_response_time
          FROM quick_plan_cache_requests 
          WHERE created_at >= ${timeCondition}
          GROUP BY destination
        )
        SELECT 
          COALESCE(SUM(cache_hits)::float / NULLIF(SUM(total_requests), 0), 0) as hit_rate,
          COALESCE(1 - (SUM(cache_hits)::float / NULLIF(SUM(total_requests), 0)), 0) as miss_rate,
          COALESCE(SUM(total_requests), 0) as total_requests,
          COALESCE(AVG(avg_response_time), 0) as average_response_time
        FROM cache_stats
      `;
      
      const result = await pool.query(query);
      const stats = result.rows[0];

      // Get popular destinations
      const popularQuery = `
        SELECT 
          destination,
          COUNT(*) as request_count,
          COALESCE(SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END)::float / COUNT(*), 0) as hit_rate
        FROM quick_plan_cache_requests 
        WHERE created_at >= ${timeCondition}
        GROUP BY destination
        ORDER BY request_count DESC
        LIMIT 10
      `;
      
      const popularResult = await pool.query(popularQuery);

      return {
        hitRate: parseFloat(stats.hit_rate) || 0,
        missRate: parseFloat(stats.miss_rate) || 0,
        totalRequests: parseInt(stats.total_requests) || 0,
        averageResponseTime: parseFloat(stats.average_response_time) || 0,
        popularDestinations: popularResult.rows
      };
    } catch (error) {
      console.error('Error getting cache performance metrics:', error);
      return {
        hitRate: 0,
        missRate: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        popularDestinations: []
      };
    }
  }

  // Get external API performance metrics
  static async getExternalApiMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<ExternalApiMetrics[]> {
    try {
      const timeCondition = this.getTimeCondition(timeframe);
      
      const query = `
        SELECT 
          api_service as service,
          COUNT(*) as total_calls,
          AVG(response_time_ms) as average_response_time,
          COALESCE(SUM(CASE WHEN error_occurred = true THEN 1 ELSE 0 END)::float / COUNT(*), 0) as error_rate,
          COALESCE(SUM(CASE WHEN timeout_occurred = true THEN 1 ELSE 0 END)::float / COUNT(*), 0) as timeout_rate,
          MAX(CASE WHEN error_occurred = true THEN error_message END) as last_error,
          MAX(CASE WHEN error_occurred = true THEN created_at END) as last_error_time
        FROM external_api_calls 
        WHERE created_at >= ${timeCondition}
        GROUP BY api_service
        ORDER BY total_calls DESC
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        service: row.service,
        totalCalls: parseInt(row.total_calls),
        averageResponseTime: parseFloat(row.average_response_time) || 0,
        errorRate: parseFloat(row.error_rate) || 0,
        timeoutRate: parseFloat(row.timeout_rate) || 0,
        lastError: row.last_error,
        lastErrorTime: row.last_error_time ? new Date(row.last_error_time) : undefined
      }));
    } catch (error) {
      console.error('Error getting external API metrics:', error);
      return [];
    }
  }

  // Get user satisfaction metrics
  static async getUserSatisfactionMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    averageRating: number;
    totalResponses: number;
    ratingDistribution: Record<number, number>;
    completionRate: number;
    commonFeedback: Array<{ comment: string; count: number }>;
  }> {
    try {
      const timeCondition = this.getTimeCondition(timeframe);
      
      // Get satisfaction scores
      const satisfactionQuery = `
        SELECT 
          AVG(user_satisfaction_score) as average_rating,
          COUNT(user_satisfaction_score) as total_responses,
          COUNT(*) as total_sessions,
          SUM(CASE WHEN stage = 'completed' THEN 1 ELSE 0 END) as completed_sessions
        FROM quick_plan_performance_sessions 
        WHERE created_at >= ${timeCondition}
      `;
      
      const satisfactionResult = await pool.query(satisfactionQuery);
      const stats = satisfactionResult.rows[0];

      // Get rating distribution
      const distributionQuery = `
        SELECT 
          FLOOR(user_satisfaction_score) as rating,
          COUNT(*) as count
        FROM quick_plan_performance_sessions 
        WHERE created_at >= ${timeCondition}
        AND user_satisfaction_score IS NOT NULL
        GROUP BY FLOOR(user_satisfaction_score)
        ORDER BY rating
      `;
      
      const distributionResult = await pool.query(distributionQuery);
      const ratingDistribution: Record<number, number> = {};
      distributionResult.rows.forEach(row => {
        ratingDistribution[row.rating] = parseInt(row.count);
      });

      // Get common feedback themes (simplified)
      const feedbackQuery = `
        SELECT 
          user_feedback->>'comments' as comment,
          COUNT(*) as count
        FROM quick_plan_performance_sessions 
        WHERE created_at >= ${timeCondition}
        AND user_feedback->>'comments' IS NOT NULL
        AND LENGTH(user_feedback->>'comments') > 0
        GROUP BY user_feedback->>'comments'
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const feedbackResult = await pool.query(feedbackQuery);

      return {
        averageRating: parseFloat(stats.average_rating) || 0,
        totalResponses: parseInt(stats.total_responses) || 0,
        ratingDistribution,
        completionRate: stats.total_sessions > 0 ? 
          (parseInt(stats.completed_sessions) / parseInt(stats.total_sessions)) : 0,
        commonFeedback: feedbackResult.rows
      };
    } catch (error) {
      console.error('Error getting user satisfaction metrics:', error);
      return {
        averageRating: 0,
        totalResponses: 0,
        ratingDistribution: {},
        completionRate: 0,
        commonFeedback: []
      };
    }
  }

  // Track external API call performance
  static async trackExternalApiCall(
    service: ExternalApiMetrics['service'],
    startTime: Date,
    endTime: Date,
    success: boolean,
    errorMessage?: string,
    timeout?: boolean
  ): Promise<void> {
    try {
      const responseTime = endTime.getTime() - startTime.getTime();
      
      const query = `
        INSERT INTO external_api_calls (
          id, api_service, response_time_ms, error_occurred, 
          timeout_occurred, error_message, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      
      await pool.query(query, [
        uuidv4(),
        service,
        responseTime,
        !success,
        timeout || false,
        errorMessage
      ]);

      // Check for API performance alerts
      if (responseTime > this.performanceThresholds.maxApiResponseTime) {
        await this.createPerformanceAlert(
          'api_timeout',
          'high',
          `${service} API response time exceeded threshold`,
          this.performanceThresholds.maxApiResponseTime,
          responseTime
        );
      }
    } catch (error) {
      console.error('Error tracking external API call:', error);
    }
  }

  // Track cache request performance
  static async trackCacheRequest(
    destination: string,
    cacheHit: boolean,
    responseTime: number
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO quick_plan_cache_requests (
          id, destination, cache_hit, response_time_ms, created_at
        )
        VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await pool.query(query, [
        uuidv4(),
        destination,
        cacheHit,
        responseTime
      ]);
    } catch (error) {
      console.error('Error tracking cache request:', error);
    }
  }

  // Check for performance alerts
  private static async checkPerformanceAlerts(
    sessionId: string,
    metrics: Partial<PerformanceMetrics>
  ): Promise<void> {
    try {
      // Check generation time
      if (metrics.generationTime && metrics.generationTime > this.performanceThresholds.maxGenerationTime) {
        await this.createPerformanceAlert(
          'slow_generation',
          'medium',
          'Quick Plan generation time exceeded threshold',
          this.performanceThresholds.maxGenerationTime,
          metrics.generationTime,
          sessionId
        );
      }

      // Check cache hit rate
      if (metrics.cacheHitRate !== undefined && metrics.cacheHitRate < this.performanceThresholds.minCacheHitRate) {
        await this.createPerformanceAlert(
          'low_cache_hit',
          'low',
          'Cache hit rate below threshold',
          this.performanceThresholds.minCacheHitRate,
          metrics.cacheHitRate,
          sessionId
        );
      }

      // Check user satisfaction
      if (metrics.userSatisfactionScore && metrics.userSatisfactionScore < this.performanceThresholds.minUserSatisfactionScore) {
        await this.createPerformanceAlert(
          'user_satisfaction',
          'high',
          'User satisfaction score below threshold',
          this.performanceThresholds.minUserSatisfactionScore,
          metrics.userSatisfactionScore,
          sessionId
        );
      }
    } catch (error) {
      console.error('Error checking performance alerts:', error);
    }
  }

  // Create performance alert
  private static async createPerformanceAlert(
    alertType: PerformanceAlert['alertType'],
    severity: PerformanceAlert['severity'],
    message: string,
    threshold: number,
    actualValue: number,
    sessionId?: string
  ): Promise<void> {
    try {
      // Get destination from session if available
      let destination: string | undefined;
      if (sessionId) {
        const sessionQuery = `SELECT destination FROM quick_plan_performance_sessions WHERE id = $1`;
        const sessionResult = await pool.query(sessionQuery, [sessionId]);
        destination = sessionResult.rows[0]?.destination;
      }

      const query = `
        INSERT INTO quick_plan_performance_alerts (
          id, alert_type, severity, message, threshold_value, 
          actual_value, destination, session_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `;
      
      await pool.query(query, [
        uuidv4(),
        alertType,
        severity,
        message,
        threshold,
        actualValue,
        destination,
        sessionId
      ]);

      console.warn(`Performance alert created: ${alertType} - ${message} (${actualValue} vs ${threshold})`);
    } catch (error) {
      console.error('Error creating performance alert:', error);
    }
  }

  // Track completion analytics
  private static async trackCompletionAnalytics(sessionId: string, success: boolean): Promise<void> {
    try {
      // Get session details
      const sessionQuery = `
        SELECT destination, user_id, total_duration, user_satisfaction_score
        FROM quick_plan_performance_sessions 
        WHERE id = $1
      `;
      
      const sessionResult = await pool.query(sessionQuery, [sessionId]);
      const session = sessionResult.rows[0];

      if (session) {
        // Track analytics event
        const eventQuery = `
          INSERT INTO analytics_events (event_name, user_id, metadata, created_at)
          VALUES ($1, $2, $3, NOW())
        `;
        
        await pool.query(eventQuery, [
          success ? 'quick_plan_completed' : 'quick_plan_failed',
          session.user_id,
          JSON.stringify({
            destination: session.destination,
            duration_ms: session.total_duration,
            satisfaction_score: session.user_satisfaction_score,
            session_id: sessionId
          })
        ]);
      }
    } catch (error) {
      console.error('Error tracking completion analytics:', error);
    }
  }

  // Get time condition for SQL queries
  private static getTimeCondition(timeframe: 'hour' | 'day' | 'week' | 'month'): string {
    switch (timeframe) {
      case 'hour':
        return "NOW() - INTERVAL '1 hour'";
      case 'day':
        return "NOW() - INTERVAL '1 day'";
      case 'week':
        return "NOW() - INTERVAL '1 week'";
      case 'month':
        return "NOW() - INTERVAL '1 month'";
      default:
        return "NOW() - INTERVAL '1 day'";
    }
  }

  // Get performance dashboard data
  static async getPerformanceDashboard(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    overview: {
      totalSessions: number;
      completionRate: number;
      averageGenerationTime: number;
      averageUserSatisfaction: number;
    };
    cacheMetrics: CachePerformanceMetrics;
    apiMetrics: ExternalApiMetrics[];
    satisfactionMetrics: Awaited<ReturnType<typeof QuickPlanPerformanceService.getUserSatisfactionMetrics>>;
    recentAlerts: PerformanceAlert[];
  }> {
    try {
      const timeCondition = this.getTimeCondition(timeframe);
      
      // Get overview metrics
      const overviewQuery = `
        SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN stage = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
          AVG(generation_time) as avg_generation_time,
          AVG(user_satisfaction_score) as avg_satisfaction
        FROM quick_plan_performance_sessions 
        WHERE created_at >= ${timeCondition}
      `;
      
      const overviewResult = await pool.query(overviewQuery);
      const overview = overviewResult.rows[0];

      // Get recent alerts
      const alertsQuery = `
        SELECT 
          id, alert_type, severity, message, threshold_value,
          actual_value, destination, created_at, resolved
        FROM quick_plan_performance_alerts 
        WHERE created_at >= ${timeCondition}
        ORDER BY created_at DESC
        LIMIT 20
      `;
      
      const alertsResult = await pool.query(alertsQuery);
      const recentAlerts: PerformanceAlert[] = alertsResult.rows.map(row => ({
        id: row.id,
        alertType: row.alert_type,
        severity: row.severity,
        message: row.message,
        threshold: parseFloat(row.threshold_value),
        actualValue: parseFloat(row.actual_value),
        destination: row.destination,
        createdAt: new Date(row.created_at),
        resolved: row.resolved
      }));

      // Get other metrics
      const [cacheMetrics, apiMetrics, satisfactionMetrics] = await Promise.all([
        this.getCachePerformanceMetrics(timeframe === 'month' ? 'week' : timeframe as 'hour' | 'day' | 'week'),
        this.getExternalApiMetrics(timeframe === 'month' ? 'week' : timeframe as 'hour' | 'day' | 'week'),
        this.getUserSatisfactionMetrics(timeframe)
      ]);

      return {
        overview: {
          totalSessions: parseInt(overview.total_sessions) || 0,
          completionRate: overview.total_sessions > 0 ? 
            (parseInt(overview.completed_sessions) / parseInt(overview.total_sessions)) : 0,
          averageGenerationTime: parseFloat(overview.avg_generation_time) || 0,
          averageUserSatisfaction: parseFloat(overview.avg_satisfaction) || 0
        },
        cacheMetrics,
        apiMetrics,
        satisfactionMetrics,
        recentAlerts
      };
    } catch (error) {
      console.error('Error getting performance dashboard:', error);
      throw error;
    }
  }
}