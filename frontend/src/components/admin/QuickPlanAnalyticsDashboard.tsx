import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { quickPlanAnalyticsService, PerformanceDashboard, UsagePattern, ConversionMetrics, PopularDestination, FeedbackAnalysis } from '../../services/quickPlanAnalyticsService';

interface QuickPlanAnalyticsDashboardProps {
  className?: string;
}

export const QuickPlanAnalyticsDashboard: React.FC<QuickPlanAnalyticsDashboardProps> = ({ className = '' }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for different analytics data
  const [performanceDashboard, setPerformanceDashboard] = useState<PerformanceDashboard | null>(null);
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([]);
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([]);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<FeedbackAnalysis | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        performance,
        usage,
        conversions,
        destinations,
        feedback
      ] = await Promise.all([
        quickPlanAnalyticsService.getPerformanceDashboard(timeframe === 'quarter' ? 'month' : timeframe),
        quickPlanAnalyticsService.getUsagePatterns(timeframe),
        quickPlanAnalyticsService.getConversionMetrics(timeframe),
        quickPlanAnalyticsService.getPopularDestinations(10),
        quickPlanAnalyticsService.analyzeFeedback(timeframe)
      ]);

      setPerformanceDashboard(performance);
      setUsagePatterns(usage);
      setConversionMetrics(conversions);
      setPopularDestinations(destinations);
      setFeedbackAnalysis(feedback);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Analytics</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadAnalyticsData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const destinationChartData = popularDestinations.slice(0, 8).map(dest => ({
    name: dest.destination.length > 15 ? dest.destination.substring(0, 15) + '...' : dest.destination,
    requests: dest.requestCount,
    successRate: dest.successRate * 100,
    avgRating: dest.averageRating
  }));

  const conversionChartData = conversionMetrics ? [
    { name: 'Suggestions Generated', value: conversionMetrics.totalSuggestions, color: '#0088FE' },
    { name: 'Trips Created', value: conversionMetrics.tripsCreated, color: '#00C49F' },
    { name: 'Abandoned', value: conversionMetrics.totalSuggestions - conversionMetrics.tripsCreated, color: '#FF8042' }
  ] : [];

  const satisfactionData = feedbackAnalysis ? [
    { name: 'Positive', value: feedbackAnalysis.sentimentDistribution.positive, color: '#00C49F' },
    { name: 'Neutral', value: feedbackAnalysis.sentimentDistribution.neutral, color: '#FFBB28' },
    { name: 'Negative', value: feedbackAnalysis.sentimentDistribution.negative, color: '#FF8042' }
  ] : [];

  const interestTrendsData = usagePatterns.slice(0, 5).map(pattern => {
    const topInterests = pattern.popularInterests.slice(0, 3);
    return {
      destination: pattern.destination,
      ...topInterests.reduce((acc, interest, index) => {
        acc[`interest${index + 1}`] = interest.percentage;
        return acc;
      }, {} as Record<string, number>)
    };
  });

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Quick Plan Analytics Dashboard</h2>
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'quarter')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
            <button
              onClick={loadAnalyticsData}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        {performanceDashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <h3 className="text-sm font-medium opacity-90">Total Sessions</h3>
              <p className="text-2xl font-bold">{performanceDashboard.overview.totalSessions.toLocaleString()}</p>
              <p className="text-xs opacity-75">Quick Plan attempts</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <h3 className="text-sm font-medium opacity-90">Completion Rate</h3>
              <p className="text-2xl font-bold">{formatPercentage(performanceDashboard.overview.completionRate)}</p>
              <p className="text-xs opacity-75">Successfully completed</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <h3 className="text-sm font-medium opacity-90">Avg Generation Time</h3>
              <p className="text-2xl font-bold">{formatDuration(performanceDashboard.overview.averageGenerationTime)}</p>
              <p className="text-xs opacity-75">Time to generate suggestions</p>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
              <h3 className="text-sm font-medium opacity-90">User Satisfaction</h3>
              <p className="text-2xl font-bold">{performanceDashboard.overview.averageUserSatisfaction.toFixed(1)}/5</p>
              <p className="text-xs opacity-75">Average rating</p>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Popular Destinations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Popular Destinations</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={destinationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#0088FE" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conversionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name || ''}: ${props.value || 0} (${((props.percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {conversionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* User Satisfaction Distribution */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">User Satisfaction</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={satisfactionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name || ''}: ${(props.value || 0).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => `${(value || 0).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Interest Trends by Destination */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Interest Trends by Destination</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={interestTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="destination" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="interest1" stackId="1" stroke="#0088FE" fill="#0088FE" name="Top Interest" />
                <Area type="monotone" dataKey="interest2" stackId="1" stroke="#00C49F" fill="#00C49F" name="2nd Interest" />
                <Area type="monotone" dataKey="interest3" stackId="1" stroke="#FFBB28" fill="#FFBB28" name="3rd Interest" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        {performanceDashboard && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Cache Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Hit Rate:</span>
                  <span className="font-medium">{formatPercentage(performanceDashboard.cacheMetrics.hitRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Requests:</span>
                  <span className="font-medium">{performanceDashboard.cacheMetrics.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time:</span>
                  <span className="font-medium">{formatDuration(performanceDashboard.cacheMetrics.averageResponseTime)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">API Performance</h3>
              <div className="space-y-3">
                {performanceDashboard.apiMetrics.slice(0, 3).map((api, index) => (
                  <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{api.service}</span>
                      <span className="text-xs text-gray-500">{formatDuration(api.averageResponseTime)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{api.totalCalls} calls</span>
                      <span>{formatPercentage(api.errorRate)} error rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
              <div className="space-y-2">
                {performanceDashboard.recentAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className={`p-2 rounded text-xs ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    <div className="font-medium">{alert.alertType.replace('_', ' ').toUpperCase()}</div>
                    <div className="truncate">{alert.message}</div>
                    <div className="text-xs opacity-75">{new Date(alert.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
                {performanceDashboard.recentAlerts.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">No recent alerts</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conversion Metrics Details */}
        {conversionMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Most Removed Place Types</h3>
              <div className="space-y-2">
                {conversionMetrics.mostRemovedPlaceTypes.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{item.placeType.replace('_', ' ')}</span>
                    <span className="font-medium">{item.removalCount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Most Requested Place Types</h3>
              <div className="space-y-2">
                {conversionMetrics.mostRequestedPlaceTypes.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{item.placeType.replace('_', ' ')}</span>
                    <span className="font-medium">{item.requestCount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feedback Insights */}
        {feedbackAnalysis && feedbackAnalysis.commonThemes.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Feedback Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedbackAnalysis.commonThemes.slice(0, 6).map((theme, index) => (
                <div key={index} className={`p-3 rounded border-l-4 ${
                  theme.sentiment === 'positive' ? 'border-green-500 bg-green-50' :
                  theme.sentiment === 'negative' ? 'border-red-500 bg-red-50' :
                  'border-yellow-500 bg-yellow-50'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium capitalize">{theme.theme}</span>
                    <span className="text-sm text-gray-600">{theme.count}</span>
                  </div>
                  <div className={`text-xs ${
                    theme.sentiment === 'positive' ? 'text-green-700' :
                    theme.sentiment === 'negative' ? 'text-red-700' :
                    'text-yellow-700'
                  }`}>
                    {theme.sentiment} sentiment
                  </div>
                </div>
              ))}
            </div>
            
            {feedbackAnalysis.improvementSuggestions.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-900 mb-2">Improvement Suggestions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {feedbackAnalysis.improvementSuggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickPlanAnalyticsDashboard;