import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export interface QuickPlanUsagePattern {
  destination: string;
  requestCount: number;
  averageDuration: number;
  completionRate: number;
  popularInterests: Array<{
    interest: string;
    count: number;
    percentage: number;
  }>;
  averageBudgetLevel: string;
  peakUsageHours: number[];
}

export interface ConversionMetrics {
  totalSuggestions: number;
  tripsCreated: number;
  conversionRate: number;
  averageCustomizations: number;
  mostRemovedPlaceTypes: Array<{
    placeType: string;
    removalCount: number;
  }>;
  mostRequestedPlaceTypes: Array<{
    placeType: string;
    requestCount: number;
  }>;
}

export interface UserCustomizationPattern {
  userId: string;
  totalSessions: number;
  averageCustomizations: number;
  preferredInterests: string[];
  preferredBudgetLevel: string;
  preferredTravelStyle: string;
  customizationTypes: Array<{
    type: 'place_removal' | 'place_replacement' | 'regeneration' | 'count_adjustment';
    count: number;
  }>;
}

export interface PopularDestination {
  destination: string;
  requestCount: number;
  successRate: number;
  averageRating: number;
  averageGenerationTime: number;
  topInterests: string[];
  seasonalTrends: Array<{
    month: number;
    requestCount: number;
  }>;
}

export interface ABTestResult {
  testId: string;
  testName: string;
  variants: Array<{
    variantId: string;
    variantName: string;
    userCount: number;
    conversionRate: number;
    averageRating: number;
    averageGenerationTime: number;
  }>;
  statisticalSignificance: number;
  winningVariant?: string;
  recommendation: string;
}

export interface FeedbackAnalysis {
  totalFeedback: number;
  averageRating: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonThemes: Array<{
    theme: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    examples: string[];
  }>;
  improvementSuggestions: string[];
}

export class QuickPlanAnalyticsService {
  // Track Quick Plan usage patterns
  static async trackQuickPlanUsage(
    userId: string,
    destination: string,
    interests: string[],
    budgetLevel: string,
    travelStyle: string,
    groupSize: number,
    sessionId: string
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO quick_plan_usage_analytics (
          id, user_id, destination, interests, budget_level, 
          travel_style, group_size, session_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `;
      
      await pool.query(query, [
        uuidv4(),
        userId,
        destination,
        JSON.stringify(interests),
        budgetLevel,
        travelStyle,
        groupSize,
        sessionId
      ]);
    } catch (error) {
      console.error('Error tracking Quick Plan usage:', error);
    }
  }

  // Track user customizations
  static async trackUserCustomization(
    userId: string,
    sessionId: string,
    customizationType: 'place_removal' | 'place_replacement' | 'regeneration' | 'count_adjustment',
    customizationData: Record<string, any>
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO quick_plan_customizations (
          id, user_id, session_id, customization_type, 
          customization_data, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      
      await pool.query(query, [
        uuidv4(),
        userId,
        sessionId,
        customizationType,
        JSON.stringify(customizationData)
      ]);
    } catch (error) {
      console.error('Error tracking user customization:', error);
    }
  }

  // Track conversion from suggestions to trip
  static async trackConversion(
    userId: string,
    sessionId: string,
    tripId: string,
    suggestionsCount: number,
    customizationsCount: number
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO quick_plan_conversions (
          id, user_id, session_id, trip_id, suggestions_count, 
          customizations_count, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      
      await pool.query(query, [
        uuidv4(),
        userId,
        sessionId,
        tripId,
        suggestionsCount,
        customizationsCount
      ]);
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  // Get usage patterns for popular destinations
  static async getUsagePatterns(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<QuickPlanUsagePattern[]> {
    try {
      const timeCondition = this.getTimeCondition(timeframe);
      
      const query = `
        WITH destination_stats AS (
          SELECT 
            destination,
            COUNT(*) as request_count,
            AVG(EXTRACT(EPOCH FROM (ps.end_time - ps.start_time))) as avg_duration,
            SUM(CASE WHEN ps.stage = 'completed' THEN 1 ELSE 0 END)::float / COUNT(*) as completion_rate
          FROM quick_plan_usage_analytics ua
          LEFT JOIN quick_plan_performance_sessions ps ON ua.session_id = ps.id
          WHERE ua.created_at >= ${timeCondition}
          GROUP BY destination
        ),
        interest_stats AS (
          SELECT 
            destination,
            jsonb_array_elements_text(interests) as interest,
            COUNT(*) as interest_count
          FROM quick_plan_usage_analytics
          WHERE created_at >= ${timeCondition}
          GROUP BY destination, interest
        ),
        budget_stats AS (
          SELECT 
            destination,
            budget_level,
            COUNT(*) as budget_count,
            ROW_NUMBER() OVER (PARTITION BY destination ORDER BY COUNT(*) DESC) as rn
          FROM quick_plan_usage_analytics
          WHERE created_at >= ${timeCondition}
          GROUP BY destination, budget_level
        ),
        hourly_stats AS (
          SELECT 
            destination,
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) as hour_count
          FROM quick_plan_usage_analytics
          WHERE created_at >= ${timeCondition}
          GROUP BY destination, EXTRACT(HOUR FROM created_at)
        )
        SELECT 
          ds.destination,
          ds.request_count,
          ds.avg_duration,
          ds.completion_rate,
          COALESCE(bs.budget_level, 'medium') as avg_budget_level,
          ARRAY_AGG(DISTINCT hs.hour ORDER BY hs.hour_count DESC) FILTER (WHERE hs.hour_count > 0) as peak_hours
        FROM destination_stats ds
        LEFT JOIN budget_stats bs ON ds.destination = bs.destination AND bs.rn = 1
        LEFT JOIN hourly_stats hs ON ds.destination = hs.destination
        GROUP BY ds.destination, ds.request_count, ds.avg_duration, ds.completion_rate, bs.budget_level
        ORDER BY ds.request_count DESC
        LIMIT 20
      `;
      
      const result = await pool.query(query);
      
      // Get popular interests for each destination
      const patterns: QuickPlanUsagePattern[] = [];
      
      for (const row of result.rows) {
        const interestQuery = `
          SELECT 
            jsonb_array_elements_text(interests) as interest,
            COUNT(*) as count
          FROM quick_plan_usage_analytics
          WHERE destination = $1 AND created_at >= ${timeCondition}
          GROUP BY interest
          ORDER BY count DESC
          LIMIT 5
        `;
        
        const interestResult = await pool.query(interestQuery, [row.destination]);
        const totalInterests = interestResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
        
        patterns.push({
          destination: row.destination,
          requestCount: parseInt(row.request_count),
          averageDuration: parseFloat(row.avg_duration) || 0,
          completionRate: parseFloat(row.completion_rate) || 0,
          popularInterests: interestResult.rows.map(r => ({
            interest: r.interest,
            count: parseInt(r.count),
            percentage: totalInterests > 0 ? (parseInt(r.count) / totalInterests) * 100 : 0
          })),
          averageBudgetLevel: row.avg_budget_level,
          peakUsageHours: row.peak_hours || []
        });
      }
      
      return patterns;
    } catch (error) {
      console.error('Error getting usage patterns:', error);
      return [];
    }
  }

  // Get conversion metrics
  static async getConversionMetrics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<ConversionMetrics> {
    try {
      const timeCondition = this.getTimeCondition(timeframe);
      
      // Get basic conversion stats
      const conversionQuery = `
        SELECT 
          COUNT(DISTINCT ua.session_id) as total_suggestions,
          COUNT(DISTINCT c.trip_id) as trips_created,
          AVG(c.customizations_count) as avg_customizations
        FROM quick_plan_usage_analytics ua
        LEFT JOIN quick_plan_conversions c ON ua.session_id = c.session_id
        WHERE ua.created_at >= ${timeCondition}
      `;
      
      const conversionResult = await pool.query(conversionQuery);
      const stats = conversionResult.rows[0];

      // Get most removed place types
      const removedQuery = `
        SELECT 
          customization_data->>'placeType' as place_type,
          COUNT(*) as removal_count
        FROM quick_plan_customizations
        WHERE customization_type = 'place_removal'
        AND created_at >= ${timeCondition}
        AND customization_data->>'placeType' IS NOT NULL
        GROUP BY customization_data->>'placeType'
        ORDER BY removal_count DESC
        LIMIT 10
      `;
      
      const removedResult = await pool.query(removedQuery);

      // Get most requested place types (from regenerations)
      const requestedQuery = `
        SELECT 
          jsonb_array_elements_text(customization_data->'requestedTypes') as place_type,
          COUNT(*) as request_count
        FROM quick_plan_customizations
        WHERE customization_type = 'regeneration'
        AND created_at >= ${timeCondition}
        AND customization_data->'requestedTypes' IS NOT NULL
        GROUP BY place_type
        ORDER BY request_count DESC
        LIMIT 10
      `;
      
      const requestedResult = await pool.query(requestedQuery);

      const totalSuggestions = parseInt(stats.total_suggestions) || 0;
      const tripsCreated = parseInt(stats.trips_created) || 0;

      return {
        totalSuggestions,
        tripsCreated,
        conversionRate: totalSuggestions > 0 ? (tripsCreated / totalSuggestions) : 0,
        averageCustomizations: parseFloat(stats.avg_customizations) || 0,
        mostRemovedPlaceTypes: removedResult.rows.map(row => ({
          placeType: row.place_type,
          removalCount: parseInt(row.removal_count)
        })),
        mostRequestedPlaceTypes: requestedResult.rows.map(row => ({
          placeType: row.place_type,
          requestCount: parseInt(row.request_count)
        }))
      };
    } catch (error) {
      console.error('Error getting conversion metrics:', error);
      return {
        totalSuggestions: 0,
        tripsCreated: 0,
        conversionRate: 0,
        averageCustomizations: 0,
        mostRemovedPlaceTypes: [],
        mostRequestedPlaceTypes: []
      };
    }
  }

  // Analyze user customization patterns
  static async analyzeUserCustomizationPatterns(
    userId?: string,
    limit: number = 100
  ): Promise<UserCustomizationPattern[]> {
    try {
      const userCondition = userId ? 'AND ua.user_id = $1' : '';
      const params = userId ? [userId] : [];
      
      const query = `
        WITH user_stats AS (
          SELECT 
            ua.user_id,
            COUNT(DISTINCT ua.session_id) as total_sessions,
            AVG(c.customizations_count) as avg_customizations,
            ARRAY_AGG(DISTINCT jsonb_array_elements_text(ua.interests)) as all_interests,
            MODE() WITHIN GROUP (ORDER BY ua.budget_level) as preferred_budget,
            MODE() WITHIN GROUP (ORDER BY ua.travel_style) as preferred_style
          FROM quick_plan_usage_analytics ua
          LEFT JOIN quick_plan_conversions c ON ua.session_id = c.session_id
          WHERE 1=1 ${userCondition}
          GROUP BY ua.user_id
        ),
        customization_stats AS (
          SELECT 
            user_id,
            customization_type,
            COUNT(*) as type_count
          FROM quick_plan_customizations
          WHERE 1=1 ${userCondition}
          GROUP BY user_id, customization_type
        )
        SELECT 
          us.user_id,
          us.total_sessions,
          us.avg_customizations,
          us.all_interests as preferred_interests,
          us.preferred_budget as preferred_budget_level,
          us.preferred_style as preferred_travel_style
        FROM user_stats us
        ORDER BY us.total_sessions DESC
        LIMIT $${params.length + 1}
      `;
      
      params.push(limit.toString());
      const result = await pool.query(query, params);
      
      const patterns: UserCustomizationPattern[] = [];
      
      for (const row of result.rows) {
        // Get customization types for this user
        const customizationQuery = `
          SELECT customization_type, COUNT(*) as count
          FROM quick_plan_customizations
          WHERE user_id = $1
          GROUP BY customization_type
        `;
        
        const customizationResult = await pool.query(customizationQuery, [row.user_id]);
        
        patterns.push({
          userId: row.user_id,
          totalSessions: parseInt(row.total_sessions),
          averageCustomizations: parseFloat(row.avg_customizations) || 0,
          preferredInterests: row.preferred_interests || [],
          preferredBudgetLevel: row.preferred_budget_level || 'medium',
          preferredTravelStyle: row.preferred_travel_style || 'moderate',
          customizationTypes: customizationResult.rows.map(r => ({
            type: r.customization_type,
            count: parseInt(r.count)
          }))
        });
      }
      
      return patterns;
    } catch (error) {
      console.error('Error analyzing user customization patterns:', error);
      return [];
    }
  }

  // Get popular destinations with detailed analytics
  static async getPopularDestinations(limit: number = 20): Promise<PopularDestination[]> {
    try {
      const query = `
        WITH destination_stats AS (
          SELECT 
            ua.destination,
            COUNT(*) as request_count,
            SUM(CASE WHEN ps.stage = 'completed' THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
            AVG(ps.user_satisfaction_score) as avg_rating,
            AVG(ps.generation_time) as avg_generation_time
          FROM quick_plan_usage_analytics ua
          LEFT JOIN quick_plan_performance_sessions ps ON ua.session_id = ps.id
          WHERE ua.created_at >= NOW() - INTERVAL '3 months'
          GROUP BY ua.destination
        ),
        seasonal_stats AS (
          SELECT 
            destination,
            EXTRACT(MONTH FROM created_at) as month,
            COUNT(*) as month_count
          FROM quick_plan_usage_analytics
          WHERE created_at >= NOW() - INTERVAL '1 year'
          GROUP BY destination, EXTRACT(MONTH FROM created_at)
        )
        SELECT 
          ds.destination,
          ds.request_count,
          ds.success_rate,
          ds.avg_rating,
          ds.avg_generation_time
        FROM destination_stats ds
        ORDER BY ds.request_count DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      
      const destinations: PopularDestination[] = [];
      
      for (const row of result.rows) {
        // Get top interests for this destination
        const interestQuery = `
          SELECT 
            jsonb_array_elements_text(interests) as interest,
            COUNT(*) as count
          FROM quick_plan_usage_analytics
          WHERE destination = $1
          AND created_at >= NOW() - INTERVAL '3 months'
          GROUP BY interest
          ORDER BY count DESC
          LIMIT 5
        `;
        
        const interestResult = await pool.query(interestQuery, [row.destination]);
        
        // Get seasonal trends
        const seasonalQuery = `
          SELECT 
            EXTRACT(MONTH FROM created_at) as month,
            COUNT(*) as month_count
          FROM quick_plan_usage_analytics
          WHERE destination = $1
          AND created_at >= NOW() - INTERVAL '1 year'
          GROUP BY EXTRACT(MONTH FROM created_at)
          ORDER BY month
        `;
        
        const seasonalResult = await pool.query(seasonalQuery, [row.destination]);
        
        destinations.push({
          destination: row.destination,
          requestCount: parseInt(row.request_count),
          successRate: parseFloat(row.success_rate) || 0,
          averageRating: parseFloat(row.avg_rating) || 0,
          averageGenerationTime: parseFloat(row.avg_generation_time) || 0,
          topInterests: interestResult.rows.map(r => r.interest),
          seasonalTrends: seasonalResult.rows.map(r => ({
            month: parseInt(r.month),
            requestCount: parseInt(r.month_count)
          }))
        });
      }
      
      return destinations;
    } catch (error) {
      console.error('Error getting popular destinations:', error);
      return [];
    }
  }

  // Analyze feedback and collect insights
  static async analyzeFeedback(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<FeedbackAnalysis> {
    try {
      const timeCondition = this.getTimeCondition(timeframe);
      
      // Get basic feedback stats
      const feedbackQuery = `
        SELECT 
          COUNT(*) as total_feedback,
          AVG(user_satisfaction_score) as avg_rating,
          COUNT(CASE WHEN user_satisfaction_score >= 4 THEN 1 END) as positive_count,
          COUNT(CASE WHEN user_satisfaction_score = 3 THEN 1 END) as neutral_count,
          COUNT(CASE WHEN user_satisfaction_score <= 2 THEN 1 END) as negative_count
        FROM quick_plan_performance_sessions
        WHERE user_satisfaction_score IS NOT NULL
        AND created_at >= ${timeCondition}
      `;
      
      const feedbackResult = await pool.query(feedbackQuery);
      const stats = feedbackResult.rows[0];

      // Get common feedback themes (simplified keyword analysis)
      const themesQuery = `
        SELECT 
          user_feedback->>'comments' as comment,
          user_satisfaction_score
        FROM quick_plan_performance_sessions
        WHERE user_feedback->>'comments' IS NOT NULL
        AND LENGTH(user_feedback->>'comments') > 10
        AND created_at >= ${timeCondition}
        ORDER BY created_at DESC
        LIMIT 100
      `;
      
      const themesResult = await pool.query(themesQuery);
      
      // Simple keyword analysis for themes
      const themes = this.extractFeedbackThemes(themesResult.rows);
      
      const totalFeedback = parseInt(stats.total_feedback) || 0;
      
      return {
        totalFeedback,
        averageRating: parseFloat(stats.avg_rating) || 0,
        sentimentDistribution: {
          positive: totalFeedback > 0 ? (parseInt(stats.positive_count) / totalFeedback) * 100 : 0,
          neutral: totalFeedback > 0 ? (parseInt(stats.neutral_count) / totalFeedback) * 100 : 0,
          negative: totalFeedback > 0 ? (parseInt(stats.negative_count) / totalFeedback) * 100 : 0
        },
        commonThemes: themes,
        improvementSuggestions: this.generateImprovementSuggestions(themes)
      };
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        commonThemes: [],
        improvementSuggestions: []
      };
    }
  }

  // Create A/B test for algorithm improvements
  static async createABTest(
    testName: string,
    variants: Array<{ variantId: string; variantName: string; description: string }>,
    trafficSplit: number[] // e.g., [50, 50] for 50/50 split
  ): Promise<string> {
    try {
      const testId = uuidv4();
      
      const query = `
        INSERT INTO quick_plan_ab_tests (
          id, test_name, variants, traffic_split, 
          status, created_at
        )
        VALUES ($1, $2, $3, $4, 'active', NOW())
        RETURNING id
      `;
      
      await pool.query(query, [
        testId,
        testName,
        JSON.stringify(variants),
        JSON.stringify(trafficSplit)
      ]);

      console.log(`Created A/B test: ${testName} with ID: ${testId}`);
      return testId;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  // Get A/B test results
  static async getABTestResults(testId: string): Promise<ABTestResult | null> {
    try {
      // Get test details
      const testQuery = `
        SELECT test_name, variants, status, created_at
        FROM quick_plan_ab_tests
        WHERE id = $1
      `;
      
      const testResult = await pool.query(testQuery, [testId]);
      if (testResult.rows.length === 0) return null;
      
      const test = testResult.rows[0];
      const variants = JSON.parse(test.variants);

      // Get performance data for each variant
      const variantResults = [];
      
      for (const variant of variants) {
        const variantQuery = `
          SELECT 
            COUNT(DISTINCT ps.user_id) as user_count,
            SUM(CASE WHEN ps.stage = 'completed' THEN 1 ELSE 0 END)::float / COUNT(*) as conversion_rate,
            AVG(ps.user_satisfaction_score) as avg_rating,
            AVG(ps.generation_time) as avg_generation_time
          FROM quick_plan_performance_sessions ps
          WHERE ps.ab_test_variant = $1
          AND ps.created_at >= $2
        `;
        
        const variantResult = await pool.query(variantQuery, [variant.variantId, test.created_at]);
        const stats = variantResult.rows[0];
        
        variantResults.push({
          variantId: variant.variantId,
          variantName: variant.variantName,
          userCount: parseInt(stats.user_count) || 0,
          conversionRate: parseFloat(stats.conversion_rate) || 0,
          averageRating: parseFloat(stats.avg_rating) || 0,
          averageGenerationTime: parseFloat(stats.avg_generation_time) || 0
        });
      }

      // Calculate statistical significance (simplified)
      const statisticalSignificance = this.calculateStatisticalSignificance(variantResults);
      const winningVariant = this.determineWinningVariant(variantResults);
      
      return {
        testId,
        testName: test.test_name,
        variants: variantResults,
        statisticalSignificance,
        winningVariant,
        recommendation: this.generateABTestRecommendation(variantResults, statisticalSignificance)
      };
    } catch (error) {
      console.error('Error getting A/B test results:', error);
      return null;
    }
  }

  // Helper methods
  private static getTimeCondition(timeframe: 'week' | 'month' | 'quarter'): string {
    switch (timeframe) {
      case 'week':
        return "NOW() - INTERVAL '1 week'";
      case 'month':
        return "NOW() - INTERVAL '1 month'";
      case 'quarter':
        return "NOW() - INTERVAL '3 months'";
      default:
        return "NOW() - INTERVAL '1 month'";
    }
  }

  private static extractFeedbackThemes(feedbackRows: any[]): Array<{
    theme: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    examples: string[];
  }> {
    // Simple keyword-based theme extraction
    const themes = new Map<string, { count: number; sentiment: number; examples: string[] }>();
    
    const keywords = {
      'speed': ['fast', 'slow', 'quick', 'time', 'speed'],
      'accuracy': ['accurate', 'wrong', 'correct', 'precise', 'inaccurate'],
      'suggestions': ['suggestions', 'recommendations', 'places', 'options'],
      'interface': ['interface', 'ui', 'design', 'layout', 'usability'],
      'customization': ['customize', 'personalize', 'adjust', 'modify', 'change']
    };

    for (const row of feedbackRows) {
      const comment = row.comment.toLowerCase();
      const rating = parseFloat(row.user_satisfaction_score);
      const sentiment = rating >= 4 ? 1 : rating <= 2 ? -1 : 0;

      for (const [theme, words] of Object.entries(keywords)) {
        if (words.some(word => comment.includes(word))) {
          if (!themes.has(theme)) {
            themes.set(theme, { count: 0, sentiment: 0, examples: [] });
          }
          const themeData = themes.get(theme)!;
          themeData.count++;
          themeData.sentiment += sentiment;
          if (themeData.examples.length < 3) {
            themeData.examples.push(row.comment);
          }
        }
      }
    }

    return Array.from(themes.entries()).map(([theme, data]) => ({
      theme,
      count: data.count,
      sentiment: (data.sentiment > 0 ? 'positive' : data.sentiment < 0 ? 'negative' : 'neutral') as 'positive' | 'neutral' | 'negative',
      examples: data.examples
    })).sort((a, b) => b.count - a.count);
  }

  private static generateImprovementSuggestions(themes: any[]): string[] {
    const suggestions: string[] = [];
    
    for (const theme of themes) {
      if (theme.sentiment === 'negative') {
        switch (theme.theme) {
          case 'speed':
            suggestions.push('Optimize generation algorithms to improve response time');
            break;
          case 'accuracy':
            suggestions.push('Enhance place selection algorithms for better accuracy');
            break;
          case 'suggestions':
            suggestions.push('Improve suggestion quality and relevance');
            break;
          case 'interface':
            suggestions.push('Redesign user interface for better usability');
            break;
          case 'customization':
            suggestions.push('Add more customization options and flexibility');
            break;
        }
      }
    }
    
    return suggestions;
  }

  private static calculateStatisticalSignificance(variants: any[]): number {
    // Simplified statistical significance calculation
    // In a real implementation, you'd use proper statistical tests
    if (variants.length < 2) return 0;
    
    const [variantA, variantB] = variants;
    const sampleSizeA = variantA.userCount;
    const sampleSizeB = variantB.userCount;
    
    if (sampleSizeA < 30 || sampleSizeB < 30) return 0; // Insufficient sample size
    
    const conversionDiff = Math.abs(variantA.conversionRate - variantB.conversionRate);
    const minSampleSize = Math.min(sampleSizeA, sampleSizeB);
    
    // Simple heuristic: higher difference with larger sample size = higher significance
    return Math.min(0.95, (conversionDiff * minSampleSize) / 100);
  }

  private static determineWinningVariant(variants: any[]): string | undefined {
    if (variants.length === 0) return undefined;
    
    // Determine winner based on conversion rate and user satisfaction
    const scored = variants.map(v => ({
      ...v,
      score: (v.conversionRate * 0.6) + (v.averageRating / 5 * 0.4)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].variantId;
  }

  private static generateABTestRecommendation(variants: any[], significance: number): string {
    if (significance < 0.8) {
      return 'Continue test - insufficient statistical significance';
    }
    
    const winner = this.determineWinningVariant(variants);
    const winnerData = variants.find(v => v.variantId === winner);
    
    if (winnerData) {
      return `Implement variant ${winnerData.variantName} - shows ${(winnerData.conversionRate * 100).toFixed(1)}% conversion rate`;
    }
    
    return 'No clear winner - consider redesigning test';
  }
}