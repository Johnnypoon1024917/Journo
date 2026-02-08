import { useEffect, useState } from 'react';
import { offlineMapsService } from '../../services/offlineMapsService';

interface OfflineMapsBadgeProps {
  tripId: string;
  onClick?: () => void;
}

export default function OfflineMapsBadge({ tripId, onClick }: OfflineMapsBadgeProps) {
  const [hasOfflineMaps, setHasOfflineMaps] = useState(false);

  useEffect(() => {
    checkOfflineMaps();
  }, [tripId]);

  const checkOfflineMaps = async () => {
    try {
      const exists = await offlineMapsService.hasOfflineMaps(tripId);
      setHasOfflineMaps(exists);
    } catch (err) {
      console.error('Error checking offline maps:', err);
    }
  };

  if (!hasOfflineMaps) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
      title="Offline maps available"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>Offline Maps</span>
    </button>
  );
}
