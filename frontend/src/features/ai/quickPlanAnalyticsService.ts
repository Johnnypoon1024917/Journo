import api from './api';

export interface PerformanceDashboard {
  overview: {
    totalSessions: number;
    completionRate: number;
    averageGenerationTime: number;
    averageUserSatisfaction: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    averageResponseTime: number;
    popularDestinations: Array<{
      destination: string;
      requestCount: number;
      hitRate: number;
    }>;
  };
  apiMetrics: Array<{
    service: string;
    totalCalls: number;
    averageResponseTime: number;
    errorRate: number;
    timeoutRate: number;
  }>;
  satisfactionMetrics: {
    averageRating: number;
    totalResponses: number;
    ratingDistribution: Record<number, number>;
    completionRate: number;
    commonFeedback: Array<{ comment: string; count: number }>;
  };
  recentAlerts: Array<{
    id: string;
    alertType: string;
    severity: string;
    message: string;
    threshold: number;
    actualValue: number;
    destination?: string;
    createdAt: string;
    resolved: boolean;
  }>;
}

export interface UsagePattern {
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

export interface AnalyticsReport {
  timeframe: string;
  generatedAt: string;
  performance: PerformanceDashboard;
  usage: {
    patterns: UsagePattern[];
    conversions: ConversionMetrics;
    popularDestinations: PopularDestination[];
  };
  feedback: FeedbackAnalysis;
  technical: {
    cache: PerformanceDashboard['cacheMetrics'];
    apis: PerformanceDashboard['apiMetrics'];
  };
  summary: {
    totalSessions: number;
    completionRate: number;
    conversionRate: number;
    averageRating: number;
    cacheHitRate: number;
    topDestination: string;
  };
}

class QuickPlanAnalyticsService {
  // Performance monitoring methods
  async getPerformanceDashboard(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<PerformanceDashboard> {
    const response = await api.get<{ success: boolean; data: PerformanceDashboard }>(`/quick-plan-analytics/performance/dashboard?timeframe=${timeframe}`);
    return response.data;
  }

  async getCacheMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<PerformanceDashboard['cacheMetrics']> {
    const response = await api.get<{ success: boolean; data: PerformanceDashboard['cacheMetrics'] }>(`/quick-plan-analytics/performance/cache?timeframe=${timeframe}`);
    return response.data;
  }

  async getApiMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<PerformanceDashboard['apiMetrics']> {
    const response = await api.get<{ success: boolean; data: PerformanceDashboard['apiMetrics'] }>(`/quick-plan-analytics/performance/api?timeframe=${timeframe}`);
    return response.data;
  }

  async getUserSatisfactionMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<PerformanceDashboard['satisfactionMetrics']> {
    const response = await api.get<{ success: boolean; data: PerformanceDashboard['satisfactionMetrics'] }>(`/quick-plan-analytics/performance/satisfaction?timeframe=${timeframe}`);
    return response.data;
  }

  // Analytics methods
  async getUsagePatterns(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<UsagePattern[]> {
    const response = await api.get<{ success: boolean; data: UsagePattern[] }>(`/quick-plan-analytics/usage/patterns?timeframe=${timeframe}`);
    return response.data;
  }

  async getConversionMetrics(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<ConversionMetrics> {
    const response = await api.get<{ success: boolean; data: ConversionMetrics }>(`/quick-plan-analytics/usage/conversions?timeframe=${timeframe}`);
    return response.data;
  }

  async getPopularDestinations(limit: number = 20): Promise<PopularDestination[]> {
    const response = await api.get<{ success: boolean; data: PopularDestination[] }>(`/quick-plan-analytics/usage/destinations?limit=${limit}`);
    return response.data;
  }

  async getUserCustomizationPatterns(userId?: string, limit: number = 100): Promise<Array<{
    userId: string;
    totalSessions: number;
    averageCustomizations: number;
    preferredInterests: string[];
    preferredBudgetLevel: string;
    preferredTravelStyle: string;
    customizationTypes: Array<{
      type: string;
      count: number;
    }>;
  }>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (userId) params.append('userId', userId);
    
    const response = await api.get<{ success: boolean; data: any[] }>(`/quick-plan-analytics/usage/customizations?${params}`);
    return response.data;
  }

  // Feedback analysis
  async analyzeFeedback(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<FeedbackAnalysis> {
    const response = await api.get<{ success: boolean; data: FeedbackAnalysis }>(`/quick-plan-analytics/feedback/analysis?timeframe=${timeframe}`);
    return response.data;
  }

  async submitUserFeedback(sessionId: string, rating: number, comments?: string): Promise<void> {
    await api.post('/quick-plan-analytics/feedback/submit', {
      sessionId,
      rating,
      comments
    });
  }

  // A/B testing methods
  async createABTest(
    testName: string,
    variants: Array<{ variantId: string; variantName: string; description: string }>,
    trafficSplit: number[]
  ): Promise<{ testId: string }> {
    const response = await api.post<{ success: boolean; data: { testId: string } }>('/quick-plan-analytics/ab-tests', {
      testName,
      variants,
      trafficSplit
    });
    return response.data;
  }

  async getABTestResults(testId: string): Promise<ABTestResult> {
    const response = await api.get<{ success: boolean; data: ABTestResult }>(`/quick-plan-analytics/ab-tests/${testId}/results`);
    return response.data;
  }

  // Comprehensive analytics report
  async getAnalyticsReport(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<AnalyticsReport> {
    const response = await api.get<{ success: boolean; data: AnalyticsReport }>(`/quick-plan-analytics/report?timeframe=${timeframe}`);
    return response.data;
  }

  // Utility methods for tracking (called automatically by Quick Plan components)
  async trackQuickPlanStarted(destination: string, interests: string[], budgetLevel: string): Promise<void> {
    // This would be called automatically when user starts Quick Plan
    // Implementation would depend on how you want to track this
    console.log('Quick Plan started:', { destination, interests, budgetLevel });
  }

  async trackSuggestionsGenerated(sessionId: string, placesCount: number, generationTime: number): Promise<void> {
    // This would be called automatically when suggestions are generated
    console.log('Suggestions generated:', { sessionId, placesCount, generationTime });
  }

  async trackCustomization(sessionId: string, customizationType: string, customizationData: any): Promise<void> {
    // This would be called automatically when user customizes suggestions
    console.log('Customization tracked:', { sessionId, customizationType, customizationData });
  }

  async trackTripCreated(sessionId: string, tripId: string, suggestionsCount: number): Promise<void> {
    // This would be called automatically when trip is created from suggestions
    console.log('Trip created from Quick Plan:', { sessionId, tripId, suggestionsCount });
  }
}

// Create singleton instance
export const quickPlanAnalyticsService = new QuickPlanAnalyticsService();
export default quickPlanAnalyticsService;