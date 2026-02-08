import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import {
  MapPinIcon,
  HeartIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { LineChart } from './charts/LineChart';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { AreaChart } from './charts/AreaChart';

interface AnalyticsInsights {
  top_destinations: Array<{
    destination: string;
    trip_count: number;
    total_likes: number;
    total_views: number;
  }>;
  most_liked_trips: Array<{
    id: string;
    title: string;
    destination: string;
    likes_count: number;
    views_count: number;
    owner_name: string;
    owner_email: string;
  }>;
  event_counts: Array<{
    event_name: string;
    count: number;
  }>;
  conversion_funnel: {
    trips_created: number;
    trips_shared: number;
    community_posted: number;
    share_rate: number;
    community_rate: number;
  };
  suggestions?: {
    stats: {
      suggestion_views: number;
      suggestion_clicks: number;
      quick_plans: number;
      unique_destinations: number;
      click_rate: number;
      conversion_rate: number;
    };
    top_suggestions: Array<{
      destination: string;
      country: string;
      total_interactions: number;
      views: number;
      clicks: number;
      quick_plans: number;
    }>;
  };
}

export function Analytics() {
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { accessToken } = useEnhancedAuthStore();

  // Generate mock trend data for enhanced visualizations
  const generateTrendData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: Math.floor(Math.random() * 200) + 100,
        trips: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 2000) + 1000,
        engagement: Math.floor(Math.random() * 80) + 20,
      });
    }
    return data;
  };

  const fetchInsights = async () => {
    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await adminService.getAnalyticsInsights(accessToken);
      setInsights(data);
    } catch (err) {
      console.error('Error fetching analytics insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading analytics: {error}</p>
        <button
          onClick={fetchInsights}
          className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">No analytics data available</p>
      </div>
    );
  }

  const trendData = generateTrendData();
  
  // Prepare chart data
  const destinationChartData = insights.top_destinations.slice(0, 8).map(dest => ({
    name: dest.destination,
    trips: dest.trip_count,
    likes: dest.total_likes,
    views: dest.total_views,
  }));

  const engagementData = insights.most_liked_trips.slice(0, 6).map(trip => ({
    name: trip.title.length > 20 ? trip.title.substring(0, 20) + '...' : trip.title,
    likes: trip.likes_count,
    views: trip.views_count,
  }));

  const eventDistribution = insights.event_counts.slice(0, 8).map(event => ({
    name: event.event_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: event.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Deep Dive
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into user behavior and platform performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${trendData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-2">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {insights.conversion_funnel.share_rate}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-600 font-medium">+3.2%</span>
            <span className="text-gray-500 ml-2">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Engagement</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(trendData.reduce((sum, item) => sum + item.engagement, 0) / trendData.length)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <HeartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600 font-medium">+8.1%</span>
            <span className="text-gray-500 ml-2">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Global Reach</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {insights.top_destinations.length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <GlobeAltIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-orange-600 font-medium">+5 new</span>
            <span className="text-gray-500 ml-2">destinations</span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          User Journey & Conversion Funnel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <UsersIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{insights.conversion_funnel.trips_created}</div>
              <div className="text-blue-100">Trips Created</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <ArrowTrendingUpIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{insights.conversion_funnel.trips_shared}</div>
              <div className="text-green-100">
                Trips Shared ({insights.conversion_funnel.share_rate}%)
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <HeartIcon className="h-8 w-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{insights.conversion_funnel.community_posted}</div>
              <div className="text-purple-100">
                Community Posts ({insights.conversion_funnel.community_rate}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            User Activity Trends
          </h2>
          <AreaChart
            data={trendData}
            areas={[
              { dataKey: 'users', stroke: '#3B82F6', fill: '#3B82F6', name: 'Active Users' },
              { dataKey: 'trips', stroke: '#10B981', fill: '#10B981', name: 'Trips Created' },
            ]}
            xAxisKey="date"
            height={300}
            stacked={false}
          />
        </div>

        {/* Revenue Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Revenue & Engagement
          </h2>
          <LineChart
            data={trendData}
            lines={[
              { dataKey: 'revenue', stroke: '#8B5CF6', name: 'Revenue ($)' },
              { dataKey: 'engagement', stroke: '#F59E0B', name: 'Engagement (%)' },
            ]}
            xAxisKey="date"
            height={300}
          />
        </div>

        {/* Top Destinations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2" />
            Top Destinations Performance
          </h2>
          <BarChart
            data={destinationChartData}
            bars={[
              { dataKey: 'trips', fill: '#3B82F6', name: 'Trips' },
              { dataKey: 'likes', fill: '#10B981', name: 'Likes' },
            ]}
            xAxisKey="name"
            height={300}
            layout="vertical"
          />
        </div>

        {/* Event Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            User Activity Distribution
          </h2>
          <PieChart
            data={eventDistribution}
            height={300}
            innerRadius={60}
            outerRadius={100}
          />
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Destinations Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Top Destinations
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {insights.top_destinations.slice(0, 8).map((destination, index) => (
                <div key={destination.destination} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {destination.destination}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {destination.trip_count} trips
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <HeartIcon className="h-3 w-3 mr-1" />
                        {destination.total_likes}
                      </span>
                      <span className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {destination.total_views}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Liked Trips */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <HeartIcon className="h-5 w-5 mr-2" />
              Most Engaging Content
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {insights.most_liked_trips.slice(0, 8).map((trip, index) => (
                <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {trip.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {trip.destination} • by {trip.owner_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <HeartIcon className="h-3 w-3 mr-1" />
                        {trip.likes_count}
                      </span>
                      <span className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {trip.views_count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion Analytics */}
      {insights.suggestions && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
              Destination Suggestions Performance
            </h2>
          </div>
          <div className="p-6">
            {/* Suggestion Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {insights.suggestions.stats.suggestion_views.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Views</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {insights.suggestions.stats.suggestion_clicks.toLocaleString()}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Clicks ({insights.suggestions.stats.click_rate}%)
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {insights.suggestions.stats.quick_plans.toLocaleString()}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Quick Plans ({insights.suggestions.stats.conversion_rate}%)
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {insights.suggestions.stats.unique_destinations.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Destinations</div>
              </div>
            </div>

            {/* Top Suggestions */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Top Performing Suggestions
              </h3>
              <div className="space-y-3">
                {insights.suggestions.top_suggestions.slice(0, 8).map((suggestion, index) => (
                  <div key={`${suggestion.destination}-${suggestion.country}`} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {index + 1}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {suggestion.destination}, {suggestion.country}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {suggestion.total_interactions} total interactions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">{suggestion.views}</div>
                        <div>views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">{suggestion.clicks}</div>
                        <div>clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">{suggestion.quick_plans}</div>
                        <div>plans</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}