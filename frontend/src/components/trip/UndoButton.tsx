import { useState } from 'react';
import { versionService } from '../../services/versionService';

interface UndoButtonProps {
  tripId: string;
  onUndo: () => void;
  className?: string;
}

export function UndoButton({ tripId, onUndo, className = '' }: UndoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUndo = async () => {
    if (!confirm('Are you sure you want to undo the last change? This will revert to the previous version.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await versionService.undo(tripId);
      onUndo();
    } catch (err: any) {
      console.error('Error undoing changes:', err);
      const errorMessage = err.response?.data?.error || 'Failed to undo changes';
      setError(errorMessage);
      
      // Show error in alert if no previous version
      if (errorMessage.includes('No previous version')) {
        alert('No previous version available to undo');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleUndo}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Undo last change"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
        {loading ? 'Undoing...' : 'Undo'}
      </button>
      
      {error && !error.includes('No previous version') && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
