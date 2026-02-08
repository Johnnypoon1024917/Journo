import { useState, useEffect } from 'react';
import { offlineMapsService } from '../../services/offlineMapsService';
import { OfflineMapRegion, OfflineMapDownloadProgress } from '../../types/offline';
import { Place } from '../../types/trip';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface OfflineMapsManagerProps {
  tripId: string;
  tripName: string;
  places: Place[];
  isOpen: boolean;
  onClose: () => void;
}

export default function OfflineMapsManager({
  tripId,
  tripName,
  places,
  isOpen,
  onClose,
}: OfflineMapsManagerProps) {
  const [hasOfflineMaps, setHasOfflineMaps] = useState(false);
  const [region, setRegion] = useState<OfflineMapRegion | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<OfflineMapDownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storageSize, setStorageSize] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      checkOfflineMaps();
      updateStorageSize();
    }
  }, [isOpen, tripId]);

  const checkOfflineMaps = async () => {
    try {
      const exists = await offlineMapsService.hasOfflineMaps(tripId);
      setHasOfflineMaps(exists);
      
      if (exists) {
        const regionData = await offlineMapsService.getOfflineMapRegion(tripId);
        setRegion(regionData);
      }
    } catch (err) {
      console.error('Error checking offline maps:', err);
    }
  };

  const updateStorageSize = async () => {
    try {
      const size = await offlineMapsService.getStorageSize();
      setStorageSize(size);
    } catch (err) {
      console.error('Error getting storage size:', err);
    }
  };

  const handleDownload = async () => {
    if (places.length === 0) {
      setError('No places with coordinates found. Add places to your trip first.');
      return;
    }

    setIsDownloading(true);
    setError(null);
    setDownloadProgress(null);

    try {
      const newRegion = await offlineMapsService.downloadMapTiles(
        tripId,
        tripName,
        places,
        [12, 13, 14], // Zoom levels
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      setRegion(newRegion);
      setHasOfflineMaps(true);
      await updateStorageSize();
    } catch (err) {
      console.error('Error downloading maps:', err);
      setError(err instanceof Error ? err.message : 'Failed to download maps');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete offline maps for this trip?')) {
      return;
    }

    try {
      await offlineMapsService.deleteOfflineMaps(tripId);
      setHasOfflineMaps(false);
      setRegion(null);
      await updateStorageSize();
    } catch (err) {
      console.error('Error deleting maps:', err);
      setError('Failed to delete offline maps');
    }
  };

  const handleCancel = () => {
    offlineMapsService.cancelDownload(tripId);
    setIsDownloading(false);
    setDownloadProgress(null);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Offline Maps">
      <div className="space-y-6">
        {/* Status Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </span>
            {hasOfflineMaps ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Available
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                Not Downloaded
              </span>
            )}
          </div>
          
          {region && (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Tiles:</span>
                <span className="font-medium">{region.tile_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{formatBytes(region.size_bytes)}</span>
              </div>
              <div className="flex justify-between">
                <span>Downloaded:</span>
                <span className="font-medium">{formatDate(region.downloaded_at)}</span>
              </div>
              {region.last_accessed && (
                <div className="flex justify-between">
                  <span>Last Used:</span>
                  <span className="font-medium">{formatDate(region.last_accessed)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total Storage */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Storage Used
              </span>
            </div>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatBytes(storageSize)}
            </span>
          </div>
        </div>

        {/* Download Progress */}
        {isDownloading && downloadProgress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Downloading maps...
              </span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {downloadProgress.progress_percent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress.progress_percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {downloadProgress.downloaded_tiles} / {downloadProgress.total_tiles} tiles
              </span>
              {downloadProgress.failed_tiles > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  {downloadProgress.failed_tiles} failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">About Offline Maps</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Maps will be available when you're offline</li>
                <li>Downloads may take a few minutes depending on trip size</li>
                <li>Requires stable internet connection to download</li>
                <li>Maps are stored locally on your device</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!hasOfflineMaps && !isDownloading && (
            <Button
              onClick={handleDownload}
              className="flex-1"
              disabled={places.length === 0}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Maps
            </Button>
          )}

          {isDownloading && (
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
            >
              Cancel Download
            </Button>
          )}

          {hasOfflineMaps && !isDownloading && (
            <>
              <Button
                onClick={handleDownload}
                variant="secondary"
                className="flex-1"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update Maps
              </Button>
              <Button
                onClick={handleDelete}
                variant="secondary"
                className="flex-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Maps
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
