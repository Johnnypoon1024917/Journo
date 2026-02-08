import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useEnhancedAuthStore } from '../../stores/enhancedAuthStore';
import {
  FlagIcon,
  EyeSlashIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ModerationFlag {
  id: string;
  resource_type: 'trip' | 'story_item' | 'user';
  resource_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  resource: any;
  moderator: any;
}

export function TripModeration() {
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    resource_type: '',
    status: 'pending',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { accessToken } = useEnhancedAuthStore();

  const fetchFlags = async () => {
    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await adminService.getFlaggedContent(accessToken, filters);
      setFlags(data.flags);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching flags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flagged content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [accessToken, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleModerationAction = async (flagId: string, action: string, reason?: string) => {
    if (!accessToken) return;

    try {
      setActionLoading(flagId);
      await adminService.takeModerationAction(accessToken, flagId, action, reason);
      
      // Refresh flags list
      await fetchFlags();
      
      console.log(`Moderation action "${action}" completed successfully`);
    } catch (err) {
      console.error(`Error taking moderation action:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} content`);
    } finally {
      setActionLoading(null);
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'trip':
        return '🗺️';
      case 'story_item':
        return '📷';
      case 'user':
        return '👤';
      default:
        return '❓';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'reviewed':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'resolved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'dismissed':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Content Moderation
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Resource Type
            </label>
            <select
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All types</option>
              <option value="trip">Trips</option>
              <option value="story_item">Story Items</option>
              <option value="user">Users</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ resource_type: '', status: 'pending', page: 1, limit: 20 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Flagged Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Flagged Content ({pagination.total})
          </h2>
        </div>

        {flags.length === 0 ? (
          <div className="text-center py-12">
            <FlagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No flagged content</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No content matches your current filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {flags.map((flag) => (
              <div key={flag.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getResourceTypeIcon(flag.resource_type)}</span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {flag.resource_type === 'trip' && flag.resource?.title}
                          {flag.resource_type === 'story_item' && `Story Item (${flag.resource?.type})`}
                          {flag.resource_type === 'user' && flag.resource?.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {flag.resource_type === 'trip' && `Destination: ${flag.resource?.destination}`}
                          {flag.resource_type === 'story_item' && `Trip: ${flag.resource?.trip_title}`}
                          {flag.resource_type === 'user' && `Email: ${flag.resource?.email}`}
                        </p>
                      </div>
                      <span className={getStatusBadge(flag.status)}>
                        {flag.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Reason:</strong> {flag.reason}
                      </p>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                      <span>Flagged: {new Date(flag.created_at).toLocaleString()}</span>
                      {flag.moderator && (
                        <span>Reviewed by: {flag.moderator.name}</span>
                      )}
                    </div>
                  </div>

                  {flag.status === 'pending' && (
                    <div className="ml-6 flex space-x-2">
                      <button
                        onClick={() => handleModerationAction(flag.id, 'hide', 'Content hidden by moderator')}
                        disabled={actionLoading === flag.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                      >
                        <EyeSlashIcon className="h-3 w-3 mr-1" />
                        Hide
                      </button>

                      <button
                        onClick={() => handleModerationAction(flag.id, 'delete', 'Content deleted by moderator')}
                        disabled={actionLoading === flag.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Delete
                      </button>

                      {flag.resource_type === 'user' && (
                        <button
                          onClick={() => handleModerationAction(flag.id, 'warn', 'Warning sent to user')}
                          disabled={actionLoading === flag.id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                          Warn
                        </button>
                      )}

                      <button
                        onClick={() => handleModerationAction(flag.id, 'dismiss', 'Flag dismissed - no action needed')}
                        disabled={actionLoading === flag.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                      >
                        <XMarkIcon className="h-3 w-3 mr-1" />
                        Dismiss
                      </button>

                      {actionLoading === flag.id && (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                  )}

                  {flag.status !== 'pending' && (
                    <div className="ml-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      {flag.status === 'resolved' && <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />}
                      {flag.status === 'dismissed' && <XMarkIcon className="h-4 w-4 mr-1 text-gray-500" />}
                      {flag.status === 'reviewed' && <ClockIcon className="h-4 w-4 mr-1 text-blue-500" />}
                      {flag.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}