import { useState, useEffect } from 'react';
import { versionService, TripVersion } from '../../services/versionService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface VersionHistoryProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export function VersionHistory({ tripId, isOpen, onClose, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<TripVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tripId) {
      loadVersionHistory();
    }
  }, [isOpen, tripId]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await versionService.getVersionHistory(tripId);
      setVersions(response.data);
    } catch (err: any) {
      console.error('Error loading version history:', err);
      setError(err.response?.data?.error || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string, versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore version ${versionNumber}? This will create a new snapshot of the current state before restoring.`)) {
      return;
    }

    try {
      setRestoring(true);
      setError(null);
      await versionService.restoreVersion(tripId, versionId);
      onRestore();
      onClose();
    } catch (err: any) {
      console.error('Error restoring version:', err);
      setError(err.response?.data?.error || 'Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Version History">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No version history available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Versions are created automatically when you make changes
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Version {version.version_number}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    
                    {version.change_description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {version.change_description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                      <span>{getRelativeTime(version.created_at)}</span>
                      {version.created_by_name && (
                        <span>by {version.created_by_name}</span>
                      )}
                    </div>
                  </div>

                  {index !== 0 && (
                    <Button
                      onClick={() => handleRestore(version.id, version.version_number)}
                      disabled={restoring}
                      variant="secondary"
                      size="sm"
                    >
                      {restoring ? 'Restoring...' : 'Restore'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
