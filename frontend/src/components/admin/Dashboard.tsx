import { useEffect, useState } from 'react';
import { AdminDashboardMetrics } from '../../types/admin';
import { adminService } from '../../services/adminService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import {
  UsersIcon,
  DocumentTextIcon,
  HeartIcon,
  CloudArrowDownIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { LineChart } from './charts/LineChart';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';
import { AreaChart } from './charts/AreaChart';

export function Dashboard() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const { accessToken } = useEnhancedAuthStore();

  // Generate mock time series data for charts
  const generateTimeSeriesData = () => {
    const now = new Date();
    const data = [];
    const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    
    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now);
      if (timeRange === '24h') {
        date.setHours(date.getHours() - i);
      } else if (timeRange === '7d') {
        date.setDate(date.getDate() - i);
      } else {
        date.setDate(date.getDate() - i);
      }
      
      data.push({
        time: timeRange === '24h' 
          ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: Math.floor(Math.random() * 100) + 50,
        trips: Math.floor(Math.random() * 30) + 10,
        errors: Math.floor(Math.random() * 5),
        revenue: Math.floor(Math.random() * 1000) + 500,
      });
    }
    return data;
  };

  const fetchMetrics = async () => {
    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await adminService.getDashboardMetrics(accessToken);
      setMetrics(data);
      setRealTimeData(generateTimeSeriesData());
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000);
    
    // Update real-time data every 5 seconds
    const realTimeInterval = setInterval(() => {
      setRealTimeData(generateTimeSeriesData());
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(realTimeInterval);
    };
  }, [accessToken, timeRange]);

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
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchMetrics}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">No metrics data available</p>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Daily Active Users',
      value: metrics.dau.toLocaleString(),
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Users active in last 24h',
    },
    {
      name: 'Monthly Active Users',
      value: metrics.mau.toLocaleString(),
      change: '+8.2%',
      changeType: 'increase' as const,
      icon: GlobeAltIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Users active in last 30 days',
    },
    {
      name: 'Trips Created Today',
      value: metrics.trips_created_today.toString(),
      change: '+15.3%',
      changeType: 'increase' as const,
      icon: DocumentTextIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: `${metrics.trips_created_total} total trips`,
    },
    {
      name: 'Community Engagement',
      value: `${metrics.community_posts_today}`,
      change: '+22.1%',
      changeType: 'increase' as const,
      icon: HeartIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      description: `${metrics.community_posts_total} total posts`,
    },
    {
      name: 'Storage Used',
      value: `${metrics.storage_used_gb} GB`,
      change: '+2.1%',
      changeType: 'increase' as const,
      icon: ServerIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Total storage consumption',
    },
    {
      name: 'API Errors',
      value: metrics.api_errors_today.toLocaleString(),
      change: metrics.api_errors_today > 10 ? '+5.2%' : '-12.3%',
      changeType: metrics.api_errors_today > 10 ? 'increase' as const : 'decrease' as const,
      icon: ExclamationTriangleIcon,
      color: metrics.api_errors_today > 10 ? 'text-red-600' : 'text-yellow-600',
      bgColor: metrics.api_errors_today > 10 ? 'bg-red-100' : 'bg-yellow-100',
      description: 'Errors in last 24h',
    },
  ];

  // Chart data
  const userGrowthData = realTimeData;
  
  const topDestinationsData = [
    { name: 'Paris', trips: 145, revenue: 12500 },
    { name: 'Tokyo', trips: 132, revenue: 11200 },
    { name: 'New York', trips: 128, revenue: 10800 },
    { name: 'London', trips: 98, revenue: 8900 },
    { name: 'Barcelona', trips: 87, revenue: 7600 },
  ];

  const deviceBreakdownData = [
    { name: 'Mobile', value: 65, color: '#3B82F6' },
    { name: 'Desktop', value: 28, color: '#10B981' },
    { name: 'Tablet', value: 7, color: '#F59E0B' },
  ];

  const revenueData = realTimeData.map(item => ({
    ...item,
    revenue: item.revenue,
    subscriptions: Math.floor(item.revenue * 0.3),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights and analytics for your platform
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`flex items-center text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'increase' ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {stat.change}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Activity
            </h2>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <AreaChart
            data={userGrowthData}
            areas={[
              { dataKey: 'users', stroke: '#3B82F6', fill: '#3B82F6', name: 'Active Users' },
              { dataKey: 'trips', stroke: '#10B981', fill: '#10B981', name: 'Trips Created' },
            ]}
            xAxisKey="time"
            height={300}
            stacked={false}
          />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Trends
            </h2>
            <div className="text-sm text-gray-500">
              Total: ${revenueData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </div>
          </div>
          <LineChart
            data={revenueData}
            lines={[
              { dataKey: 'revenue', stroke: '#8B5CF6', name: 'Total Revenue' },
              { dataKey: 'subscriptions', stroke: '#F59E0B', name: 'Subscriptions' },
            ]}
            xAxisKey="time"
            height={300}
          />
        </div>

        {/* Top Destinations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Top Destinations
          </h2>
          <BarChart
            data={topDestinationsData}
            bars={[
              { dataKey: 'trips', fill: '#3B82F6', name: 'Trips' },
            ]}
            xAxisKey="name"
            height={300}
            layout="vertical"
          />
        </div>

        {/* Device Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Device Usage
          </h2>
          <PieChart
            data={deviceBreakdownData}
            height={300}
            innerRadius={60}
            outerRadius={100}
          />
        </div>
      </div>

      {/* Active Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Active Users
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Users who have been active in the last 24 hours
          </p>
        </div>
        <div className="p-6">
          {metrics.active_users.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mt-2">No active users in the last 24 hours</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trips
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {metrics.active_users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {user.trip_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.last_active).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                          Online
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}