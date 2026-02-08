import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ComposedChart, Area, AreaChart
} from 'recharts';
import { quickPlanAnalyticsService, AnalyticsReport } from '../../services/quickPlanAnalyticsService';

interface QuickPlanBusinessIntelligenceProps {
  className?: string;
}

export const QuickPlanBusinessIntelligence: React.FC<QuickPlanBusinessIntelligenceProps> = ({ className = '' }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'sessions' | 'conversions' | 'satisfaction' | 'performance'>('sessions');

  useEffect(() => {
    loadBusinessIntelligence();
  }, [timeframe]);

  const loadBusinessIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analyticsReport = await quickPlanAnalyticsService.getAnalyticsReport(timeframe);
      setReport(analyticsReport);
    } catch (err) {
      console.error('Error loading business intelligence:', err);
      setError('Failed to load business intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Business Intelligence</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadBusinessIntelligence}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare business intelligence data
  const kpiData = [
    {
      name: 'User Engagement',
      current: report.summary.completionRate,
      target: 0.8,
      trend: 'up',
      format: 'percentage'
    },
    {
      name: 'Conversion Rate',
      current: report.summary.conversionRate,
      target: 0.6,
      trend: report.summary.conversionRate > 0.5 ? 'up' : 'down',
      format: 'percentage'
    },
    {
      name: 'User Satisfaction',
      current: report.summary.averageRating / 5,
      target: 0.8,
      trend: report.summary.averageRating > 4 ? 'up' : 'down',
      format: 'rating'
    }
  ];

  const destinationPerformanceData = report.usage.popularDestinations.slice(0, 10).map(dest => ({
    destination: dest.destination.length > 12 ? dest.destination.substring(0, 12) + '...' : dest.destination,
    requests: dest.requestCount,
    successRate: dest.successRate * 100,
    avgRating: dest.averageRating,
    avgTime: dest.averageGenerationTime,
    efficiency: (dest.successRate * dest.averageRating) / (dest.averageGenerationTime / 1000) * 100
  }));

  const usagePatternData = report.usage.patterns.slice(0, 8).map(pattern => ({
    destination: pattern.destination.length > 10 ? pattern.destination.substring(0, 10) + '...' : pattern.destination,
    requests: pattern.requestCount,
    completion: pattern.completionRate * 100,
    avgDuration: pattern.averageDuration / 60, // Convert to minutes
    budgetLevel: pattern.averageBudgetLevel
  }));

  const conversionFunnelData = [
    { stage: 'Form Started', value: report.summary.totalSessions, percentage: 100 },
    { stage: 'Suggestions Generated', value: Math.round(report.summary.totalSessions * report.summary.completionRate), percentage: report.summary.completionRate * 100 },
    { stage: 'Customizations Made', value: Math.round(report.summary.totalSessions * report.summary.completionRate * 0.7), percentage: report.summary.completionRate * 70 },
    { stage: 'Trips Created', value: Math.round(report.summary.totalSessions * report.summary.conversionRate), percentage: report.summary.conversionRate * 100 }
  ];

  const seasonalTrendsData = report.usage.popularDestinations[0]?.seasonalTrends.map(trend => ({
    month: new Date(2024, trend.month - 1).toLocaleDateString('en', { month: 'short' }),
    requests: trend.requestCount,
    monthNum: trend.month
  })) || [];

  const performanceCorrelationData = destinationPerformanceData.map(dest => ({
    name: dest.destination,
    generationTime: dest.avgTime,
    userSatisfaction: dest.avgRating,
    successRate: dest.successRate,
    requests: dest.requests
  }));

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Quick Plan Business Intelligence</h2>
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
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sessions">Sessions Analysis</option>
              <option value="conversions">Conversion Analysis</option>
              <option value="satisfaction">Satisfaction Analysis</option>
              <option value="performance">Performance Analysis</option>
            </select>
            <button
              onClick={loadBusinessIntelligence}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Executive Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Executive Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpiData.map((kpi, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium text-gray-600">{kpi.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    kpi.trend === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {kpi.trend === 'up' ? '↗' : '↘'}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {kpi.format === 'percentage' ? formatPercentage(kpi.current) :
                     kpi.format === 'rating' ? `${(kpi.current * 5).toFixed(1)}/5` :
                     kpi.current.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className={`h-2 rounded-full ${
                        kpi.current >= kpi.target ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    Target: {kpi.format === 'percentage' ? formatPercentage(kpi.target) :
                            kpi.format === 'rating' ? `${(kpi.target * 5).toFixed(1)}/5` :
                            kpi.target.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Analysis Based on Selected Metric */}
        {selectedMetric === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Usage Patterns by Destination</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={usagePatternData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="destination" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="requests" fill="#0088FE" name="Requests" />
                  <Line yAxisId="right" type="monotone" dataKey="completion" stroke="#00C49F" strokeWidth={3} name="Completion %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Seasonal Trends</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={seasonalTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="requests" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedMetric === 'conversions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={conversionFunnelData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={120} />
                  <Tooltip formatter={(value: number | undefined, name: string | undefined) => [value?.toLocaleString() || '0', name || '']} />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Destination Efficiency</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart data={destinationPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="successRate" name="Success Rate" unit="%" />
                  <YAxis dataKey="avgRating" name="Avg Rating" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Destinations" dataKey="requests" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedMetric === 'satisfaction' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Satisfaction vs Performance</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart data={performanceCorrelationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="generationTime" name="Generation Time" unit="ms" />
                  <YAxis dataKey="userSatisfaction" name="User Satisfaction" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Destinations" dataKey="requests" fill="#FF8042" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Top Feedback Themes</h3>
              <div className="space-y-3">
                {report.feedback.commonThemes.slice(0, 6).map((theme, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        theme.sentiment === 'positive' ? 'bg-green-500' :
                        theme.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="font-medium capitalize">{theme.theme}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{theme.count}</div>
                      <div className="text-xs text-gray-500">{theme.sentiment}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={destinationPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="destination" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgTime" stroke="#8884d8" name="Avg Generation Time (ms)" />
                  <Line type="monotone" dataKey="successRate" stroke="#82ca9d" name="Success Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Technical Performance</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-2">Cache Performance</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hit Rate:</span>
                      <span className="ml-2 font-medium">{formatPercentage(report.technical.cache.hitRate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Requests:</span>
                      <span className="ml-2 font-medium">{report.technical.cache.totalRequests.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-2">API Performance</h4>
                  <div className="space-y-2">
                    {report.technical.apis.slice(0, 3).map((api, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="capitalize">{api.service.replace('_', ' ')}</span>
                        <div className="text-right">
                          <div>{formatDuration(api.averageResponseTime)}</div>
                          <div className="text-xs text-gray-500">{formatPercentage(api.errorRate)} errors</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900">Business Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Key Opportunities</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Top destination "{report.summary.topDestination}" shows highest engagement</li>
                <li>• {formatPercentage(report.summary.conversionRate)} conversion rate indicates strong product-market fit</li>
                <li>• Cache hit rate of {formatPercentage(report.technical.cache.hitRate)} optimizes performance costs</li>
                <li>• Average satisfaction of {report.summary.averageRating.toFixed(1)}/5 shows user value</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Recommended Actions</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {report.feedback.improvementSuggestions.slice(0, 4).map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              <strong>Strategic Focus:</strong> With {report.summary.totalSessions.toLocaleString()} sessions and {formatPercentage(report.summary.completionRate)} completion rate, 
              Quick Plan is demonstrating strong user engagement. Focus on optimizing the {formatPercentage(1 - report.summary.conversionRate)} of users who generate suggestions but don't create trips.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickPlanBusinessIntelligence;